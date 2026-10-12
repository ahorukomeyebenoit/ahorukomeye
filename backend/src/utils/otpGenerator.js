const crypto = require('crypto');

// Generate a 6-digit OTP
const generateOTP = () => {
  // Use crypto for secure random
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

// Generate a secure random token (for invites, email verification)
const generateToken = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Get OTP expiry time (5 minutes from now)
const getOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};

// Get invitation expiry (7 days)
const getInvitationExpiry = () => {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

// Format phone to international format
const formatPhone = (phone) => {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add + if missing
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('250')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+250' + cleaned.substring(1);
    } else {
      cleaned = '+250' + cleaned;
    }
  }
  
  return cleaned;
};

module.exports = {
  generateOTP,
  generateToken,
  getOTPExpiry,
  getInvitationExpiry,
  formatPhone
};