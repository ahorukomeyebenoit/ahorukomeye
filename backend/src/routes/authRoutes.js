const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// PUBLIC ROUTES
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/accept-invite', authController.acceptInvite);
router.get('/verify-email', authController.verifyEmail);

// AUTHENTICATED ROUTES
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);
router.get('/team', authenticate, authController.getTeam);
router.put('/change-password', authenticate, authController.changePassword);

// ADMIN ROUTES
router.post('/invite-manager', authenticate, authorize('admin'), authController.inviteManager);

// INVITE TENANT
router.post('/invite-tenant', authenticate, authorize('admin', 'manager'), authController.inviteTenant);

module.exports = router;