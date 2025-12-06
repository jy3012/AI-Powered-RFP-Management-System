const express = require('express');
const router = express.Router();
const { generateRfp, listRfps, getRfpById, sendRfp, getProposalsForRfp, compare, scoreProposals, assignProposalToRfp, chat, createProposal, getAllProposals } = require('../controllers/rfpController');

router.post('/generate', generateRfp);
router.get('/list', listRfps);
router.get('/proposals/all', getAllProposals); // Debug endpoint
router.post('/score', scoreProposals);
router.post('/assign-proposal', assignProposalToRfp);
router.post('/chat', chat);
router.post('/proposal/create', createProposal);
// Specific routes must come before generic :id route
router.post('/:id/send', sendRfp);
router.get('/:id/proposals', getProposalsForRfp);
router.get('/:id/compare', compare);
router.get('/:id', getRfpById);

module.exports = router;