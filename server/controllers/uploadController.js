const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/screenshots');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `screenshot-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'));
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

const uploadScreenshot = (req, res, next) => {
  if (!req.file) {
    const err = new Error('No file uploaded');
    err.statusCode = 400;
    return next(err);
  }

  // Return the URL path
  const fileUrl = `/uploads/screenshots/${req.file.filename}`;
  res.status(201).json({
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.filename,
  });
};

module.exports = {
  upload,
  uploadScreenshot,
};
