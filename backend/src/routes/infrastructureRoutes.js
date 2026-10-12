const express = require('express');
const router = express.Router();
const infrastructureController = require('../controllers/infrastructureController');

router.post('/', infrastructureController.create);
router.get('/', infrastructureController.findAll);
router.get('/:id', infrastructureController.findOne);
router.put('/:id', infrastructureController.update);
router.delete('/:id', infrastructureController.delete);

module.exports = router;