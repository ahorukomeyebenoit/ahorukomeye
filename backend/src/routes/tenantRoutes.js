const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

router.post('/', tenantController.create);
router.get('/', tenantController.findAll);
router.get('/unit/:unit_id', tenantController.getByUnit);
router.get('/:id', tenantController.findOne);
router.put('/:id', tenantController.update);
router.delete('/:id', tenantController.delete);

module.exports = router;