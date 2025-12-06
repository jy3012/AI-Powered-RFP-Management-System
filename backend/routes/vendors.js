const express = require('express');
const router = express.Router();
const { createVendor, listVendors } = require('../controllers/vendorController');

router.post('/', createVendor);
router.get('/', listVendors);

module.exports = router;
