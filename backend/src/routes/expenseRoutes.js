const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All expense routes require authentication
router.use(authenticate);

// Stats and summaries (must be before /:id)
router.get('/summary', expenseController.getSummary);
router.get('/pending', authorize('admin'), expenseController.getPending);

// CRUD
router.post('/', authorize('admin', 'manager'), expenseController.create);
router.get('/', authorize('admin', 'manager'), expenseController.findAll);
router.get('/:id', authorize('admin', 'manager'), expenseController.findOne);
router.put('/:id', authorize('admin', 'manager'), expenseController.update);

// Approval workflow (admin only)
router.patch('/:id/approve', authorize('admin'), expenseController.approve);
router.patch('/:id/reject', authorize('admin'), expenseController.reject);

// Delete (admin only)
router.delete('/:id', authorize('admin'), expenseController.delete);

module.exports = router;