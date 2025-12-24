const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getOrderById, 
  getUserOrders, 
  cancelOrder 
} = require('../Controllers/saleController');

// Создание заказа из корзины
router.post('/create-order', createOrder);

// Получение информации о конкретном заказе
router.get('/order/:id', getOrderById);

// Получение всех заказов пользователя
router.get('/orders', getUserOrders);

// Отмена заказа
router.post('/cancel/:id', cancelOrder);

module.exports = router;