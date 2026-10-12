const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Infrastructure = sequelize.define('Infrastructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [3, 255] }
  },
  type: {
    type: DataTypes.ENUM('residential', 'commercial', 'mixed'),
    allowNull: false
  },
  description: { type: DataTypes.TEXT },
  address: { type: DataTypes.STRING(500), allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false },
  district: { type: DataTypes.STRING(100), allowNull: false },
  province: { type: DataTypes.STRING(100), allowNull: false },
  country: { type: DataTypes.STRING(100), defaultValue: 'Rwanda' },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  total_units: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_floors: { type: DataTypes.INTEGER, defaultValue: 1 },
  year_built: { type: DataTypes.INTEGER },
  has_elevator: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_parking: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_security: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_generator: { type: DataTypes.BOOLEAN, defaultValue: false },
  water_meter_number: { type: DataTypes.STRING(50) },
  electricity_meter_number: { type: DataTypes.STRING(50) },
  owner_name: { type: DataTypes.STRING(200) },
  owner_phone: { type: DataTypes.STRING(20) },
  owner_email: { type: DataTypes.STRING(100) }
}, {
  tableName: 'infrastructures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true
});

module.exports = Infrastructure;