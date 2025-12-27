// models/superAdminModel.js
const mongoose = require('mongoose');
const User = require('./user');

const superAdminSchema = new mongoose.Schema({
  govId: { type: String, required: true, trim: true },
  departmentName: { type: String, required: true, trim: true },
  accessLevel: { type: String, enum: ['national', 'state', 'district'], default: 'state' },
  approvedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins' }],
}, { timestamps: true });

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
module.exports = SuperAdmin;
