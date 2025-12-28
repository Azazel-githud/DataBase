const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');

router.get('/', controller.getProducts);
router.get('/add', controller.addProductForm);
router.post('/add', controller.createProduct);
router.get('/edit/:id', controller.editProductForm);
router.post('/update', controller.updateProduct);
router.post('/delete/:id', controller.deleteProduct);

module.exports = router;