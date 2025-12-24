const express = require('express');
const router = express.Router();
const { getIndex, getAbout, getContact } = require('../Controllers/homeController');

// Главная страница
router.get('/', getIndex);

// О нас
router.get('/about', getAbout);

// Контакты
router.get('/contact', getContact);

module.exports = router;