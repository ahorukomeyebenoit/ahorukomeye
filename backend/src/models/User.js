const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'tenant'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'suspended'),
    defaultValue: 'pending'
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  manager_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_verification_token: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  invitation_token: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  invited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  activated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  plan: {
    type: DataTypes.ENUM('free', 'premium', 'business'),
    defaultValue: 'free'
  },
  tenant_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  underscored: true,
  hooks: {
    // Hash password BEFORE creating
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password BEFORE updating (if password changed)
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method: Compare password
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Get public info (no password)
User.prototype.toPublic = function() {
  const { password, email_verification_token, invitation_token, ...safe } = this.toJSON();
  return safe;
};

// Instance method: Get full name
User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

module.exports = User;