const Vendor = require('../models/Vendor');

async function createVendor(req, res) {
  const { name, email, contact } = req.body;
  const vendor = await Vendor.create({ name, email, contact });
  res.json(vendor);
}

async function listVendors(req, res) {
  const vendors = await Vendor.find();
  res.json(vendors);
}

module.exports = { createVendor, listVendors };
