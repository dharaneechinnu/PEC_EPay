const PDFDocument = require('pdfkit');
const stream = require('stream');

/**
 * Professional Receipt PDF Generator
 * Creates a professionally designed PDF receipt for medical emergency payments
 */

const formatIndianCurrency = (amountInPaise) => {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees);
};

const formatIndianNumber = (number) => {
  return new Intl.NumberFormat('en-IN').format(number);
};

const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    time: now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }),
    iso: now.toISOString()
  };
};

const generateProfessionalReceipt = async (receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Medical Emergency Payment Receipt',
          Author: 'E-Pay Medical Emergency System',
          Subject: `Receipt for Transaction ${receiptData.transactionId}`,
          Keywords: 'Receipt, Payment, Medical, Emergency'
        }
      });

      const chunks = [];
      const passthrough = new stream.PassThrough();
      doc.pipe(passthrough);
      passthrough.on('data', (chunk) => chunks.push(chunk));
      passthrough.on('end', () => resolve(Buffer.concat(chunks)));

      const pageWidth = doc.page.width - 100; // Account for margins
      const centerX = pageWidth / 2 + 50;
      const currentDateTime = getCurrentDateTime();

      // Header with Logo Area and Company Info
      doc.rect(50, 50, pageWidth, 80).stroke('#2563eb');
      
      // Company Logo Area (placeholder)
      doc.rect(60, 60, 60, 60).stroke('#e5e7eb');
      doc.fontSize(8).fillColor('#6b7280').text('LOGO', 80, 85);
      
      // Company Header
      doc.fontSize(24).fillColor('#1f2937').font('Helvetica-Bold');
      doc.text('E-PAY MEDICAL', 140, 70, { width: pageWidth - 150 });
      
      doc.fontSize(12).fillColor('#6b7280').font('Helvetica');
      doc.text('Emergency Medical Payment System', 140, 95);
      doc.text('Instant Financial Support for Medical Emergencies', 140, 110);

      // Receipt Title
      doc.fontSize(20).fillColor('#dc2626').font('Helvetica-Bold');
      doc.text('PAYMENT RECEIPT', centerX, 160, { align: 'center' });

      // Status Badge
      const statusX = centerX - 40;
      doc.rect(statusX, 185, 80, 25).fill('#16a34a');
      doc.fontSize(12).fillColor('white').font('Helvetica-Bold');
      doc.text('PAID', statusX + 30, 192);

      // Transaction Info Section
      doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold');
      doc.text('Transaction Details', 50, 240);
      
      doc.rect(50, 250, pageWidth, 1).fill('#e5e7eb');

      const leftCol = 50;
      const rightCol = 300;
      let yPos = 270;

      // Transaction Details
      doc.fontSize(11).fillColor('#374151').font('Helvetica');
      
      const addReceiptRow = (label, value, y) => {
        doc.fillColor('#6b7280').text(label + ':', leftCol, y);
        doc.fillColor('#1f2937').font('Helvetica-Bold').text(value || 'N/A', rightCol, y);
        doc.font('Helvetica');
        return y + 20;
      };

      yPos = addReceiptRow('Receipt Number', receiptData.receiptNumber, yPos);
      yPos = addReceiptRow('Transaction ID', receiptData.transactionId, yPos);
      yPos = addReceiptRow('Payment ID', receiptData.paymentId, yPos);
      yPos = addReceiptRow('Application Number', receiptData.applicationNumber, yPos);
      yPos = addReceiptRow('Date & Time', `${currentDateTime.date} at ${currentDateTime.time}`, yPos);

      // Patient Information
      yPos += 10;
      doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold');
      doc.text('Patient Information', 50, yPos);
      yPos += 15;
      doc.rect(50, yPos, pageWidth, 1).fill('#e5e7eb');
      yPos += 20;

      yPos = addReceiptRow('Patient Name', receiptData.patientName, yPos);
      yPos = addReceiptRow('Patient Email', receiptData.patientEmail, yPos);
      yPos = addReceiptRow('Emergency Type', receiptData.emergencyType, yPos);

      // Hospital Information  
      yPos += 10;
      doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold');
      doc.text('Hospital Information', 50, yPos);
      yPos += 15;
      doc.rect(50, yPos, pageWidth, 1).fill('#e5e7eb');
      yPos += 20;

      yPos = addReceiptRow('Hospital Name', receiptData.hospitalName, yPos);
      yPos = addReceiptRow('Hospital Email', receiptData.hospitalEmail, yPos);
      yPos = addReceiptRow('Account Holder', receiptData.accountHolderName, yPos);
      yPos = addReceiptRow('Bank Account', receiptData.maskedAccountNumber, yPos);
      yPos = addReceiptRow('IFSC Code', receiptData.ifscCode, yPos);

      // Amount Section (Highlighted)
      yPos += 20;
      doc.rect(50, yPos, pageWidth, 60).fill('#f8fafc').stroke('#e5e7eb');
      
      doc.fontSize(16).fillColor('#1f2937').font('Helvetica-Bold');
      doc.text('Amount Paid', centerX, yPos + 15, { align: 'center' });
      
      doc.fontSize(28).fillColor('#16a34a').font('Helvetica-Bold');
      doc.text(formatIndianCurrency(receiptData.amount), centerX, yPos + 35, { align: 'center' });

      yPos += 80;

      // Payment Gateway Info
      doc.fontSize(11).fillColor('#6b7280').font('Helvetica');
      doc.text('Payment processed securely via Razorpay', centerX, yPos, { align: 'center' });
      
      // Terms and Footer
      yPos += 30;
      doc.fontSize(9).fillColor('#6b7280');
      const termsText = 'This is a computer-generated receipt for your medical emergency payment. ' +
                       'The amount has been successfully transferred to the hospital account. ' +
                       'Please retain this receipt for your records. For any queries, contact our support team.';
      
      doc.text(termsText, 50, yPos, { width: pageWidth, align: 'justify' });

      // Footer
      yPos += 50;
      doc.rect(50, yPos, pageWidth, 1).fill('#e5e7eb');
      yPos += 15;
      
      doc.fontSize(8).fillColor('#9ca3af');
      doc.text('E-Pay Medical Emergency System | support@epaymedical.com | +91-XXXX-XXXX', 
               centerX, yPos, { align: 'center' });
      
      doc.text(`Generated on: ${currentDateTime.iso}`, 
               centerX, yPos + 12, { align: 'center' });

      // Watermark
      doc.fontSize(72).fillColor('#f3f4f6').rotate(-45);
      doc.text('PAID', centerX - 60, 400, { opacity: 0.1 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateReceiptNumber = (transactionId, date = new Date()) => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const txnShort = String(transactionId).slice(-8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EPR-${dateStr}-${txnShort}-${random}`;
};

module.exports = {
  generateProfessionalReceipt,
  generateReceiptNumber,
  formatIndianCurrency,
  formatIndianNumber
};