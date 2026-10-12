const { 
  sendRentDueReminder, 
  sendPaymentConfirmation, 
  sendWelcomeEmail, 
  sendOverdueNotice,
  sendEmail 
} = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const smsService = require('../services/smsService');
const Tenant = require('../models/Tenant');
const Ledger = require('../models/Ledger');
const Unit = require('../models/Unit');
const Infrastructure = require('../models/Infrastructure');
const Payment = require('../models/Payment');

// Send rent due reminder (Email + WhatsApp + SMS)
exports.sendRentReminder = async (req, res) => {
  try {
    const { tenant_id, ledger_id } = req.body;

    const tenant = await Tenant.findByPk(tenant_id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const ledger = await Ledger.findByPk(ledger_id);
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }

    console.log('📧 Sending email...');
    const emailResult = await sendRentDueReminder(tenant, ledger);

    console.log('📱 Sending WhatsApp...');
    const whatsappResult = await whatsappService.sendRentReminder(tenant, ledger);

    console.log('💬 Sending SMS...');
    const smsResult = await smsService.sendRentReminderSMS(tenant, ledger);

    res.json({
      success: true,
      message: 'Rent reminder sent via Email + WhatsApp + SMS',
      data: { email: emailResult, whatsapp: whatsappResult, sms: smsResult }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send payment confirmation (Email + WhatsApp + SMS)
exports.sendPaymentReceipt = async (req, res) => {
  try {
    const { payment_id } = req.body;

    const payment = await Payment.findByPk(payment_id, {
      include: [
        { model: Tenant, as: 'tenant' },
        { model: Ledger, as: 'ledger' }
      ]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const emailResult = await sendPaymentConfirmation(payment.tenant, payment, payment.ledger);
    const whatsappResult = await whatsappService.sendPaymentConfirmation(payment.tenant, payment, payment.ledger);
    const smsResult = await smsService.sendPaymentConfirmationSMS(payment.tenant, payment);

    res.json({
      success: true,
      message: 'Payment confirmation sent via Email + WhatsApp + SMS',
      data: { email: emailResult, whatsapp: whatsappResult, sms: smsResult }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send welcome (Email + WhatsApp + SMS)
exports.sendWelcome = async (req, res) => {
  try {
    const { tenant_id } = req.body;

    const tenant = await Tenant.findByPk(tenant_id, {
      include: [
        { 
          model: Unit, 
          as: 'unit',
          include: [{ model: Infrastructure, as: 'infrastructure' }]
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    if (!tenant.unit) {
      return res.status(400).json({ success: false, message: 'Tenant has no unit assigned' });
    }

    const emailResult = await sendWelcomeEmail(tenant, tenant.unit, tenant.unit.infrastructure);
    const whatsappResult = await whatsappService.sendWelcomeMessage(tenant, tenant.unit, tenant.unit.infrastructure);
    const smsResult = await smsService.sendWelcomeSMS(tenant, tenant.unit, tenant.unit.infrastructure);

    res.json({
      success: true,
      message: 'Welcome message sent via Email + WhatsApp + SMS',
      data: { email: emailResult, whatsapp: whatsappResult, sms: smsResult }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send overdue notice (Email + WhatsApp + SMS)
exports.sendOverdue = async (req, res) => {
  try {
    const { ledger_id, days_overdue } = req.body;

    const ledger = await Ledger.findByPk(ledger_id, {
      include: [{ model: Tenant, as: 'tenant' }]
    });

    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }

    const emailResult = await sendOverdueNotice(ledger.tenant, ledger, days_overdue || 1);
    const whatsappResult = await whatsappService.sendOverdueNotice(ledger.tenant, ledger, days_overdue || 1);
    const smsResult = await smsService.sendOverdueNoticeSMS(ledger.tenant, ledger, days_overdue || 1);

    res.json({
      success: true,
      message: 'Overdue notice sent via Email + WhatsApp + SMS',
      data: { email: emailResult, whatsapp: whatsappResult, sms: smsResult }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send custom email
exports.sendCustom = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    const result = await sendEmail({ to, subject, html, text });
    res.json({ success: true, message: 'Email sent', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send custom WhatsApp
exports.sendCustomWhatsApp = async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await whatsappService.sendTextMessage(to, message);
    res.json({ success: true, message: 'WhatsApp sent', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send custom SMS
exports.sendCustomSMS = async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await smsService.sendSMS(to, message);
    res.json({ success: true, message: 'SMS sent', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test email service
exports.testEmail = async (req, res) => {
  try {
    const { verifyConnection } = require('../services/emailService');
    const isReady = await verifyConnection();
    res.json({
      success: isReady,
      message: isReady ? 'Email service is ready' : 'Email service is not ready'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test WhatsApp service
exports.testWhatsApp = async (req, res) => {
  try {
    const result = await whatsappService.sendTextMessage(
      process.env.WHATSAPP_TEST_RECIPIENT,
      '✅ WhatsApp service test from Rent Manager API'
    );
    res.json({
      success: result.success,
      message: result.success ? 'WhatsApp service is ready' : 'WhatsApp service failed',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test SMS service
exports.testSMS = async (req, res) => {
  try {
    const result = await smsService.sendSMS(
      process.env.WHATSAPP_TEST_RECIPIENT,
      '✅ SMS service test from Rent Manager API'
    );
    res.json({
      success: result.success,
      message: result.success ? 'SMS service is ready' : 'SMS service failed',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};