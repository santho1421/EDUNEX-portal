const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads');
    if (file.fieldname === 'resume') uploadPath = path.join(uploadPath, 'resumes');
    else if (file.fieldname === 'logo' || file.fieldname === 'profile_photo') uploadPath = path.join(uploadPath, 'profiles');
    else uploadPath = path.join(uploadPath, 'misc');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    resume: ['.pdf', '.doc', '.docx'],
    logo: ['.jpg', '.jpeg', '.png', '.webp'],
    profile_photo: ['.jpg', '.jpeg', '.png', '.webp'],
    thumbnail: ['.jpg', '.jpeg', '.png', '.webp']
  };
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = allowedTypes[file.fieldname] || ['.pdf', '.jpg', '.jpeg', '.png'];
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});

module.exports = upload;
