const Proposal = require("../models/Proposal");
const Vendor = require("../models/Vendor");
const Rfp = require("../models/Rfp");
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// --------------------- HANDLE INCOMING EMAIL WEBHOOK -------------------
exports.handleIncomingEmail = async (req, res) => {
  try {
    const { from, subject, text } = req.body;

    if (!from || !text)
      return res.status(400).json({ success: false, message: "Invalid email payload" });

    // identify vendor
    const vendor = await Vendor.findOne({ email: from });

    if (!vendor)
      return res.status(404).json({ success: false, message: "Unknown vendor email" });

    // send email text to AI to extract proposal
    const aiResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content:
            `Extract structured proposal data from this vendor email:

Email:
${text}

Output JSON with fields:
{
 "pricing": "",
 "warranty": "",
 "delivery_time": "",
 "payment_terms": "",
 "items": []
}
`
        }
      ],
    });

    const parsedData = JSON.parse(aiResponse.content[0].text || "{}");

    const newProposal = await Proposal.create({
      vendorId: vendor._id,
      rfpId: req.body.rfpId, // must be passed in webhook
      proposalData: parsedData,
      rawEmail: text,
    });

    res.status(201).json({
      success: true,
      message: "Proposal parsed and saved",
      proposal: newProposal,
    });

  } catch (err) {
    console.error("Webhook Error: ", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
