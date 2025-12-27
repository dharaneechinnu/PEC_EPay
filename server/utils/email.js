const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER || process.env.GMAIL_EMAIL || 'dharaneedharanchinnusamy@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD || process.env.PASS;

function createTransporter() {
  if (!GMAIL_USER || !GMAIL_PASS) {
    const err = new Error('GMAIL credentials are not configured. Set GMAIL_USER and GMAIL_PASS env vars');
    err.code = 'NO_GMAIL_CREDS';
    throw err;
  }
  return nodemailer.createTransport({
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

module.exports = { sendReceiptEmailUsingGmail };
