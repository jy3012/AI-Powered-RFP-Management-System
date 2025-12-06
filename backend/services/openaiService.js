require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const enqueue = require('./queueService');

// Load API key and model from env
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
if (!GEMINI_KEY) {
  throw new Error('Missing GEMINI_API_KEY in .env');
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Model candidates to try (fallback if one fails)
// Prioritize 2.5/2.0 Flash, then fallback to older versions
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash'
].filter(Boolean);

async function geminiRequest(prompt, opts = {}) {
  let lastError;
  
  // Try each model candidate until one works
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text();
      
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      lastError = err;
      
      // If model not found, try next candidate
      if (msg.includes('not found') || msg.includes('404')) {
        console.warn(`Model "${modelName}" not found, trying next...`);
        continue;
      }
      
      // Other errors (quota, auth, etc) - throw immediately
      console.error(`Gemini Error with ${modelName}:`, err.message);
      throw err;
    }
  }
  
  // All models failed
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}. Try setting GEMINI_MODEL=gemini-pro in .env`);
}

// Public wrapper — all calls go through queue to avoid hitting quota
async function chat(prompt) {
  return enqueue(() => geminiRequest(prompt));
}


// Utility: parse JSON from model output (strip fences)
function parseJsonString(raw) {
if (!raw) throw new Error('Empty AI response');
const trimmed = raw.trim();
const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
const candidate = fence ? fence[1] : trimmed;
return JSON.parse(candidate);
}


// RFP functions
async function extractRFPFromText(text) {
const prompt = `Extract the following RFP fields in JSON: title, items (name, qty, specs), budget (number), delivery_days (number), payment_terms, warranty.\nInput:\n${text}\nReturn ONLY valid JSON.`;
const out = await chat(prompt);
return parseJsonString(out);
}


async function parseVendorEmail(rawEmail, subject = '') {
  const prompt = `You are an expert at extracting structured proposal data from vendor emails. Vendor emails can be messy: free-form text, tables, lists, or mixed formats.

Extract ALL relevant proposal details from this vendor email into a JSON object. Be thorough and extract everything you can find.

Email Subject: ${subject}
Email Content:
${rawEmail}

Extract and return a JSON object with these fields:
{
  "total_cost": <number> (extract the total price/cost, handle currency symbols like $, €, £, remove commas),
  "currency": <string> (e.g., "USD", "EUR", "GBP" - infer from symbols or text),
  "delivery_days": <number> (extract delivery time in days, or null if not specified),
  "delivery_date": <string> (specific delivery date if mentioned, or null),
  "warranty": <string> (warranty terms, duration, coverage),
  "payment_terms": <string> (e.g., "Net 30", "50% upfront", "COD"),
  "item_breakdown": [
    {
      "name": <string> (item/product name),
      "qty": <number> (quantity),
      "unit_price": <number> (price per unit),
      "total_price": <number> (qty * unit_price),
      "specs": <string> (any specifications mentioned)
    }
  ],
  "notes": <string> (any additional terms, conditions, or notes),
  "contact_info": {
    "name": <string> (vendor contact name if mentioned),
    "phone": <string> (phone number if mentioned),
    "email": <string> (contact email if different from sender)
  },
  "valid_until": <string> (proposal validity/expiry date if mentioned, or null)
}

Important:
- Extract numbers even if they have currency symbols or commas (e.g., "$1,234.56" → 1234.56)
- If delivery is mentioned as "2 weeks", convert to days (14)
- If item breakdown is in a table, extract each row
- If only total cost is given without breakdown, set item_breakdown to empty array
- Be flexible with formats - vendors may write "total: $50,000" or "price: 50000 USD" or similar
- If a field is not found, use null (not empty string)

Return ONLY valid JSON, no markdown, no code fences, no explanations.`;
  
  const out = await chat(prompt);
  return parseJsonString(out);
}


async function compareProposals(rfp, proposals) {
const prompt = `Compare proposals against RFP. 

RFP Requirements:
${JSON.stringify(rfp, null, 2)}

Proposals to Compare:
${JSON.stringify(proposals, null, 2)}

For each proposal, score on:
- priceScore (0-10, lower price = higher score)
- deliveryScore (0-10, faster delivery = higher score)  
- matchScore (0-10, better spec match = higher score)
- finalScore (average of the three)
- reason (brief explanation)

Return ONLY a JSON array like:
[
  {
    "vendorId": "use the vendorId from the proposal",
    "proposalId": "use the proposalId from the proposal",
    "priceScore": 8,
    "deliveryScore": 7,
    "matchScore": 9,
    "finalScore": 8,
    "reason": "Best match with competitive pricing"
  }
]`;
const out = await chat(prompt);
return parseJsonString(out);
}


async function chatWithAI(messages) {
  // Convert messages array to a single prompt for Gemini
  const conversation = messages.map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
  ).join('\n\n');
  
  const prompt = `You are a helpful assistant for creating and refining RFPs (Request for Proposals). 
Help users improve their RFP descriptions by suggesting:
- Missing details (quantities, specifications, budget, delivery timeline, payment terms, warranty)
- Better wording and clarity
- Industry best practices

Conversation so far:
${conversation}

Provide a helpful, concise response.`;
  
  const response = await chat(prompt);
  return response;
}

module.exports = {
extractRFPFromText,
parseVendorEmail,
compareProposals,
chatWithAI,
};