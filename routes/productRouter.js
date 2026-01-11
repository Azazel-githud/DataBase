const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const upload = require('../config/multerConfig');

router.get('/', controller.getProducts);
router.get('/add', controller.addProductForm);
router.post('/add', upload, (req, res, next) => {
    // Обработка ошибок multer
    if (req.fileValidationError) {
        return res.status(400).send(req.fileValidationError.message);
    }
    if (req.file && !req.file.path) {
        return res.status(500).send('Ошибка сохранения изображения');
    }
    next();
}, controller.createProduct);
router.get('/:prod_id', controller.getProductDetails);
router.get('/edit/:id', controller.editProductForm);
router.post('/update/:id', upload, (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).send(req.fileValidationError.message);
  }
  next();
}, controller.updateProduct);
router.post('/delete/:id', controller.deleteProduct);


module.exports = router;