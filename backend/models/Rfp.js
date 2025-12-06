const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RfpSchema = new Schema({
  title: String,
  description: String,
  requirements: {
    items: [{ name: String, qty: Number, specs: String }],
    budget: Number,
    delivery_days: Number,
    payment_terms: String,
    warranty: String
  },
  vendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RFP', RfpSchema);
