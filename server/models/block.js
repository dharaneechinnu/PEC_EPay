// models/block.js
// Blockchain model deprecated — keep a permissive schema to avoid runtime errors if referenced.
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('Block', blockSchema);