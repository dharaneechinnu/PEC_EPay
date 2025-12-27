const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER || process.env.GMAIL_EMAIL || 'dharaneedharanchinnusamy@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD || process.env.PASS;

function createTransporter() {
  if (!GMAIL_USER || !GMAIL_PASS) {
    const err = new Error('GMAIL credentials are not configured. Set GMAIL_USER and GMAIL_PASS env vars');
    err.code = 'NO_GMAIL_CREDS';
    throw err;
  }
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

/**
 * Send an email using Gmail SMTP.
 * @param {{to:string,subject:string,text?:string,html?:string,attachments?:Array}} opts
 */
async function sendReceiptEmailUsingGmail(opts) {
  const transporter = createTransporter();
  const mailOptions = {
    from: GMAIL_USER,
    to: opts.to,
    subject: opts.subject || 'Receipt',
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { 
  sendReceiptEmailUsingGmail, 
  generateReceiptEmailTemplate,
  sendPaymentReceipts
};

/**
 * Generate professional HTML email template for payment receipts
 */
function generateReceiptEmailTemplate(receiptData) {
  const { formatIndianCurrency } = require('../services/receiptService');
  const formattedAmount = formatIndianCurrency(receiptData.amount);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - E-Pay Medical</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .status-badge { display: inline-block; background: #16a34a; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #1f2937; font-size: 18px; margin: 0 0 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { color: #1f2937; font-weight: 600; }
        .amount-highlight { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #16a34a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .amount-highlight h3 { color: #16a34a; font-size: 24px; margin: 0; }
        .footer { background: #f8fafc; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; }
        .emergency-badge { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        @media (max-width: 600px) { .detail-row { flex-direction: column; } .detail-label { margin-bottom: 4px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 E-PAY MEDICAL</h1>
          <p>Emergency Medical Payment System</p>
          <div class="status-badge">✅ PAYMENT SUCCESSFUL</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>📄 Transaction Details</h2>
            <div class="detail-row">
              <span class="detail-label">Receipt Number:</span>
              <span class="detail-value">${receiptData.receiptNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${receiptData.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment ID:</span>
              <span class="detail-value">${receiptData.paymentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Application Number:</span>
              <span class="detail-value">${receiptData.applicationNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="section">
            <h2>🏥 Hospital Information</h2>
            <div class="detail-row">
              <span class="detail-label">Hospital Name:</span>
              <span class="detail-value">${receiptData.hospitalName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Account Holder:</span>
              <span class="detail-value">${receiptData.accountHolderName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Bank Account:</span>
              <span class="detail-value">${receiptData.maskedAccountNumber}</span>
            </div>
          </div>

          <div class="section">
            <h2>👤 Patient Information</h2>
            <div class="detail-row">
              <span class="detail-label">Patient Name:</span>
              <span class="detail-value">${receiptData.patientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Emergency Type:</span>
              <span class="detail-value">
                <span class="emergency-badge">🚨 ${receiptData.emergencyType}</span>
              </span>
            </div>
          </div>

          <div class="amount-highlight">
            <h3>${formattedAmount}</h3>
            <p style="margin: 5px 0 0; color: #059669;">Successfully transferred to hospital account</p>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: 500;">
              💳 Payment processed securely via Razorpay Gateway
            </p>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
              Please retain this receipt for your records. PDF receipt is attached.
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>E-Pay Medical Emergency System</strong></p>
          <p>📧 support@epaymedical.com | 📞 +91-XXXX-XXXX</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send professional payment receipt to both hospital and patient
 */
async function sendPaymentReceipts(receiptData, pdfBuffer) {
  const results = { success: [], failed: [] };
  
  const subject = `✅ Payment Receipt - ${receiptData.receiptNumber} | E-Pay Medical`;
  const htmlContent = generateReceiptEmailTemplate(receiptData);
  const textContent = `
    Payment Receipt - E-Pay Medical
    
    Transaction Details:
    Receipt Number: ${receiptData.receiptNumber}
    Transaction ID: ${receiptData.transactionId}
    Payment ID: ${receiptData.paymentId}
    Amount: ${require('../services/receiptService').formatIndianCurrency(receiptData.amount)}
    Date: ${new Date().toLocaleString('en-IN')}
    
    Hospital: ${receiptData.hospitalName}
    Patient: ${receiptData.patientName}
    Emergency Type: ${receiptData.emergencyType}
    
    Payment has been successfully transferred to the hospital account.
    Please retain this receipt for your records.
    
    E-Pay Medical Emergency System
    support@epaymedical.com
  `;

  const attachments = [{
    filename: `Receipt_${receiptData.receiptNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }];

  // Send to patient
  if (receiptData.patientEmail) {
    try {
      await sendReceiptEmailUsingGmail({
        to: receiptData.patientEmail,
        subject: `${subject} (Patient Copy)`,
        html: htmlContent,
        text: textContent,
        attachments
      });
      results.success.push({ email: receiptData.patientEmail, type: 'patient' });
      console.log(`✅ Receipt sent to patient: ${receiptData.patientEmail}`);
    } catch (error) {
      results.failed.push({ email: receiptData.patientEmail, type: 'patient', error: error.message });
      console.error(`❌ Failed to send receipt to patient: ${receiptData.patientEmail}`, error.message);
    }
  }

  // Send to hospital
  if (receiptData.hospitalEmail && receiptData.hospitalEmail !== receiptData.patientEmail) {
    try {
      await sendReceiptEmailUsingGmail({
        to: receiptData.hospitalEmail,
        subject: `${subject} (Hospital Copy)`,
        html: htmlContent,
        text: textContent,
        attachments
      });
      results.success.push({ email: receiptData.hospitalEmail, type: 'hospital' });
      console.log(`✅ Receipt sent to hospital: ${receiptData.hospitalEmail}`);
    } catch (error) {
      results.failed.push({ email: receiptData.hospitalEmail, type: 'hospital', error: error.message });
      console.error(`❌ Failed to send receipt to hospital: ${receiptData.hospitalEmail}`, error.message);
    }
  }

  return results;
}
