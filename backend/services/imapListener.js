const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: (process.env.IMAP_TLS || 'true') !== 'false',
    // allow self-signed certs for development/low-trust mail servers
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: parseInt(process.env.IMAP_AUTH_TIMEOUT || '10000'),
    connTimeout: parseInt(process.env.IMAP_CONN_TIMEOUT || '10000')
  }
};
const Proposal = require('../models/Proposal');
const Vendor = require('../models/Vendor');
const Rfp = require('../models/Rfp');
const { parseVendorEmail } = require('./openaiService');

const AI_COOLDOWN_MS = parseInt(process.env.IMAP_AI_COOLDOWN_MS || process.env.OPENAI_QUOTA_COOLDOWN_MS || '300000'); // 5 min default
const POLL_INTERVAL = parseInt(process.env.IMAP_POLL_INTERVAL || '10000'); // 10s default
let aiCooldownUntil = 0;

// Helper: Extract clean text from HTML
function extractTextFromHtml(html) {
  if (!html) return '';
  // Remove HTML tags, decode entities, normalize whitespace
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Check for duplicate proposals (same vendor + RFP within 24 hours)
async function isDuplicateProposal(vendorId, rfpId, emailText) {
  if (!rfpId) return false;
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check if proposal exists for this vendor+RFP recently
  const existing = await Proposal.findOne({
    vendor: vendorId,
    rfp: rfpId,
    receivedAt: { $gte: oneDayAgo }
  });
  
  if (existing) {
    // Also check if content is very similar (simple length check)
    const lengthDiff = Math.abs((existing.rawEmail?.length || 0) - emailText.length);
    if (lengthDiff < 50) { // Very similar length = likely duplicate
      return true;
    }
  }
  
  return false;
}

let imapConnection = null;
let imapStatus = 'stopped';
let pollingInterval = null;
let reconnectTimeout = null;
const RECONNECT_DELAY = 30000; // 30 seconds

// Helper: Create IMAP connection with error handling
async function createImapConnection() {
  try {
    console.log(`🔌 Connecting to IMAP server: ${config.imap.host}:${config.imap.port}...`);
    imapStatus = 'connecting';
    const connection = await imaps.connect(config);
    
    // Add error handlers to prevent unhandled errors
    connection.on('error', (err) => {
      console.error('❌ IMAP connection error:', err.message);
      imapStatus = 'error';
      imapConnection = null;
      // Schedule reconnection
      scheduleReconnect();
    });
    
    connection.on('close', () => {
      console.log('⚠️  IMAP connection closed');
      imapStatus = 'disconnected';
      imapConnection = null;
      // Schedule reconnection
      scheduleReconnect();
    });
    
    await connection.openBox('INBOX');
    imapStatus = 'connected';
    console.log(`✅ Connected to IMAP inbox: ${config.imap.user}`);
    return connection;
  } catch (err) {
    console.error('❌ Failed to connect to IMAP:', err.message);
    imapStatus = 'error';
    throw err;
  }
}

// Helper: Schedule reconnection
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  reconnectTimeout = setTimeout(async () => {
    console.log('🔄 Attempting to reconnect to IMAP...');
    try {
      await startImap();
    } catch (err) {
      console.error('❌ Reconnection failed, will retry in 30s:', err.message);
      scheduleReconnect();
    }
  }, RECONNECT_DELAY);
}

