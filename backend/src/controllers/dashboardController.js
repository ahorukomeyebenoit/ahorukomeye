const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const User = require('../models/User');
const Infrastructure = require('../models/Infrastructure');
const Unit = require('../models/Unit');
const Tenant = require('../models/Tenant');
const Ledger = require('../models/Ledger');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

// ============================================
// HELPERS
// ============================================

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const getCollectionStatus = (rate) => {
  if (rate >= 95) return 'excellent';
  if (rate >= 75) return 'good';
  if (rate >= 50) return 'needs_attention';
  return 'underperforming';
};

// ============================================
// HELPER: Calculate expenses for a set of properties in a date range
// ============================================
const calculateExpenses = async (propertyIds, monthRange) => {
  const expenses = await Expense.findAll({
    where: {
      infrastructure_id: { [Op.in]: propertyIds },
      status: 'approved',
      expense_date: {
        [Op.between]: [monthRange.start, monthRange.end]
      },
      deleted_at: null
    },
    attributes: ['category', 'amount']
  });

  let total = 0;
  const byCategory = {};

  expenses.forEach(e => {
    const amt = parseFloat(e.amount);
    total += amt;
    byCategory[e.category] = (byCategory[e.category] || 0) + amt;
  });

  const breakdown = Object.entries(byCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0
  })).sort((a, b) => b.amount - a.amount);

  return { total, breakdown };
};

// ============================================
// ADMIN DASHBOARD
// ============================================
const getAdminDashboard = async (user) => {
  const monthRange = getCurrentMonthRange();

  // 1. Counts
  const propertiesCount = await Infrastructure.count({ where: { deleted_at: null } });
  const unitsCount = await Unit.count({ where: { deleted_at: null } });
  const occupiedUnits = await Unit.count({ where: { status: 'occupied', deleted_at: null } });
  const managersCount = await User.count({ where: { role: 'manager', admin_id: user.userId } });
  const tenantsCount = await Tenant.count({ where: { deleted_at: null } });

  // 2. All properties
  const properties = await Infrastructure.findAll({
    where: { deleted_at: null },
    attributes: ['id', 'name', 'type', 'city', 'district']
  });

  const propertyIds = properties.map(p => p.id);

  // 3. Per-property breakdown
  const propertiesBreakdown = [];

  for (const property of properties) {
    const units = await Unit.findAll({
      where: { infrastructure_id: property.id, deleted_at: null },
      attributes: ['id', 'status', 'monthly_rent']
    });

    const totalUnits = units.length;
    const occupiedCount = units.filter(u => u.status === 'occupied').length;
    const monthlyTarget = units.reduce((sum, u) => sum + parseFloat(u.monthly_rent), 0);

    const unitIds = units.map(u => u.id);

    const tenants = await Tenant.findAll({
      where: { unit_id: { [Op.in]: unitIds }, deleted_at: null },
      attributes: ['id']
    });

    const tenantIds = tenants.map(t => t.id);

    // Collected
    let collectedThisMonth = 0;
    if (tenantIds.length > 0) {
      const payments = await Payment.findAll({
        where: {
          tenant_id: { [Op.in]: tenantIds },
          payment_date: { [Op.between]: [monthRange.start, monthRange.end] },
          status: 'completed',
          deleted_at: null
        },
        attributes: ['amount']
      });
      collectedThisMonth = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    }

    // Expenses for this property
    const { total: expensesThisMonth, breakdown: expenseBreakdown } = 
      await calculateExpenses([property.id], monthRange);

    const outstandingThisMonth = Math.max(0, monthlyTarget - collectedThisMonth);
    const collectionRate = monthlyTarget > 0 
      ? Math.round((collectedThisMonth / monthlyTarget) * 100) 
      : 0;
    const occupancyRate = totalUnits > 0 
      ? Math.round((occupiedCount / totalUnits) * 100) 
      : 0;

    // ⭐ NEW: Net profit
    const netProfit = collectedThisMonth - expensesThisMonth;
    const profitMargin = collectedThisMonth > 0 
      ? Math.round((netProfit / collectedThisMonth) * 1000) / 10 
      : 0;

    propertiesBreakdown.push({
      property_id: property.id,
      property_name: property.name,
      property_type: property.type,
      location: `${property.district}, ${property.city}`,
      units_total: totalUnits,
      units_occupied: occupiedCount,
      occupancy_rate: occupancyRate,
      monthly_target: monthlyTarget,
      collected_this_month: collectedThisMonth,
      outstanding_this_month: outstandingThisMonth,
      collection_rate: collectionRate,
      status: getCollectionStatus(collectionRate),
      // ⭐ NEW: Expense & profit data
      expenses_this_month: expensesThisMonth,
      net_profit_this_month: netProfit,
      profit_margin: profitMargin,
      expense_breakdown: expenseBreakdown
    });
  }

  // 4. Overall revenue
  const totalTarget = propertiesBreakdown.reduce((sum, p) => sum + p.monthly_target, 0);
  const totalCollected = propertiesBreakdown.reduce((sum, p) => sum + p.collected_this_month, 0);
  const totalOutstanding = propertiesBreakdown.reduce((sum, p) => sum + p.outstanding_this_month, 0);
  const overallCollectionRate = totalTarget > 0 
    ? Math.round((totalCollected / totalTarget) * 100) 
    : 0;

  // ⭐ NEW: Total expenses + profit
  const { total: totalExpenses, breakdown: overallExpenseBreakdown } = 
    await calculateExpenses(propertyIds, monthRange);

  const netProfit = totalCollected - totalExpenses;
  const profitMargin = totalCollected > 0 
    ? Math.round((netProfit / totalCollected) * 1000) / 10 
    : 0;

  // ⭐ NEW: Pending expenses count
  const pendingExpensesCount = await Expense.count({
    where: { status: 'pending', deleted_at: null }
  });

  // 5. Overall outstanding
  const allOutstanding = await Ledger.sum('balance', {
    where: {
      status: { [Op.in]: ['unpaid', 'partially_paid'] },
      deleted_at: null
    }
  }) || 0;

  // 6. Recent payments
  const recentPayments = await Payment.findAll({
    where: { status: 'completed', deleted_at: null },
    include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'first_name', 'last_name'] }],
    order: [['payment_date', 'DESC']],
    limit: 10
  });

  // 7. Top debtors
  const topDebtors = await Ledger.findAll({
    where: {
      status: { [Op.in]: ['unpaid', 'partially_paid'] },
      balance: { [Op.gt]: 0 },
      deleted_at: null
    },
    include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'first_name', 'last_name', 'phone'] }],
    order: [['balance', 'DESC']],
    limit: 5
  });

  return {
    user: {
      id: user.userId,
      role: user.role
    },
    organization: {
      properties_count: propertiesCount,
      units_count: unitsCount,
      occupied_units: occupiedUnits,
      vacant_units: unitsCount - occupiedUnits,
      occupancy_rate: unitsCount > 0 ? Math.round((occupiedUnits / unitsCount) * 100) : 0,
      managers_count: managersCount,
      tenants_count: tenantsCount
    },
    revenue_summary: {
      this_month_target: totalTarget,
      this_month_collected: totalCollected,
      this_month_outstanding: totalOutstanding,
      collection_rate: overallCollectionRate,
      overall_outstanding: allOutstanding,
      // ⭐ NEW
      this_month_expenses: totalExpenses,
      this_month_net_profit: netProfit,
      profit_margin: profitMargin,
      pending_expenses_count: pendingExpensesCount,
      expense_breakdown: overallExpenseBreakdown
    },
    properties_breakdown: propertiesBreakdown,
    recent_payments: recentPayments,
    top_debtors: topDebtors
  };
};

