require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const PORT = process.env.PORT || 3500;
const MONGODB_URL = process.env.MONGO_URL;

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log('Database is connected');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err.message);
  });

// Middleware
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

// Set permissive COOP/COEP headers for local dev (helps with postMessage from popups/one-tap)
app.use((req, res, next) => {
  // Allow popups and cross-origin postMessage for the client during development
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/admin', require('./routes/adminrouter'));
app.use('/Patient', require('./routes/Patientrouter'));
app.use('/hospital', require('./routes/hospitalrouter'));

// Compatibility alias: some clients call /auth/admin/login — map to admin router
app.use('/auth/admin', require('./routes/adminrouter'));
app.use('/auth/hospital', require('./routes/hospitalrouter'));
app.use('/auth/patient', require('./routes/Patientrouter'));


// Multer and general error handler
app.use((err, req, res, next) => {
  // Multer errors (file size, unexpected field, etc.)
  if (err && (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE')) {
    console.error('Multer error:', err.message || err);
    return res.status(400).json({ message: err.message || 'File upload error' });
  }

  // Mongoose validation errors or other expected errors can set status on the error
  if (err && err.status && Number.isInteger(err.status)) {
    console.error('Handled error:', err.message || err);
    return res.status(err.status).json({ message: err.message || 'Error' });
  }

  // Fallback - unexpected server error
  console.error(err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});