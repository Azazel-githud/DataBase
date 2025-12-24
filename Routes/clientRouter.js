const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getProfile, 
  getPurchaseHistory,
  showRegisterForm,
  showLoginForm
} = require('../Controllers/clientController');

// Регистрация
router.get('/register', showRegisterForm);
router.post('/register', register);

// Вход
router.get('/login', showLoginForm);
router.post('/login', login);

// Выход
router.get('/logout', logout);

// Профиль
router.get('/profile', getProfile);

// История покупок
router.get('/purchase-history', getPurchaseHistory);

module.exports = router;