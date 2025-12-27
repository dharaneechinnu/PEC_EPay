/**
 * Backfill script: populate missing adminid on Transaction documents.
 * Usage: node scripts/backfillAdminId.js
 * Make sure MONGO_URL is set in environment or .env is loaded.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const VerifierApplication = require('../models/verifierapplyform');
const Scholarship = require('../models/scholarship');

const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGO;
if (!MONGO_URL) {
  console.error('Please set MONGO_URL in environment');
  process.exit(1);
}

async function backfill() {
  await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const txns = await Transaction.find({ $or: [{ adminid: { $exists: false } }, { adminid: null }] }).limit(5000);
  console.log('Found', txns.length, 'transactions without adminid');

  for (const t of txns) {
    try {
      let adminToSet = null;
      if (t.applicationId) {
        const app = await VerifierApplication.findById(t.applicationId).select('adminId scholarshipId');
        if (app) {
          if (app.adminId) adminToSet = app.adminId;
          else if (app.scholarshipId) {
            const sch = await Scholarship.findById(app.scholarshipId).select('createdBy');
            if (sch && sch.createdBy) adminToSet = sch.createdBy;
          }
        }
      }

      if (adminToSet) {
        t.adminid = adminToSet;
        await t.save();
        console.log('Updated txn', t._id.toString(), '-> adminid', adminToSet.toString());
      } else {
        console.warn('Could not resolve admin for txn', t._id.toString());
      }
    } catch (err) {
      console.error('Error processing txn', t._id.toString(), err.message);
    }
  }

  console.log('Done');
  await mongoose.disconnect();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
