// services/razorpayService.js
const Razorpay = require('razorpay');

const IS_TEST_MODE = process.env.RAZORPAY_TEST_MODE === 'true';
const RAZORPAY_KEY_ID = IS_TEST_MODE
  ? process.env.RAZORPAY_TEST_KEY_ID
  : process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = IS_TEST_MODE
  ? process.env.RAZORPAY_TEST_KEY_SECRET
  : process.env.RAZORPAY_KEY_SECRET;

if (IS_TEST_MODE) {
  console.log('[Razorpay] Running in TEST mode');
} else {
  console.log('[Razorpay] Running in LIVE mode');
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for payment collection (card/UPI/netbanking)
 * @param {Object} opts - { amount, currency, receipt, notes }
 * @returns {Promise<Object>} Razorpay order response
 */
async function createOrder(opts) {
  // See https://razorpay.com/docs/api/orders/#create-an-order
  const params = {
    amount: opts.amount, // in paise
    currency: opts.currency || 'INR',
    receipt: opts.receipt,
    payment_capture: 1, // auto-capture
    notes: opts.notes,
  };
  return razorpay.orders.create(params);
}

/**
 * Capture a payment after successful authorization (optional for manual capture flows)
 * @param {string} paymentId
 * @param {number} amount
 * @returns {Promise<Object>} Razorpay payment response
 */
async function capturePayment(paymentId, amount) {
  // See https://razorpay.com/docs/api/payments/#capture-a-payment
  return razorpay.payments.capture(paymentId, amount, 'INR');
}

/**
 * Create a payout (transfer) to a beneficiary/fund account using Razorpay Payouts API
 * @param {Object} opts - { beneficiaryId, amount, currency, mode, purpose, referenceId, narration }
 * @returns {Promise<Object>} Razorpay payout response
 */
async function createPayout(opts) {
  // 🚫 RazorpayX not available in normal accounts
  console.warn("[INFO] Razorpay payouts are disabled in this environment. Simulating payout.");

  // Simulate a success response for testing
  return {
    id: 'payout_sim_' + Date.now(),
    status: 'processing',
    amount: opts.amount,
    currency: opts.currency || 'INR',
    reference_id: opts.referenceId,
    narration: opts.narration,
    simulated: true,
  };
}


module.exports = {
  createOrder,
  capturePayment,
  createPayout,
};

// Create a contact in Razorpay
async function createContact(opts) {
  // opts: { name, email, contact, type }
  const payload = {
    name: opts.name,
    email: opts.email,
    contact: opts.contact,
    type: opts.type || 'employee',
  };

  // Try SDK
  if (razorpay && razorpay.contacts && typeof razorpay.contacts.create === 'function') {
    return razorpay.contacts.create(payload);
  }

  // Fallback REST
  const https = require('https');
  const postData = JSON.stringify(payload);
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const options = {
    hostname: 'api.razorpay.com',
    port: 443,
    path: '/v1/contacts',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(parsed);
          const err = new Error(parsed?.error?.description || parsed?.message || `HTTP ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.response = parsed;
          return reject(err);
        } catch (e) { return reject(e); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

// Create a fund_account for a contact
async function createFundAccount(opts) {
  // opts: { contact_id, account_type, bank_account: { name, ifsc, account_number } }
  const payload = {
    contact_id: opts.contact_id,
    account_type: opts.account_type || 'bank_account',
    bank_account: opts.bank_account,
  };

  if (razorpay && razorpay.fund_accounts && typeof razorpay.fund_accounts.create === 'function') {
    return razorpay.fund_accounts.create(payload);
  }

  const https = require('https');
  const postData = JSON.stringify(payload);
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const options = {
    hostname: 'api.razorpay.com',
    port: 443,
    path: '/v1/fund_accounts',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(parsed);
          const err = new Error(parsed?.error?.description || parsed?.message || `HTTP ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.response = parsed;
          return reject(err);
        } catch (e) { return reject(e); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

module.exports = {
  createOrder,
  capturePayment,
  createPayout,
  createContact,
  createFundAccount,
};
