const multer = require('multer');
const path = require('path');

// Filter hanya izinkan .xls, .xlsx, dan .csv
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xls' || ext === '.xlsx' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file Excel atau CSV yang diperbolehkan'));
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/workshop/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.fieldname}${ext}`);
  }
});

const uploadExcel = multer({ storage, fileFilter });

module.exports = uploadExcel;
