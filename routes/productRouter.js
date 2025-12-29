// /routes/productRouter.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');

// Важно: порядок маршрутов — сначала параметризованные, потом общие
router.get('/add', ctrl.addProductForm);
router.post('/add', ctrl.createProduct);
router.get('/edit/:id', ctrl.editProductForm);
router.post('/update', ctrl.updateProduct);
router.post('/delete/:id', ctrl.deleteProduct);

// Главный маршрут — в конце!
router.get('/', ctrl.getProducts);

module.exports = router;