// ============================================
// MANAGER DASHBOARD
// ============================================
const getManagerDashboard = async (user) => {
  const monthRange = getCurrentMonthRange();

  // Manager's tenants
  const tenantUsers = await User.findAll({
    where: { manager_id: user.userId, role: 'tenant' },
    attributes: ['id', 'tenant_id']
  });
  const tenantIds = tenantUsers.map(u => u.tenant_id).filter(Boolean);

  const tenants = await Tenant.findAll({
    where: { id: { [Op.in]: tenantIds }, deleted_at: null },
    include: [
      {
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unit_number', 'infrastructure_id', 'monthly_rent', 'status']
      }
    ]
  });

  const unitsCount = tenants.filter(t => t.unit).length;
  const occupiedCount = tenants.filter(t => t.unit && t.unit.status === 'occupied').length;

  const monthlyTarget = tenants.reduce((sum, t) => {
    return sum + (t.unit ? parseFloat(t.unit.monthly_rent) : 0);
  }, 0);

  // Collected
  let collectedThisMonth = 0;
  if (tenantIds.length > 0) {
    const payments = await Payment.findAll({
      where: {
        tenant_id: { [Op.in]: tenantIds },
        payment_date: { [Op.between]: [monthRange.start, monthRange.end] },
        status: 'completed',
        deleted_at: null
      },
      attributes: ['amount']
    });
    collectedThisMonth = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }

  // ⭐ NEW: Manager's property expenses
  const propertyIds = [...new Set(tenants.filter(t => t.unit).map(t => t.unit.infrastructure_id))];

  const { total: expensesThisMonth, breakdown: expenseBreakdown } = 
    propertyIds.length > 0 
      ? await calculateExpenses(propertyIds, monthRange)
      : { total: 0, breakdown: [] };

  const outstanding = Math.max(0, monthlyTarget - collectedThisMonth);
  const collectionRate = monthlyTarget > 0 
    ? Math.round((collectedThisMonth / monthlyTarget) * 100) 
    : 0;

  // ⭐ NEW: Net profit
  const netProfit = collectedThisMonth - expensesThisMonth;
  const profitMargin = collectedThisMonth > 0 
    ? Math.round((netProfit / collectedThisMonth) * 1000) / 10 
    : 0;

  // Recent payments
  const recentPayments = await Payment.findAll({
    where: {
      tenant_id: { [Op.in]: tenantIds },
      status: 'completed',
      deleted_at: null
    },
    include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'first_name', 'last_name'] }],
    order: [['payment_date', 'DESC']],
    limit: 10
  });

  // Top debtors
  const topDebtors = await Ledger.findAll({
    where: {
      tenant_id: { [Op.in]: tenantIds },
      status: { [Op.in]: ['unpaid', 'partially_paid'] },
      balance: { [Op.gt]: 0 },
      deleted_at: null
    },
    include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'first_name', 'last_name', 'phone'] }],
    order: [['balance', 'DESC']],
    limit: 5
  });

  return {
    user: {
      id: user.userId,
      role: user.role
    },
    my_team: {
      tenants_count: tenants.length,
      units_count: unitsCount,
      occupied_units: occupiedCount,
      occupancy_rate: unitsCount > 0 ? Math.round((occupiedCount / unitsCount) * 100) : 0
    },
    revenue_summary: {
      this_month_target: monthlyTarget,
      this_month_collected: collectedThisMonth,
      this_month_outstanding: outstanding,
      collection_rate: collectionRate,
      // ⭐ NEW
      this_month_expenses: expensesThisMonth,
      this_month_net_profit: netProfit,
      profit_margin: profitMargin,
      expense_breakdown: expenseBreakdown
    },
    recent_payments: recentPayments,
    top_debtors: topDebtors
  };
};

