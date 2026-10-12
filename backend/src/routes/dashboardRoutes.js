const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.get('/', authenticate, dashboardController.getDashboard);

module.exports = router;