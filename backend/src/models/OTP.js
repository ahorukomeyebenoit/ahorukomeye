const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('login', 'verify_phone', 'verify_email', 'password_reset', 'accept_invite'),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'otp_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

// Relationships
User.hasMany(OTP, {
  foreignKey: 'user_id',
  as: 'otps'
});

OTP.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Instance method: Check if OTP is expired
OTP.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

// Instance method: Check if OTP is still valid
OTP.prototype.isValid = function() {
  return !this.is_used && !this.isExpired() && this.attempts < 3;
};

// Static method: Verify OTP code
OTP.verify = async function({ user_id, code, purpose }) {
  const otp = await this.findOne({
    where: {
      user_id,
      code,
      purpose,
      is_used: false
    },
    order: [['created_at', 'DESC']]
  });

  if (!otp) {
    return { success: false, message: 'OTP not found' };
  }

  if (otp.isExpired()) {
    return { success: false, message: 'OTP has expired' };
  }

  if (otp.attempts >= 3) {
    return { success: false, message: 'Too many attempts' };
  }

  // Mark as used
  await otp.update({ is_used: true });

  return { success: true, otp };
};

// Static method: Clean expired OTPs
OTP.cleanExpired = async function() {
  const { Op } = require('sequelize');
  const result = await this.destroy({
    where: {
      expires_at: { [Op.lt]: new Date() }
    }
  });
  return result;
};

module.exports = OTP;