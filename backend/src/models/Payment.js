const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Tenant = require('./Tenant');
const Ledger = require('./Ledger');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  ledger_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  payment_method: {
    type: DataTypes.ENUM('mobile_money', 'bank_transfer', 'cash'),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { len: [0, 150] }
  },
  proof_file: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  proof_type: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  proof_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true
});

// Relationships
Payment.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Payment.belongsTo(Ledger, {
  foreignKey: 'ledger_id',
  as: 'ledger'
});

Tenant.hasMany(Payment, {
  foreignKey: 'tenant_id',
  as: 'payments'
});

Ledger.hasMany(Payment, {
  foreignKey: 'ledger_id',
  as: 'payments'
});

module.exports = Payment;