const { extractRFPFromText, compareProposals, chatWithAI } = require('../services/openaiService');
const Rfp = require('../models/Rfp');
const Vendor = require('../models/Vendor');
const Proposal = require('../models/Proposal');
const { sendRfpEmail } = require('../services/emailService');

async function generateRfp(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text in body' });

    const rfpJson = await extractRFPFromText(text);
    
    // Save RFP to database
    const rfp = await Rfp.create({
      title: rfpJson.title || 'Untitled RFP',
      description: text,
      requirements: {
        items: rfpJson.items ?? [],
        budget: rfpJson.budget ?? null,
        delivery_days: rfpJson.delivery_days ?? null,
        payment_terms: rfpJson.payment_terms ?? null,
        warranty: rfpJson.warranty ?? null
      }
    });

    return res.json(rfp);
  } catch (err) {
    console.error('generateRfp error', err);
    return res.status(500).json({ error: err.message || 'AI failure' });
  }
}

async function listRfps(req, res) {
  try {
    const rfps = await Rfp.find()
      .populate('vendors')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get proposal counts for each RFP
    const rfpsWithCounts = await Promise.all(
      rfps.map(async (rfp) => {
        const proposalCount = await Proposal.countDocuments({ rfp: rfp._id });
        return {
          ...rfp,
          proposalCount
        };
      })
    );
    
    res.json(rfpsWithCounts);
  } catch (err) {
    console.error('listRfps error', err);
    return res.status(500).json({ error: err.message || 'Failed to load RFPs' });
  }
}

async function getRfpById(req, res) {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid RFP ID' });
    }
    
    const rfp = await Rfp.findById(id).populate('vendors').lean();
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }
    
    const proposalCount = await Proposal.countDocuments({ rfp: id });
    res.json({ ...rfp, proposalCount });
  } catch (err) {
    console.error('getRfpById error', err);
    return res.status(500).json({ error: err.message || 'Failed to load RFP' });
  }
}

async function sendRfp(req, res) {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid RFP ID' });
    }
    const { vendorIds } = req.body;
    
    const rfp = await Rfp.findById(id);
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });

    const vendors = await Vendor.find({ _id: { $in: vendorIds } });
    const results = [];
    
    // Update RFP to include vendors (for IMAP matching)
    await Rfp.findByIdAndUpdate(id, {
      $addToSet: { vendors: { $each: vendorIds } }
    });
    
    for (const v of vendors) {
      try {
        const info = await sendRfpEmail(v, rfp);
        results.push({ vendor: v.email, info });
      } catch (err) {
        results.push({ vendor: v.email, error: err.message });
      }
    }
    
    res.json({ sent: results });
  } catch (err) {
    console.error('sendRfp error', err);
    return res.status(500).json({ error: err.message || 'Failed to send RFP' });
  }
}

async function getProposalsForRfp(req, res) {
  try {
    const { id } = req.params;
    console.log('Getting proposals for RFP:', id);
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid RFP ID' });
    }
    
    // Verify RFP exists
    const rfpExists = await Rfp.findById(id);
    if (!rfpExists) {
      console.log('RFP not found:', id);
      return res.status(404).json({ error: 'RFP not found' });
    }
    
    // Get proposals for this RFP - try both ObjectId and string matching
    let proposals = await Proposal.find({ rfp: id }).populate('vendor');
    
    // If no proposals found, try with string conversion
    if (proposals.length === 0) {
      proposals = await Proposal.find({ rfp: id.toString() }).populate('vendor');
    }
    
    // Also check for unassigned proposals from vendors associated with this RFP
    // These are proposals that were received but couldn't be matched to an RFP automatically
    if (rfpExists.vendors && rfpExists.vendors.length > 0) {
      const unassigned = await Proposal.find({
        rfp: null,
        vendor: { $in: rfpExists.vendors },
        receivedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).populate('vendor').sort({ receivedAt: -1 }).limit(10);
      
      if (unassigned.length > 0) {
        console.log(`Found ${unassigned.length} unassigned proposals that might belong to this RFP`);
        // Add unassigned proposals to the response (mark them as unassigned)
        proposals = [...proposals, ...unassigned.map(p => ({ ...p.toObject(), isUnassigned: true }))];
      }
    }
    
    console.log(`Found ${proposals.length} total proposals for RFP ${id} (${proposals.filter(p => p.isUnassigned).length} unassigned)`);
    res.json(proposals || []);
  } catch (err) {
    console.error('getProposalsForRfp error', err);
    return res.status(500).json({ error: err.message || 'Failed to load proposals' });
  }
}

async function assignProposalToRfp(req, res) {
  try {
    const { proposalId, rfpId } = req.body;
    if (!proposalId || !rfpId) {
      return res.status(400).json({ error: 'Missing proposalId or rfpId' });
    }
    
    const proposal = await Proposal.findByIdAndUpdate(proposalId, { rfp: rfpId }, { new: true });
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    res.json({ success: true, proposal });
  } catch (err) {
    console.error('assignProposalToRfp error', err);
    return res.status(500).json({ error: err.message || 'Failed to assign proposal' });
  }
}

