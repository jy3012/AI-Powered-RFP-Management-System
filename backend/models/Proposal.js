const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProposalSchema = new Schema({
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  rfp: { type: Schema.Types.ObjectId, ref: 'RFP' },
  rawEmail: String,
  emailSubject: String,
  emailDate: Date,
  hasAttachments: { type: Boolean, default: false },
  attachmentInfo: [{ filename: String, contentType: String, size: Number }],
  parsed: {
    total_cost: Number,
    currency: String,
    delivery_days: Number,
    delivery_date: String,
    warranty: String,
    payment_terms: String,
    item_breakdown: [{ 
      name: String, 
      qty: Number, 
      unit_price: Number, 
      total_price: Number,
      specs: String 
    }],
    notes: String,
    contact_info: {
      name: String,
      phone: String,
      email: String
    },
    valid_until: String
  },
  score: {
    price: Number,
    delivery: Number,
    match: Number,
    final_score: Number,
    reason: String
  },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', ProposalSchema);
