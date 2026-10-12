const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Rent Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
};

// Rent due reminder email
const sendRentDueReminder = async (tenant, ledger) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>🏠 Rent Payment Reminder</h1>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Dear <strong>${tenant.first_name} ${tenant.last_name}</strong>,</p>
        <p>This is a friendly reminder that your rent payment is due soon.</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td><strong>Period:</strong></td>
              <td>${ledger.period_start} to ${ledger.period_end}</td>
            </tr>
            <tr>
              <td><strong>Amount Due:</strong></td>
              <td><strong>${parseFloat(ledger.amount_due).toLocaleString()} RWF</strong></td>
            </tr>
            <tr>
              <td><strong>Due Date:</strong></td>
              <td>${ledger.due_date}</td>
            </tr>
          </table>
        </div>
        
        <p>Please make your payment before the due date to avoid penalties.</p>
        
        <p style="margin-top: 30px;">Thank you,<br><strong>Rent Manager Team</strong></p>
      </div>
      <div style="background: #1e40af; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: tenant.email,
    subject: `Rent Due Reminder - ${ledger.period_start}`,
    html
  });
};

// Payment confirmation email
const sendPaymentConfirmation = async (tenant, payment, ledger) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>✅ Payment Received</h1>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Dear <strong>${tenant.first_name} ${tenant.last_name}</strong>,</p>
        <p>We have received your payment. Thank you!</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td><strong>Receipt No:</strong></td>
              <td>${payment.id.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td><strong>Amount Paid:</strong></td>
              <td><strong>${parseFloat(payment.amount).toLocaleString()} RWF</strong></td>
            </tr>
            <tr>
              <td><strong>Method:</strong></td>
              <td>${payment.payment_method.replace('_', ' ').toUpperCase()}</td>
            </tr>
            <tr>
              <td><strong>Date:</strong></td>
              <td>${payment.payment_date}</td>
            </tr>
            <tr>
              <td><strong>Period:</strong></td>
              <td>${ledger.period_start} to ${ledger.period_end}</td>
            </tr>
            <tr>
              <td><strong>Balance:</strong></td>
              <td>${parseFloat(ledger.balance).toLocaleString()} RWF</td>
            </tr>
          </table>
        </div>
        
        <p style="margin-top: 30px;">Thank you,<br><strong>Rent Manager Team</strong></p>
      </div>
      <div style="background: #16a34a; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: tenant.email,
    subject: `Payment Confirmation - ${parseFloat(payment.amount).toLocaleString()} RWF`,
    html
  });
};

// Welcome email for new tenant
const sendWelcomeEmail = async (tenant, unit, infrastructure) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>🎉 Welcome to ${infrastructure.name}</h1>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Dear <strong>${tenant.first_name} ${tenant.last_name}</strong>,</p>
        <p>Welcome! We are happy to have you as our tenant.</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Unit Details:</h3>
          <table style="width: 100%;">
            <tr>
              <td><strong>Property:</strong></td>
              <td>${infrastructure.name}</td>
            </tr>
            <tr>
              <td><strong>Unit Number:</strong></td>
              <td>${unit.unit_number}</td>
            </tr>
            <tr>
              <td><strong>Floor:</strong></td>
              <td>${unit.floor}</td>
            </tr>
            <tr>
              <td><strong>Monthly Rent:</strong></td>
              <td><strong>${parseFloat(unit.monthly_rent).toLocaleString()} RWF</strong></td>
            </tr>
            <tr>
              <td><strong>Security Deposit:</strong></td>
              <td>${parseFloat(unit.security_deposit).toLocaleString()} RWF</td>
            </tr>
          </table>
        </div>
        
        <p>If you have any questions, please contact us.</p>
        
        <p style="margin-top: 30px;">Welcome aboard!<br><strong>Rent Manager Team</strong></p>
      </div>
      <div style="background: #1e40af; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: tenant.email,
    subject: `Welcome to ${infrastructure.name}!`,
    html
  });
};

// Overdue notice email
const sendOverdueNotice = async (tenant, ledger, daysOverdue) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1>⚠️ Overdue Rent Notice</h1>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Dear <strong>${tenant.first_name} ${tenant.last_name}</strong>,</p>
        <p>Your rent payment is <strong style="color: #dc2626;">${daysOverdue} days overdue</strong>.</p>
        
        <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td><strong>Amount Due:</strong></td>
              <td><strong>${parseFloat(ledger.balance).toLocaleString()} RWF</strong></td>
            </tr>
            <tr>
              <td><strong>Due Date:</strong></td>
              <td>${ledger.due_date}</td>
            </tr>
            <tr>
              <td><strong>Period:</strong></td>
              <td>${ledger.period_start} to ${ledger.period_end}</td>
            </tr>
          </table>
        </div>
        
        <p>Please make your payment immediately to avoid further penalties.</p>
        
        <p style="margin-top: 30px;">Thank you,<br><strong>Rent Manager Team</strong></p>
      </div>
      <div style="background: #dc2626; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: tenant.email,
    subject: `⚠️ OVERDUE: Rent Payment - ${ledger.period_start}`,
    html
  });
};

module.exports = {
  verifyConnection,
  sendEmail,
  sendRentDueReminder,
  sendPaymentConfirmation,
  sendWelcomeEmail,
  sendOverdueNotice
};