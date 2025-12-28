const express = require('express');
const router = express.Router();
const controller = require('../controllers/saleController');

router.get('/cart', controller.getCart);
router.get('/addToCart/:prod_id', controller.addToCart);
router.post('/checkout', controller.checkout);
router.get('/history/:client_id', controller.getHistory);

module.exports = router;