const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Infrastructure = require('./Infrastructure');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  infrastructure_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  unit_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('apartment', 'office', 'shop', 'warehouse', 'studio'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('vacant', 'occupied', 'maintenance', 'reserved'),
    defaultValue: 'vacant'
  },
  size_sqm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  monthly_rent: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  security_deposit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  is_furnished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_water_meter: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_electricity_meter: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  current_tenant_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'units',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true
});

// Relationship: Unit belongs to Infrastructure
Unit.belongsTo(Infrastructure, {
  foreignKey: 'infrastructure_id',
  as: 'infrastructure'
});

// Relationship: Infrastructure has many Units
Infrastructure.hasMany(Unit, {
  foreignKey: 'infrastructure_id',
  as: 'units'
});

module.exports = Unit;