const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  addToCart, 
  getCart, 
  removeFromCart, 
  updateCartQuantity 
} = require('../Controllers/productController');

// Все товары с фильтрацией
router.get('/', getAllProducts);

// Детали товара
router.get('/:id', getProductById);

// Добавление товара в корзину
router.post('/add-to-cart', addToCart);

// Корзина пользователя
router.get('/cart', getCart);

// Удаление товара из корзины
router.delete('/cart/:id', removeFromCart);

// Обновление количества товара в корзине
router.put('/cart/update', updateCartQuantity);

module.exports = router;