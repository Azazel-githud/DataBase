const express = require('express');
const saleController = require('../controllers/saleController');
const router = express.Router();

// ../sales
router.get('/cart', saleController.getCart); // Просмотр корзины
router.post('/cart', saleController.getCart); // POST для корзины
router.get('/addToCart/:prod_id', saleController.addToCart); // Добавить в корзину
router.post('/remove-from-cart/:prod_id', saleController.removeFromCart); // Удалить из корзины
router.post('/update-cart/:prod_id', saleController.updateCartQuantity); // Обновить количество
router.post('/checkout', saleController.cartToOrder); // Оформить заказ
router.get('/order-success/:order_id', saleController.orderSuccess); // Страница успеха

module.exports = router;