async function startImap(rfpMap = {}) {
  // Skip IMAP if not configured
  if (!config.imap.user || !config.imap.password || !config.imap.host) {
    console.log('⚠️  IMAP not configured; skipping listener');
    console.log('💡 Set IMAP_USER, IMAP_PASS, and IMAP_HOST in .env to enable email processing');
    imapStatus = 'not_configured';
    return;
  }
  
  // Clear any existing polling interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  
  // rfpMap: optional mapping of subject tokens to rfpId (simple approach)
  try {
    imapConnection = await createImapConnection();

    // Start polling with error handling and reconnection
    pollingInterval = setInterval(async () => {
      // Check if connection is still valid
      if (!imapConnection || imapStatus !== 'connected') {
        console.log('⚠️  IMAP connection lost, skipping poll. Will reconnect...');
        if (imapStatus !== 'reconnecting') {
          imapStatus = 'reconnecting';
          scheduleReconnect();
        }
        return;
      }
      
      try {
        // Verify connection is still open
        if (!imapConnection.imap || !imapConnection.imap._socket || imapConnection.imap._socket.destroyed) {
          console.log('⚠️  IMAP socket closed, reconnecting...');
          imapConnection = null;
          imapStatus = 'reconnecting';
          scheduleReconnect();
          return;
        }
        
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { 
          bodies: [''], 
          markSeen: true,
          struct: true // Get structure for attachments
        };

        const messages = await imapConnection.search(searchCriteria, fetchOptions);
        
        if (messages.length > 0) {
          console.log(`📧 Processing ${messages.length} new email(s)...`);
        }
        
        for (const item of messages) {
          try {
            // Check AI cooldown
            if (Date.now() < aiCooldownUntil) {
              console.log('⏸️  Skipping AI parse due to cooldown window');
              continue;
            }
            
            const all = item.parts.find(p => p.which === '');
            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const parsed = await simpleParser(idHeader + all.body);
            
            const from = parsed.from?.value?.[0]?.address;
            const fromName = parsed.from?.value?.[0]?.name || from;
            const subject = parsed.subject || '';
            const date = parsed.date || new Date();
            
            // Extract text content (prefer plain text, fallback to HTML)
            let emailText = parsed.text || '';
            if (!emailText && parsed.html) {
              emailText = extractTextFromHtml(parsed.html);
            }
            
            // Check for attachments
            const attachments = parsed.attachments || [];
            const attachmentInfo = attachments.map(att => ({
              filename: att.filename || 'unnamed',
              contentType: att.contentType || 'unknown',
              size: att.size || 0
            }));
            
            if (attachments.length > 0) {
              console.log(`📎 Email has ${attachments.length} attachment(s): ${attachmentInfo.map(a => a.filename).join(', ')}`);
              // Note: For now, we log attachments but don't parse them
              // Future: Could extract text from PDFs, Excel files, etc.
            }

            if (!emailText || emailText.trim().length < 10) {
              console.log(`⚠️  Skipping email from ${from}: content too short or empty`);
              continue;
            }

            // Find or create vendor by email (case-insensitive)
            let vendor = await Vendor.findOne({ 
              email: { $regex: new RegExp(`^${from}$`, 'i') } 
            });
            let vendorId;
            if (!vendor) {
              vendor = await Vendor.create({ 
                name: fromName || from, 
                email: from.toLowerCase() // Normalize email to lowercase
              });
              console.log(`✅ Created new vendor: ${fromName} (${from})`);
            } else {
              console.log(`✅ Found existing vendor: ${vendor.name} (${vendor.email})`);
            }
            vendorId = vendor._id;

            // Try to match RFP by multiple methods
            let matchedRfpId = null;
            
            // Method 1: Extract RFP ID from subject line (format: "RFP: Title [ID: xyz]")
            const idMatch = subject.match(/\[ID:\s*([a-f0-9]{24})\]/i);
            if (idMatch) {
              matchedRfpId = idMatch[1];
              // Verify RFP exists
              const rfpExists = await Rfp.findById(matchedRfpId);
              if (rfpExists) {
                console.log(`✅ Matched proposal to RFP ${matchedRfpId} from subject line`);
              } else {
                matchedRfpId = null;
              }
            }
            
            // Method 2: Check if vendor was sent an RFP recently (last 30 days)
            if (!matchedRfpId) {
              const recentRfp = await Rfp.findOne({
                vendors: vendorId,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }).sort({ createdAt: -1 });
              
              if (recentRfp) {
                matchedRfpId = recentRfp._id;
                console.log(`✅ Matched proposal to RFP ${matchedRfpId} by vendor association (RFP: ${recentRfp.title})`);
              } else {
                console.log(`⚠️  No recent RFP found for vendor ${vendorId} in last 30 days`);
              }
            }
            
            // Method 3: If subject contains "RFP" or "Re:", try to find most recent RFP sent to this vendor
            if (!matchedRfpId && (subject.toLowerCase().includes('rfp') || subject.toLowerCase().startsWith('re:'))) {
              const recentRfp = await Rfp.findOne({
                vendors: vendorId
              }).sort({ createdAt: -1 });
              
              if (recentRfp) {
                matchedRfpId = recentRfp._id;
                console.log(`✅ Matched proposal to most recent RFP ${matchedRfpId} (subject contains RFP/Re:)`);
              }
            }
            
            // Method 4: Check rfpMap (if provided)
            if (!matchedRfpId && Object.keys(rfpMap).length > 0) {
              matchedRfpId = Object.values(rfpMap).find(id => subject.includes(id)) || null;
            }

            // Check for duplicate proposals
            if (matchedRfpId) {
              const isDuplicate = await isDuplicateProposal(vendorId, matchedRfpId, emailText);
              if (isDuplicate) {
                console.log(`⚠️  Skipping duplicate proposal from ${from} for RFP ${matchedRfpId}`);
                continue;
              }
            }

            // Parse with AI to extract structured proposal data
            let parsedJson = null;
            try {
              console.log(`🤖 Parsing proposal email from ${from} with AI...`);
              parsedJson = await parseVendorEmail(emailText, subject);
              console.log(`✅ AI extracted proposal data:`, JSON.stringify(parsedJson, null, 2));
            } catch (e) {
              const msg = (e?.message || '').toLowerCase();
              const isQuota = e?.status === 429 || e?.code === 'insufficient_quota' || msg.includes('quota') || msg.includes('rate');
              if (isQuota) {
                aiCooldownUntil = Date.now() + AI_COOLDOWN_MS;
                console.error('❌ AI quota/rate limit; entering cooldown until', new Date(aiCooldownUntil).toISOString());
              } else {
                console.error('❌ AI parse error:', e.message);
              }
              // Continue to save proposal even if AI parsing fails
            }

            // Create proposal document (even if RFP matching failed)
            const proposalDoc = await Proposal.create({
              vendor: vendorId,
              rfp: matchedRfpId, // Can be null if no RFP matched
              rawEmail: emailText,
              parsed: parsedJson,
              emailSubject: subject,
              emailDate: date,
              hasAttachments: attachments.length > 0,
              attachmentInfo: attachmentInfo
            });

            const status = matchedRfpId ? `for RFP ${matchedRfpId}` : 'UNASSIGNED (no RFP matched - will appear in RFP detail page)';
            console.log(`✅ Saved proposal ${proposalDoc._id} ${status} from ${fromName} (${from})`);
            
            if (!matchedRfpId) {
              console.log(`⚠️  Proposal not matched to RFP. Subject: "${subject}". Email from: ${from}`);
              console.log(`💡 Tip: Make sure vendor email matches, or include RFP ID in subject: [ID: <rfp_id>]`);
            }
            
            // If proposal was successfully matched to an RFP, log success
            if (matchedRfpId && parsedJson) {
              console.log(`🎉 Real-time proposal received and processed for RFP ${matchedRfpId}!`);
            }
          } catch (itemErr) {
            console.error(`❌ Error processing email item:`, itemErr.message);
            // Continue processing other emails
          }
        }
      } catch (err) {
        const errMsg = err.message || err.toString();
        console.error('❌ IMAP polling error:', errMsg);
        
        // Check if it's a connection error
        if (errMsg.includes('ECONNRESET') || 
            errMsg.includes('ECONNREFUSED') || 
            errMsg.includes('ETIMEDOUT') ||
            errMsg.includes('socket') ||
            errMsg.includes('connection')) {
          console.log('⚠️  Connection error detected, will reconnect...');
          imapConnection = null;
          imapStatus = 'reconnecting';
          scheduleReconnect();
        }
        // Don't throw - keep polling or reconnect
      }
    }, POLL_INTERVAL);
    imapStatus = 'running';
    console.log(`✅ IMAP listener started (polling every ${POLL_INTERVAL/1000}s)`);
    console.log(`📧 Monitoring inbox: ${config.imap.user}@${config.imap.host}`);
  } catch (err) {
    imapStatus = 'error';
    console.error('❌ IMAP start error:', err.message || err);
    console.error('💡 Check your IMAP credentials and server settings in .env');
    
    // Schedule reconnection attempt
    scheduleReconnect();
    
    // Don't throw - allow server to continue without IMAP
  }
}

// Cleanup function
function stopImap() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  if (imapConnection) {
    try {
      imapConnection.end();
    } catch (err) {
      // Ignore errors during cleanup
    }
    imapConnection = null;
  }
  
  imapStatus = 'stopped';
  console.log('🛑 IMAP listener stopped');
}

function getImapStatus() {
  return {
    status: imapStatus,
    configured: !!(config.imap.user && config.imap.password && config.imap.host),
    host: config.imap.host,
    user: config.imap.user ? config.imap.user.replace(/(.{3}).*(@.*)/, '$1***$2') : null, // Mask email
    pollInterval: POLL_INTERVAL
  };
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  stopImap();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopImap();
  process.exit(0);
});

module.exports = { startImap, getImapStatus, stopImap };
