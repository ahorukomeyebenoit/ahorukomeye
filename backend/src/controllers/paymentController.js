const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const Ledger = require('../models/Ledger');
const Unit = require('../models/Unit');
const Infrastructure = require('../models/Infrastructure');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { generateReceipt } = require('../services/pdfService');

// Generate unique payment reference
const generatePaymentReference = async (transaction) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  // Count today's payments to get next sequence
  const todayStart = new Date(yyyy, now.getMonth(), now.getDate());
  const todayEnd = new Date(yyyy, now.getMonth(), now.getDate() + 1);

  const count = await Payment.count({
    where: {
      created_at: {
        [Op.gte]: todayStart,
        [Op.lt]: todayEnd
      }
    },
    transaction
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `PAY-${dateStr}-${sequence}`;
};

// Record a payment (with FIFO)
exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { tenant_id, amount, payment_method, reference, description, notes } = req.body;

    const tenant = await Tenant.findByPk(tenant_id, { transaction });
    if (!tenant) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const ledgers = await Ledger.findAll({
      where: {
        tenant_id,
        status: { [Op.in]: ['unpaid', 'partially_paid'] },
        balance: { [Op.gt]: 0 }
      },
      order: [['period_start', 'ASC']],
      transaction
    });

    // If no ledgers exist, auto-create one for the current month
    if (ledgers.length === 0) {
      const tenant_unit = await Unit.findByPk(tenant.unit_id, { transaction });

      if (!tenant_unit) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Tenant has no unit assigned. Assign a unit first.'
        });
      }

      // Create ledger for current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);

      const formatDate = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const newLedger = await Ledger.create({
        tenant_id,
        unit_id: tenant.unit_id,
        period_start: formatDate(monthStart),
        period_end: formatDate(monthEnd),
        amount_due: tenant_unit.monthly_rent,
        amount_paid: 0,
        balance: tenant_unit.monthly_rent,
        status: 'unpaid',
        due_date: formatDate(dueDate)
      }, { transaction });

      ledgers.push(newLedger);
    }

    // ✅ AUTO-GENERATE REFERENCE
    const finalReference = reference || await generatePaymentReference(transaction);
    console.log('💡 Final reference:', finalReference, '(from body:', reference, ')');
    let remainingAmount = parseFloat(amount);
    let paymentRecords = [];

    // Apply payment to oldest debt first (FIFO)
    for (const ledger of ledgers) {
      if (remainingAmount <= 0) break;

      const balance = parseFloat(ledger.balance);
      const amountToPay = Math.min(remainingAmount, balance);
      const newBalance = balance - amountToPay;
      const paidAmount = amountToPay;

      await ledger.update({
        amount_paid: parseFloat(ledger.amount_paid) + paidAmount,
        balance: newBalance,
        status: newBalance === 0 ? 'paid' : 'partially_paid',
        paid_date: newBalance === 0 ? new Date() : null
      }, { transaction });

      const payment = await Payment.create({
        tenant_id,
        ledger_id: ledger.id,
        amount: paidAmount,
        payment_method,
        payment_date: new Date(),
        reference: finalReference,
        description,
        notes,
        status: 'completed'
      }, { transaction });

      paymentRecords.push(payment);
      remainingAmount -= paidAmount;
    }

    // If there's remaining amount, apply to next month
    if (remainingAmount > 0) {
      const lastLedger = ledgers[ledgers.length - 1];
      const nextMonthStart = new Date(lastLedger.period_start);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

      const nextLedger = await Ledger.findOne({
        where: { tenant_id, period_start: nextMonthStart },
        transaction
      });

      if (nextLedger) {
        await nextLedger.update({
          amount_paid: parseFloat(nextLedger.amount_paid) + remainingAmount,
          balance: parseFloat(nextLedger.amount_due) - (parseFloat(nextLedger.amount_paid) + remainingAmount),
          status: 'partially_paid'
        }, { transaction });

        const payment = await Payment.create({
          tenant_id,
          ledger_id: nextLedger.id,
          amount: remainingAmount,
          payment_method,
          payment_date: new Date(),
          reference: finalReference,
          description: description + ' (Advance payment)',
          notes,
          status: 'completed'
        }, { transaction });

        paymentRecords.push(payment);
      } else {
        const unit = await Unit.findByPk(tenant.unit_id, { transaction });
        if (unit) {
          const newLedger = await Ledger.create({
            tenant_id,
            unit_id: tenant.unit_id,
            period_start: nextMonthStart,
            period_end: new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 0),
            amount_due: unit.monthly_rent,
            amount_paid: remainingAmount,
            balance: unit.monthly_rent - remainingAmount,
            status: remainingAmount >= unit.monthly_rent ? 'paid' : 'partially_paid',
            due_date: new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), 10)
          }, { transaction });

          const payment = await Payment.create({
            tenant_id,
            ledger_id: newLedger.id,
            amount: remainingAmount,
            payment_method,
            payment_date: new Date(),
            reference: finalReference,
            description: description + ' (Advance payment)',
            notes,
            status: 'completed'
          }, { transaction });

          paymentRecords.push(payment);
        }
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        payments: paymentRecords,
        total_paid: amount,
        remaining_balance: remainingAmount,
        reference: finalReference
      },
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all payments
exports.findAll = async (req, res) => {
  try {
    const { tenant_id, status, start_date, end_date } = req.query;
    const where = {};

    if (tenant_id) where.tenant_id = tenant_id;
    if (status) where.status = status;
    if (start_date && end_date) {
      where.payment_date = { [Op.between]: [start_date, end_date] };
    }

    const payments = await Payment.findAll({
      where,
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        { model: Ledger, as: 'ledger', attributes: ['id', 'period_start', 'period_end', 'amount_due'] }
      ],
      order: [['payment_date', 'DESC']]
    });

    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({ success: true, data: payments, total, count: payments.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single payment
exports.findOne = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        { model: Ledger, as: 'ledger', attributes: ['id', 'period_start', 'period_end', 'amount_due'] }
      ]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await payment.update({ status });
    res.json({
      success: true,
      data: payment,
      message: `Payment status updated to ${status}`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get payments by tenant
exports.getByTenant = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const payments = await Payment.findAll({
      where: { tenant_id },
      include: [
        { model: Ledger, as: 'ledger', attributes: ['id', 'period_start', 'period_end', 'amount_due'] }
      ],
      order: [['payment_date', 'DESC']]
    });

    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({ success: true, data: payments, total, count: payments.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload proof file
exports.uploadProof = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only PDF, PNG, JPG, JPEG files are allowed' });
    }

    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size must be less than 2MB' });
    }

    await payment.update({
      proof_file: req.file.path,
      proof_type: req.file.mimetype,
      proof_size: req.file.size
    });

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        proof_file: req.file.path,
        proof_type: req.file.mimetype,
        proof_size: req.file.size
      },
      message: 'Proof uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete payment (soft delete)
exports.delete = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const payment = await Payment.findByPk(req.params.id, { transaction });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const ledger = await Ledger.findByPk(payment.ledger_id, { transaction });
    if (ledger) {
      const newAmountPaid = parseFloat(ledger.amount_paid) - parseFloat(payment.amount);
      const newBalance = parseFloat(ledger.amount_due) - newAmountPaid;
      await ledger.update({
        amount_paid: newAmountPaid,
        balance: newBalance,
        status: newBalance === 0 ? 'paid' : newBalance === parseFloat(ledger.amount_due) ? 'unpaid' : 'partially_paid'
      }, { transaction });
    }

    await payment.destroy({ transaction });
    await transaction.commit();

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download payment receipt PDF
exports.downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the payment
    const payment = await Payment.findByPk(id, {
      include: [
        { model: Tenant, as: 'tenant' },
        { model: Ledger, as: 'ledger' }
      ]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Get all payments with the same reference (FIFO group)
    let paymentGroup = [payment];

    if (payment.reference) {
      const relatedPayments = await Payment.findAll({
        where: {
          reference: payment.reference,
          tenant_id: payment.tenant_id
        },
        include: [{ model: Ledger, as: 'ledger' }],
        order: [['created_at', 'ASC']]
      });

      if (relatedPayments.length > 0) {
        paymentGroup = relatedPayments;
      }
    }

    // Get tenant + unit + infrastructure
    const tenant = payment.tenant;
    let unit = null;
    let infrastructure = null;

    if (tenant.unit_id) {
      unit = await Unit.findByPk(tenant.unit_id, {
        include: [{ model: Infrastructure, as: 'infrastructure' }]
      });
      infrastructure = unit?.infrastructure;
    }

    // Get ALL unpaid ledgers for this tenant (to show outstanding dues)
    const allLedgers = await Ledger.findAll({
      where: {
        tenant_id: tenant.id,
        balance: { [Op.gt]: 0 }
      },
      order: [['period_start', 'ASC']]
    });

    // Ensure receipts folder exists
    const receiptsDir = path.join(__dirname, '../../receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const fileName = `receipt-${payment.id.slice(0, 8)}-${Date.now()}.pdf`;
    const outputPath = path.join(receiptsDir, fileName);

    await generateReceipt(paymentGroup, tenant, unit, infrastructure, allLedgers, outputPath);

    // Send file
    res.download(outputPath, `Receipt-${payment.id.slice(0, 8).toUpperCase()}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    console.error('Receipt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};