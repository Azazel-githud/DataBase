// ✅ controllers/homeController.js
const { pool, cart } = require('./connectController');

exports.index = async (req, res) => {
    try {
        const products = await pool.query('SELECT * FROM products');
        res.render('index', {
            title: 'BRAND SHOP',
            cartLen: cart.length,
            products: products.rows
        });
    }
    catch (err) {
        console.log('!!!Ошибка!!!', err)
    }
};

exports.about = (req, res) => {
  res.render('about', { cartLen: cart.length });
};