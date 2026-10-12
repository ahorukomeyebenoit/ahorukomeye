const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Unit = require('./Unit');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  national_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  date_of_birth: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other')
  },
  occupation: {
    type: DataTypes.STRING(100)
  },
  employer: {
    type: DataTypes.STRING(200)
  },
  employer_phone: {
    type: DataTypes.STRING(20)
  },
  emergency_contact_name: {
    type: DataTypes.STRING(100)
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(20)
  },
  current_address: {
    type: DataTypes.STRING(500)
  },
  move_in_date: {
    type: DataTypes.DATEONLY
  },
  move_out_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'pending'
  },
  unit_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true
});

// Relationships
Tenant.belongsTo(Unit, {
  foreignKey: 'unit_id',
  as: 'unit'
});

Unit.hasMany(Tenant, {
  foreignKey: 'unit_id',
  as: 'tenants'
});

module.exports = Tenant;