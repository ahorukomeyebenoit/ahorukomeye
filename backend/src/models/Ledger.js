const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Tenant = require('./Tenant');
const Unit = require('./Unit');

const Ledger = sequelize.define('Ledger', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  unit_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  period_start: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  period_end: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount_due: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  amount_paid: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid'),
    defaultValue: 'unpaid'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paid_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'ledgers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true
});

// Relationships
Ledger.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Ledger.belongsTo(Unit, {
  foreignKey: 'unit_id',
  as: 'unit'
});

Tenant.hasMany(Ledger, {
  foreignKey: 'tenant_id',
  as: 'ledgers'
});

Unit.hasMany(Ledger, {
  foreignKey: 'unit_id',
  as: 'ledgers'
});

module.exports = Ledger;