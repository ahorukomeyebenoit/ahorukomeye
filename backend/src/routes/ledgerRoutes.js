const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.post('/generate', ledgerController.generateMonthlyDues);
router.get('/', ledgerController.findAll);
router.get('/balance/:tenant_id', ledgerController.getTenantBalance);
router.get('/:id', ledgerController.findOne);
router.put('/:id', ledgerController.update);

module.exports = router;