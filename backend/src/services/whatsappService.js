const axios = require('axios');
require('dotenv').config();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;

// Send text message
const sendTextMessage = async (to, message) => {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ WhatsApp message sent:', response.data.messages[0].id);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ WhatsApp error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Send template message (for production)
const sendTemplateMessage = async (to, templateName, languageCode = 'en', components = []) => {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ WhatsApp error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Send rent reminder
const sendRentReminder = async (tenant, ledger) => {
  const message = `🏠 *Rent Payment Reminder*

Dear ${tenant.first_name} ${tenant.last_name},

Your rent payment is due soon.

📅 Period: ${ledger.period_start} to ${ledger.period_end}
💰 Amount Due: ${parseFloat(ledger.amount_due).toLocaleString()} RWF
📆 Due Date: ${ledger.due_date}

Please make your payment before the due date.

Thank you,
Rent Manager Team`;

  return sendTextMessage(tenant.phone, message);
};

// Send payment confirmation
const sendPaymentConfirmation = async (tenant, payment, ledger) => {
  const message = `✅ *Payment Received*

Dear ${tenant.first_name} ${tenant.last_name},

We have received your payment. Thank you!

🧾 Receipt No: ${payment.id.slice(0, 8).toUpperCase()}
💰 Amount Paid: ${parseFloat(payment.amount).toLocaleString()} RWF
💳 Method: ${payment.payment_method.replace('_', ' ').toUpperCase()}
📅 Date: ${payment.payment_date}
📊 Balance: ${parseFloat(ledger.balance).toLocaleString()} RWF

Thank you,
Rent Manager Team`;

  return sendTextMessage(tenant.phone, message);
};

// Send overdue notice
const sendOverdueNotice = async (tenant, ledger, daysOverdue) => {
  const message = `⚠️ *OVERDUE RENT NOTICE*

Dear ${tenant.first_name} ${tenant.last_name},

Your rent payment is *${daysOverdue} days overdue*.

💰 Amount Due: ${parseFloat(ledger.balance).toLocaleString()} RWF
📆 Due Date: ${ledger.due_date}

Please make your payment immediately to avoid penalties.

Thank you,
Rent Manager Team`;

  return sendTextMessage(tenant.phone, message);
};

// Send welcome message
const sendWelcomeMessage = async (tenant, unit, infrastructure) => {
  const message = `🎉 *Welcome to ${infrastructure.name}!*

Dear ${tenant.first_name} ${tenant.last_name},

We are happy to have you as our tenant!

🏠 Property: ${infrastructure.name}
🚪 Unit Number: ${unit.unit_number}
📏 Floor: ${unit.floor}
💰 Monthly Rent: ${parseFloat(unit.monthly_rent).toLocaleString()} RWF

If you have any questions, please contact us.

Welcome aboard!
Rent Manager Team`;

  return sendTextMessage(tenant.phone, message);
};

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendRentReminder,
  sendPaymentConfirmation,
  sendOverdueNotice,
  sendWelcomeMessage
};