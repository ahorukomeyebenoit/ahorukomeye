const AfricasTalking = require('africastalking');
require('dotenv').config();

// Initialize Africa's Talking
const credentials = {
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
};

const africastalking = AfricasTalking(credentials);
const sms = africastalking.SMS;

// Send SMS
const sendSMS = async (to, message) => {
  try {
    const options = {
      to: [to],
      message: message
    };
    
    if (process.env.AT_SENDER_ID && process.env.AT_USERNAME !== 'sandbox') {
      options.from = process.env.AT_SENDER_ID;
    }
    
    const response = await sms.send(options);
    console.log('✅ SMS sent:', JSON.stringify(response));
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ SMS error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send rent reminder SMS
const sendRentReminderSMS = async (tenant, ledger) => {
  const message = `RENT REMINDER\n\nDear ${tenant.first_name} ${tenant.last_name},\nYour rent of ${parseFloat(ledger.amount_due).toLocaleString()} RWF is due on ${ledger.due_date}.\n\nThank you,\nRent Manager Team`;
  return sendSMS(tenant.phone, message);
};

// Send payment confirmation SMS
const sendPaymentConfirmationSMS = async (tenant, payment) => {
  const message = `PAYMENT RECEIVED\n\nDear ${tenant.first_name},\nWe received your payment of ${parseFloat(payment.amount).toLocaleString()} RWF.\nReceipt: ${payment.id.slice(0, 8).toUpperCase()}\n\nThank you,\nRent Manager Team`;
  return sendSMS(tenant.phone, message);
};

// Send overdue notice SMS
const sendOverdueNoticeSMS = async (tenant, ledger, daysOverdue) => {
  const message = `OVERDUE RENT\n\nDear ${tenant.first_name},\nYour rent is ${daysOverdue} days overdue.\nAmount due: ${parseFloat(ledger.balance).toLocaleString()} RWF.\nPlease pay immediately.\n\nRent Manager Team`;
  return sendSMS(tenant.phone, message);
};

// Send welcome SMS
const sendWelcomeSMS = async (tenant, unit, infrastructure) => {
  const message = `Welcome to ${infrastructure.name}!\n\nDear ${tenant.first_name},\nYour unit ${unit.unit_number} is ready.\nMonthly rent: ${parseFloat(unit.monthly_rent).toLocaleString()} RWF\n\nRent Manager Team`;
  return sendSMS(tenant.phone, message);
};

module.exports = {
  sendSMS,
  sendRentReminderSMS,
  sendPaymentConfirmationSMS,
  sendOverdueNoticeSMS,
  sendWelcomeSMS
};