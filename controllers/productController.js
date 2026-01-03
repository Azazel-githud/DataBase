// /controllers/productController.js
const { pool, cart } = require('./connectController');

// Главная страница каталога + фильтрация
exports.getProducts = async (req, res) => {
  const { cat_id } = req.query;
  const catId = cat_id && cat_id !== '0' ? parseInt(cat_id) : null;

  try {
    // Товары
    let query = `
      SELECT p.*, c.cat_name
      FROM products p
      JOIN categories c ON p.cat_id = c.cat_id`;
    const params = [];
    if (catId) {
      query += ' WHERE p.cat_id = $1';
      params.push(catId);
    }
    query += ' ORDER BY p.prod_id';
    const prodRes = await pool.query(query, params);

    // Категории (для фильтра)
    const catRes = await pool.query('SELECT * FROM categories ORDER BY cat_name');

    res.render('products', {
      products: prodRes.rows,
      categories: catRes.rows,
      curCatId: catId,
      cartLen: cart.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка БД');
  }
};

// --- CRUD ---
exports.addProductForm = async (req, res) => {
  const [catRes, brandRes] = await Promise.all([
    pool.query('SELECT * FROM categories'),
    pool.query('SELECT * FROM brands')
  ]);
  res.render('products/add', { categories: catRes.rows, brands: brandRes.rows, cartLen: cart.length });
};

exports.createProduct = async (req, res) => {
  const { prod_name, description, price, stock = 10, cat_id, brand_id, image_main, image_hover, sku } = req.body;
  await pool.query(
    `INSERT INTO products (prod_name, description, price, stock, cat_id, brand_id, image_main, image_hover, sku)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [prod_name, description, price, stock, cat_id, brand_id || null, image_main, image_hover, sku]
  );
  res.redirect('/products');
};

// Аналогично: editProductForm, updateProduct, deleteProduct — как выше