const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

router.post('/', unitController.create);
router.get('/', unitController.findAll);
router.get('/available', unitController.getAvailable);
router.get('/:id', unitController.findOne);
router.put('/:id', unitController.update);
router.patch('/:id/status', unitController.updateStatus);
router.delete('/:id', unitController.delete);

module.exports = router;