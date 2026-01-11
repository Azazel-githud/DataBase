const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imgDir = path.join(__dirname, '..', 'public', 'img');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

function cleanName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

function makeFileName(baseName, suffix = '', ext = '.png') {
  const name = cleanName(baseName);
  const timestamp = Date.now();
  return `${name}_${suffix}_${timestamp}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgDir);
  },
  filename: (req, file, cb) => {
    const prodName = req.body.prod_name || 'product';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';

    let suffix = 'img';
    if (file.fieldname === 'mainImage') suffix = 'main';
    else if (file.fieldname === 'hoverImage') suffix = 'hover';
    else if (file.fieldname === 'galleryImages') suffix = 'gallery';

    const fileName = makeFileName(prodName, suffix, ext);
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Только изображения'), ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'hoverImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 5 }
]);