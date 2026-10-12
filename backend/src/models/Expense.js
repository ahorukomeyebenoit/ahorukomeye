const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Infrastructure = require('./Infrastructure');
const Unit = require('./Unit');
const User = require('./User');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  infrastructure_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  unit_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'repair',
      'maintenance',
      'utilities',
      'cleaning',
      'security',
      'taxes',
      'salaries',
      'insurance',
      'transport',
      'communication',
      'supplies',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paid_by: {
    type: DataTypes.ENUM('owner', 'manager', 'tenant'),
    defaultValue: 'owner'
  },
  receipt_file: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  receipt_type: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true
});

// Relationships
Expense.belongsTo(Infrastructure, {
  foreignKey: 'infrastructure_id',
  as: 'infrastructure'
});

Expense.belongsTo(Unit, {
  foreignKey: 'unit_id',
  as: 'unit'
});

Expense.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver'
});

Expense.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

Infrastructure.hasMany(Expense, {
  foreignKey: 'infrastructure_id',
  as: 'expenses'
});

Unit.hasMany(Expense, {
  foreignKey: 'unit_id',
  as: 'expenses'
});

module.exports = Expense;