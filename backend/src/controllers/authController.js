const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { 
  generateOTP, 
  generateToken, 
  getOTPExpiry, 
  formatPhone 
} = require('../utils/otpGenerator');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Helper: Generate JWT token
const generateJWT = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      admin_id: user.admin_id,
      manager_id: user.manager_id,
      tenant_id: user.tenant_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ============================================
// PUBLIC: Register (Self-signup for Admin)
// ============================================
exports.register = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email, phone, password, first_name, last_name } = req.body;

    if (!email || !phone || !password || !first_name || !last_name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'All fields are required: email, phone, password, first_name, last_name'
      });
    }

    if (password.length < 8) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone: formatPhone(phone) }]
      },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email or phone already registered'
      });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      phone: formatPhone(phone),
      password,
      first_name,
      last_name,
      role: 'admin',
      status: 'active',
      plan: 'free',
      tenant_limit: 5
    }, { transaction });

    const emailToken = generateToken(32);
    await user.update({ email_verification_token: emailToken }, { transaction });

    const token = generateJWT(user);

    await transaction.commit();

    emailService.sendEmail({
      to: user.email,
      subject: 'Welcome to Rent Manager — Verify Your Email',
      html: `
        <h2>Welcome ${user.first_name}!</h2>
        <p>Thank you for signing up to Rent Manager.</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="http://localhost:5000/api/auth/verify-email?token=${emailToken}">Verify Email</a>
        <p>Your account is active with the FREE plan (up to 5 tenants).</p>
        <p>— The Rent Manager Team</p>
      `
    }).catch(err => console.error('Welcome email failed:', err.message));

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to Rent Manager!',
      data: {
        user: user.toPublic(),
        token
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PUBLIC: Login (Email + Password)
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Contact support.`
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    await user.update({ last_login: new Date() });

    const token = generateJWT(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toPublic(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PUBLIC: Send OTP (via SMS or Email)
// ============================================
exports.sendOTP = async (req, res) => {
  try {
    const { phone, email, purpose = 'login' } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'Phone or email required'
      });
    }

    const where = {};
    if (phone) where.phone = formatPhone(phone);
    if (email) where.email = email.toLowerCase();

    const user = await User.findOne({ where });

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await OTP.create({
      user_id: user?.id || null,
      phone: phone ? formatPhone(phone) : null,
      email: email ? email.toLowerCase() : null,
      code: otp,
      purpose,
      expires_at: expiresAt
    });

    if (phone) {
      console.log(`📱 Sending OTP to ${phone}: ${otp}`);
      smsService.sendSMS(
        formatPhone(phone),
        `Your Rent Manager code is: ${otp}. Valid for 5 minutes.`
      ).catch(err => console.error('SMS OTP failed:', err.message));
    }

    if (email) {
      console.log(`📧 Sending OTP to ${email}: ${otp}`);
      emailService.sendEmail({
        to: email,
        subject: 'Your Rent Manager OTP Code',
        html: `
          <h2>Your Verification Code</h2>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</p>
          <p>This code expires in 5 minutes.</p>
          <p>If you didn't request this, ignore this email.</p>
        `
      }).catch(err => console.error('Email OTP failed:', err.message));
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: process.env.NODE_ENV === 'development' ? { otp } : null
    });
  } catch (error) {
    console.error('sendOTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PUBLIC: Verify OTP
// ============================================
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, email, code, purpose = 'login' } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'OTP code required'
      });
    }

    const where = { code, purpose, is_used: false };
    if (phone) where.phone = formatPhone(phone);
    if (email) where.email = email.toLowerCase();

    const otp = await OTP.findOne({
      where,
      order: [['created_at', 'DESC']]
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > otp.expires_at) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (otp.attempts >= 3) {
      await otp.update({ is_used: true });
      return res.status(400).json({
        success: false,
        message: 'Too many attempts. Request a new OTP.'
      });
    }

    await otp.update({ is_used: true });

    const user = await User.findOne({
      where: phone ? { phone: formatPhone(phone) } : { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`
      });
    }

    const updates = {};
    if (phone) updates.phone_verified = true;
    if (email) updates.email_verified = true;
    updates.last_login = new Date();
    await user.update(updates);

    const token = generateJWT(user);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: user.toPublic(),
        token
      }
    });
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// AUTHENTICATED: Get Current User
// ============================================
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      data: user.toPublic()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// AUTHENTICATED: Logout
// ============================================
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// ============================================
// ADMIN: Invite Manager
// ============================================
exports.inviteManager = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email, phone, first_name, last_name } = req.body;

    if (!email || !phone || !first_name || !last_name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'All fields required'
      });
    }

    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { phone: formatPhone(phone) }] },
      transaction
    });

    if (existing) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const inviteToken = generateToken(32);

    const user = await User.create({
      email: email.toLowerCase(),
      phone: formatPhone(phone),
      first_name,
      last_name,
      role: 'manager',
      status: 'pending',
      admin_id: req.user.userId,
      invitation_token: inviteToken,
      invited_at: new Date()
    }, { transaction });

    await transaction.commit();

    emailService.sendEmail({
      to: email,
      subject: 'You are invited to Rent Manager',
      html: `
        <h2>Hello ${first_name},</h2>
        <p>You've been invited to join Rent Manager as a Manager.</p>
        <p>Click the link below to set your password and activate your account:</p>
        <a href="http://localhost:5000/api/auth/accept-invite?token=${inviteToken}">
          Accept Invitation
        </a>
        <p>This invitation expires in 7 days.</p>
      `
    }).catch(err => console.error('Invite email failed:', err.message));

    res.status(201).json({
      success: true,
      message: 'Manager invited successfully',
      data: {
        user: user.toPublic(),
        invitation_token: inviteToken
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('inviteManager error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PUBLIC: Accept Invitation
// ============================================
exports.acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const user = await User.findOne({
      where: { invitation_token: token }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    await user.update({
      password,
      status: 'active',
      activated_at: new Date(),
      invitation_token: null,
      phone_verified: true
    });

    const jwtToken = generateJWT(user);

    res.json({
      success: true,
      message: 'Account activated. Welcome aboard!',
      data: {
        user: user.toPublic(),
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('acceptInvite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// MANAGER: Invite Tenant
// ============================================
exports.inviteTenant = async (req, res) => {
  try {
    const { tenant_id, email, phone } = req.body;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID required'
      });
    }

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findByPk(tenant_id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const inviteToken = generateToken(32);

    const user = await User.create({
      email: email ? email.toLowerCase() : null,
      phone: formatPhone(phone || tenant.phone),
      password: null,
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      role: 'tenant',
      status: 'active',
      admin_id: req.user.admin_id || req.user.userId,
      manager_id: req.user.role === 'manager' ? req.user.userId : null,
      tenant_id: tenant.id,
      invitation_token: inviteToken,
      invited_at: new Date(),
      phone_verified: true
    });

    smsService.sendSMS(
      user.phone,
      `Welcome to Rent Manager! Log in with your phone number and OTP. Your account is ready.`
    ).catch(err => console.error('Tenant invite SMS failed:', err.message));

    res.status(201).json({
      success: true,
      message: 'Tenant account created',
      data: user.toPublic()
    });
  } catch (error) {
    console.error('inviteTenant error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// AUTHENTICATED: Get My Team
// ============================================
exports.getTeam = async (req, res) => {
  try {
    let where = {};

    if (req.user.role === 'admin') {
      where = {
        [Op.or]: [
          { id: req.user.userId },
          { admin_id: req.user.userId }
        ]
      };
    } else if (req.user.role === 'manager') {
      where = {
        [Op.or]: [
          { id: req.user.userId },
          { manager_id: req.user.userId }
        ]
      };
    } else {
      where = { id: req.user.userId };
    }

    const team = await User.findAll({
      where,
      attributes: { exclude: ['password', 'invitation_token', 'email_verification_token'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: team,
      count: team.length
    });
  } catch (error) {
    console.error('getTeam error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PUBLIC: Verify Email
// ============================================
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required' });
    }

    const user = await User.findOne({
      where: { email_verification_token: token }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid token' });
    }

    await user.update({
      email_verified: true,
      email_verification_token: null
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ✅ NEW: AUTHENTICATED - Update Profile
// ============================================
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check phone uniqueness if changed
    if (phone && phone !== user.phone) {
      const formattedPhone = formatPhone(phone);

      const existing = await User.findOne({
        where: { phone: formattedPhone }
      });

      if (existing && existing.id !== user.id) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }

      await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        phone: formattedPhone
      });
    } else {
      await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toPublic()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ✅ NEW: AUTHENTICATED - Change Password
// ============================================
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a password (tenants might not)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for OTP-only accounts'
      });
    }

    // Verify current password
    const isValid = await user.comparePassword(current_password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (model hook will hash it)
    await user.update({ password: new_password });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};