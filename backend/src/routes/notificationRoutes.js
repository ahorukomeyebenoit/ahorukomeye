const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/test', notificationController.testEmail);
router.get('/test-whatsapp', notificationController.testWhatsApp);
router.get('/test-sms', notificationController.testSMS);
router.post('/rent-reminder', notificationController.sendRentReminder);
router.post('/payment-receipt', notificationController.sendPaymentReceipt);
router.post('/welcome', notificationController.sendWelcome);
router.post('/overdue', notificationController.sendOverdue);
router.post('/custom', notificationController.sendCustom);
router.post('/custom-whatsapp', notificationController.sendCustomWhatsApp);
router.post('/custom-sms', notificationController.sendCustomSMS);

module.exports = router;