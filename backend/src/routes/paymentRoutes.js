const express = require('express');
const router = express.Router();
const multer = require('multer');
const paymentController = require('../controllers/paymentController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PNG, JPG, JPEG files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Routes
router.post('/', paymentController.create);
router.get('/', paymentController.findAll);
router.get('/tenant/:tenant_id', paymentController.getByTenant);
router.get('/:id', paymentController.findOne);
router.get('/:id/receipt', paymentController.downloadReceipt);
router.patch('/:id/status', paymentController.updateStatus);
router.post('/:id/proof', upload.single('proof'), paymentController.uploadProof);
router.delete('/:id', paymentController.delete);

module.exports = router;