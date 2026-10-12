const Expense = require('../models/Expense');
const Infrastructure = require('../models/Infrastructure');
const Unit = require('../models/Unit');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// ============================================
// CREATE: Record new expense
// ============================================
exports.create = async (req, res) => {
  try {
    const {
      infrastructure_id,
      unit_id,
      category,
      description,
      amount,
      expense_date,
      paid_by,
      notes
    } = req.body;

    // Validate required fields
    if (!infrastructure_id || !category || !description || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: infrastructure_id, category, description, amount'
      });
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Check infrastructure exists
    const infrastructure = await Infrastructure.findByPk(infrastructure_id);
    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check unit exists (if provided)
    if (unit_id) {
      const unit = await Unit.findByPk(unit_id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }
    }

    // Managers' expenses need approval, admins are auto-approved
    const autoApprove = req.user.role === 'admin';

    const expense = await Expense.create({
      infrastructure_id,
      unit_id: unit_id || null,
      category,
      description,
      amount,
      expense_date: expense_date || new Date(),
      paid_by: paid_by || 'owner',
      notes,
      status: autoApprove ? 'approved' : 'pending',
      approved_by: autoApprove ? req.user.userId : null,
      approved_at: autoApprove ? new Date() : null,
      created_by: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: autoApprove
        ? 'Expense recorded and auto-approved'
        : 'Expense recorded, awaiting approval'
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// READ: Get all expenses (role-aware)
// ============================================
exports.findAll = async (req, res) => {
  try {
    const {
      infrastructure_id,
      category,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    // Role-based filtering
    if (req.user.role === 'tenant') {
      // Tenants can't see expenses
      return res.status(403).json({
        success: false,
        message: 'Access denied. Tenants cannot view expenses.'
      });
    }

    if (infrastructure_id) where.infrastructure_id = infrastructure_id;
    if (category) where.category = category;
    if (status) where.status = status;
    if (start_date && end_date) {
      where.expense_date = { [Op.between]: [start_date, end_date] };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [
        {
          model: Infrastructure,
          as: 'infrastructure',
          attributes: ['id', 'name', 'city']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'role']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name', 'role']
        }
      ],
      order: [['expense_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate total
    const total = rows
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    res.json({
      success: true,
      data: rows,
      total_approved_amount: total,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Find expenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// READ: Get single expense
// ============================================
exports.findOne = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        {
          model: Infrastructure,
          as: 'infrastructure',
          attributes: ['id', 'name', 'city']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE: Modify expense (only pending, only creator/admin)
// ============================================
exports.update = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Can't edit approved/rejected expenses
    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit ${expense.status} expense`
      });
    }

    // Only creator or admin can edit
    if (
      req.user.role !== 'admin' &&
      expense.created_by !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own expenses'
      });
    }

    const {
      category,
      description,
      amount,
      expense_date,
      paid_by,
      notes
    } = req.body;

    await expense.update({
      category: category || expense.category,
      description: description || expense.description,
      amount: amount || expense.amount,
      expense_date: expense_date || expense.expense_date,
      paid_by: paid_by || expense.paid_by,
      notes: notes !== undefined ? notes : expense.notes
    });

    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE: Approve expense (admin only)
// ============================================
exports.approve = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Expense already approved'
      });
    }

    await expense.update({
      status: 'approved',
      approved_by: req.user.userId,
      approved_at: new Date(),
      rejection_reason: null
    });

    res.json({
      success: true,
      data: expense,
      message: 'Expense approved'
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE: Reject expense (admin only)
// ============================================
exports.reject = async (req, res) => {
  try {
    const { reason } = req.body;
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Expense already rejected'
      });
    }

    await expense.update({
      status: 'rejected',
      approved_by: req.user.userId,
      approved_at: new Date(),
      rejection_reason: reason || 'No reason provided'
    });

    res.json({
      success: true,
      data: expense,
      message: 'Expense rejected'
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE: Soft delete
// ============================================
exports.delete = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete expenses'
      });
    }

    await expense.destroy();

    res.json({
      success: true,
      message: 'Expense deleted'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SUMMARY: Category breakdown + stats
// ============================================
exports.getSummary = async (req, res) => {
  try {
    const { infrastructure_id, start_date, end_date } = req.query;

    const where = { status: 'approved' };

    if (infrastructure_id) where.infrastructure_id = infrastructure_id;
    if (start_date && end_date) {
      where.expense_date = { [Op.between]: [start_date, end_date] };
    }

    // Category breakdown
    const expenses = await Expense.findAll({
      where,
      attributes: ['category', 'amount']
    });

    const byCategory = {};
    let totalAmount = 0;

    expenses.forEach(e => {
      const amt = parseFloat(e.amount);
      byCategory[e.category] = (byCategory[e.category] || 0) + amt;
      totalAmount += amt;
    });

    // Convert to array with percentages
    const breakdown = Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 1000) / 10 : 0
    })).sort((a, b) => b.amount - a.amount);

    // Pending count
    const pendingCount = await Expense.count({
      where: {
        status: 'pending',
        ...(infrastructure_id && { infrastructure_id })
      }
    });

    res.json({
      success: true,
      data: {
        total_approved: totalAmount,
        total_count: expenses.length,
        pending_count: pendingCount,
        by_category: breakdown
      }
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PENDING: Get pending expenses for approval
// ============================================
exports.getPending = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view pending expenses'
      });
    }

    const expenses = await Expense.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Infrastructure,
          as: 'infrastructure',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'role']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    const totalPending = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount), 0
    );

    res.json({
      success: true,
      data: expenses,
      count: expenses.length,
      total_pending_amount: totalPending
    });
  } catch (error) {
    console.error('Pending expenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};