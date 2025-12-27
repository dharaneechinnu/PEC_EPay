const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory: Server/uploads/verifier
const uploadDir = path.join(__dirname, '..', 'uploads', 'verifier');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

// Accept any file type under 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  // No fileFilter = accept any file type
});

module.exports = upload;
