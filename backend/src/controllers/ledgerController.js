const Ledger = require('../models/Ledger');
const Tenant = require('../models/Tenant');
const Unit = require('../models/Unit');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Generate monthly dues for a tenant
exports.generateMonthlyDues = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { tenant_id, month, year } = req.body;

    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
    }

    const tenant = await Tenant.findByPk(tenant_id, { transaction });
    if (!tenant) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (!tenant.unit_id) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tenant has no unit assigned' });
    }

    const unit = await Unit.findByPk(tenant.unit_id, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    // Build dates properly (month is 1-12, JS Date uses 0-11)
    const periodStart = new Date(yearNum, monthNum - 1, 1);
    const periodEnd = new Date(yearNum, monthNum, 0); // Last day of month
    const dueDate = new Date(yearNum, monthNum - 1, 10);

    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const period_start = formatDate(periodStart);
    const period_end = formatDate(periodEnd);
    const due_date = formatDate(dueDate);

    // Check if dues already exist for this period
    const existing = await Ledger.findOne({
      where: {
        tenant_id,
        period_start: period_start
      },
      transaction
    });

    if (existing) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Dues already generated for ${monthNum}/${yearNum}`
      });
    }

    const ledger = await Ledger.create({
      tenant_id,
      unit_id: tenant.unit_id,
      period_start,
      period_end,
      amount_due: unit.monthly_rent,
      amount_paid: 0,
      balance: unit.monthly_rent,
      status: 'unpaid',
      due_date
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      success: true,
      data: ledger,
      message: `Monthly dues for ${monthNum}/${yearNum} generated successfully`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Generate dues error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
// Get all ledgers
exports.findAll = async (req, res) => {
  try {
    const { tenant_id, status, year, month } = req.query;
    const where = {};

    if (tenant_id) where.tenant_id = tenant_id;
    if (status) where.status = status;
    if (year && month) {
      where.period_start = {
        [Op.between]: [
          `${year}-${month}-01`,
          `${year}-${month}-31`
        ]
      };
    }

    const ledgers = await Ledger.findAll({
      where,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number', 'monthly_rent']
        }
      ],
      order: [['period_start', 'DESC']]
    });

    res.json({
      success: true,
      data: ledgers,
      count: ledgers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single ledger
exports.findOne = async (req, res) => {
  try {
    const ledger = await Ledger.findByPk(req.params.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number', 'monthly_rent']
        }
      ]
    });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    res.json({
      success: true,
      data: ledger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update ledger (for manual adjustments)
exports.update = async (req, res) => {
  try {
    const ledger = await Ledger.findByPk(req.params.id);
    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger entry not found'
      });
    }

    const { amount_due, notes } = req.body;
    await ledger.update({ amount_due, notes });

    res.json({
      success: true,
      data: ledger,
      message: 'Ledger updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get tenant balance summary
exports.getTenantBalance = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const ledgers = await Ledger.findAll({
      where: {
        tenant_id,
        status: {
          [Op.in]: ['unpaid', 'partially_paid']
        }
      }
    });

    const total_due = ledgers.reduce((sum, l) => sum + parseFloat(l.amount_due), 0);
    const total_paid = ledgers.reduce((sum, l) => sum + parseFloat(l.amount_paid), 0);
    const balance = total_due - total_paid;

    res.json({
      success: true,
      data: {
        tenant_id,
        total_due,
        total_paid,
        balance,
        unpaid_months: ledgers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};