// ============================================
// TENANT DASHBOARD (unchanged — tenants don't see expenses)
// ============================================
const getTenantDashboard = async (user) => {
  if (!user.tenant_id) {
    return {
      user: { role: user.role },
      message: 'No tenant record linked to this account'
    };
  }

  const tenant = await Tenant.findByPk(user.tenant_id, {
    include: [
      {
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unit_number', 'floor', 'monthly_rent', 'status'],
        include: [
          {
            model: Infrastructure,
            as: 'infrastructure',
            attributes: ['id', 'name', 'city', 'district']
          }
        ]
      }
    ]
  });

  if (!tenant) {
    return { user: { role: user.role }, message: 'Tenant not found' };
  }

  const ledgers = await Ledger.findAll({
    where: { tenant_id: tenant.id, deleted_at: null },
    order: [['period_start', 'ASC']]
  });

  const totalDue = ledgers.reduce((sum, l) => sum + parseFloat(l.amount_due), 0);
  const totalPaid = ledgers.reduce((sum, l) => sum + parseFloat(l.amount_paid), 0);
  const balance = Math.max(0, totalDue - totalPaid);
  const nextDue = ledgers.find(l => parseFloat(l.balance) > 0);

  const payments = await Payment.findAll({
    where: { tenant_id: tenant.id, status: 'completed', deleted_at: null },
    order: [['payment_date', 'DESC']],
    limit: 10
  });

  return {
    user: {
      id: user.userId,
      name: `${tenant.first_name} ${tenant.last_name}`,
      role: user.role
    },
    unit: tenant.unit ? {
      number: tenant.unit.unit_number,
      floor: tenant.unit.floor,
      property: tenant.unit.infrastructure?.name,
      location: `${tenant.unit.infrastructure?.district}, ${tenant.unit.infrastructure?.city}`,
      monthly_rent: parseFloat(tenant.unit.monthly_rent)
    } : null,
    account: {
      current_balance: balance,
      total_paid_all_time: totalPaid,
      next_due_amount: nextDue ? parseFloat(nextDue.balance) : 0,
      next_due_date: nextDue ? nextDue.due_date : null,
      status: balance === 0 ? 'in_good_standing' : 'has_outstanding'
    },
    recent_payments: payments
  };
};

// ============================================
// MAIN: Get dashboard (role-aware)
// ============================================
exports.getDashboard = async (req, res) => {
  try {
    let data;

    if (req.user.role === 'admin') {
      data = await getAdminDashboard(req.user);
    } else if (req.user.role === 'manager') {
      data = await getManagerDashboard(req.user);
    } else if (req.user.role === 'tenant') {
      data = await getTenantDashboard(req.user);
    } else {
      return res.status(403).json({ success: false, message: 'Unknown role' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};