async function compare(req, res) {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid RFP ID' });
    }
    const rfp = await Rfp.findById(id).lean();
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });
    
    const proposals = await Proposal.find({ rfp: id }).populate('vendor').lean();
    
    if (proposals.length === 0) {
      return res.status(400).json({ error: 'No proposals found for this RFP' });
    }
    
    // Prepare proposals for AI compare - include both proposal ID and vendor info
    const proposalsForAI = proposals.map(p => ({
      proposalId: p._id.toString(),
      vendorId: p.vendor?._id?.toString() || '',
      vendor: p.vendor?.name || p.vendor?.email || 'Unknown',
      parsed: p.parsed
    }));
    
    const aiScores = await compareProposals(rfp, proposalsForAI);
    
    // Create a map of proposal IDs for quick lookup
    const proposalMap = new Map();
    proposalsForAI.forEach(p => {
      proposalMap.set(p.proposalId, p);
      proposalMap.set(p.vendorId, p); // Also map by vendorId in case AI uses that
    });
    
    // Update DB scores - match AI response to proposals
    const updatedScores = [];
    for (const s of aiScores) {
      // Try to find proposal by vendorId or proposalId from AI response
      let matchedProposal = null;
      if (s.vendorId) {
        matchedProposal = proposalsForAI.find(p => 
          p.vendorId === s.vendorId || p.proposalId === s.vendorId
        );
      }
      if (!matchedProposal && s.proposalId) {
        matchedProposal = proposalsForAI.find(p => p.proposalId === s.proposalId);
      }
      // Fallback: match by index if array order is preserved
      if (!matchedProposal && Array.isArray(aiScores)) {
        const index = aiScores.indexOf(s);
        if (index >= 0 && index < proposalsForAI.length) {
          matchedProposal = proposalsForAI[index];
        }
      }
      
      if (matchedProposal) {
        await Proposal.findByIdAndUpdate(matchedProposal.proposalId, {
          score: {
            price: s.priceScore || s.price || 0,
            delivery: s.deliveryScore || s.delivery || 0,
            match: s.matchScore || s.match || 0,
            final_score: s.finalScore || s.final || 0
          }
        });
        updatedScores.push({ ...s, proposalId: matchedProposal.proposalId });
      }
    }
    
    res.json({ aiScores: updatedScores.length > 0 ? updatedScores : aiScores });
  } catch (err) {
    console.error('compare error', err);
    return res.status(500).json({ error: err.message || 'AI comparison failed' });
  }
}

async function scoreProposals(req, res) {
  try {
    const { rfp, proposals } = req.body;
    if (!rfp || !proposals) return res.status(400).json({ error: 'Missing rfp or proposals' });
    const scores = await compareProposals(rfp, proposals);
    return res.json({ ok: true, scores });
  } catch (err) {
    console.error('scoreProposals error', err);
    return res.status(500).json({ error: err.message || 'AI failure' });
  }
}

async function chat(req, res) {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    const response = await chatWithAI(messages);
    res.json({ message: response });
  } catch (err) {
    console.error('chat error', err);
    return res.status(500).json({ error: err.message || 'AI chat failed' });
  }
}

async function createProposal(req, res) {
  try {
    const { rfpId, vendorId, proposalText } = req.body;
    
    if (!rfpId || !vendorId || !proposalText) {
      return res.status(400).json({ error: 'Missing rfpId, vendorId, or proposalText' });
    }
    
    // Verify RFP and vendor exist
    const rfp = await Rfp.findById(rfpId);
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    
    // Parse proposal text with AI
    const { parseVendorEmail } = require('../services/openaiService');
    let parsedJson = null;
    try {
      parsedJson = await parseVendorEmail(proposalText);
    } catch (err) {
      console.error('Error parsing proposal:', err);
      // Still create proposal even if parsing fails
    }
    
    // Create proposal
    const proposal = await Proposal.create({
      vendor: vendorId,
      rfp: rfpId,
      rawEmail: proposalText,
      parsed: parsedJson
    });
    
    const populated = await Proposal.findById(proposal._id).populate('vendor');
    res.json(populated);
  } catch (err) {
    console.error('createProposal error', err);
    return res.status(500).json({ error: err.message || 'Failed to create proposal' });
  }
}

async function getAllProposals(req, res) {
  try {
    const proposals = await Proposal.find()
      .populate('vendor')
      .populate('rfp')
      .sort({ receivedAt: -1 })
      .limit(100);
    
    res.json(proposals);
  } catch (err) {
    console.error('getAllProposals error', err);
    return res.status(500).json({ error: err.message || 'Failed to load proposals' });
  }
}

module.exports = { generateRfp, listRfps, getRfpById, sendRfp, getProposalsForRfp, compare, scoreProposals, assignProposalToRfp, chat, createProposal, getAllProposals };