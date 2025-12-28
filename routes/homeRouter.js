// /routes/homeRouter.js
const express = require('express');
const router = express.Router();
const { cart } = require('../controllers/connectController');

router.get('/', (req, res) => {
  res.render('index', { cartLen: cart.length }); // ← передаём cartLen в шаблон
});

// router.get('/about', (req, res) => {
//   res.render('about', { cartLen: cart.length });
// });

module.exports = router;