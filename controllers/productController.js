// /controllers/productController.js
const { pool, cart } = require('./connectController');

// ===========================================
// 1. GET /products — вывод всех товаров + фильтрация
// ===========================================
exports.getProducts = async (req, res) => {
  const { cat_id } = req.query;
  let catId = cat_id ? parseInt(cat_id) : null;
  if (catId === 0) catId = null; // "Все категории" → null

  // Основные запросы
  const queryProducts = `
    SELECT p.*, c.cat_name
    FROM products p
    JOIN categories c ON p.cat_id = c.cat_id
    ${catId ? 'WHERE p.cat_id = $1' : ''}
    ORDER BY p.prod_id
  `;

  const queryCategories = 'SELECT * FROM categories ORDER BY cat_name';

  try {
    // Параллельный запуск двух запросов
    const [prodRes, catRes] = await Promise.all([
      pool.query(queryProducts, catId ? [catId] : []),
      pool.query(queryCategories)
    ]);

    res.render('products', {
      products: prodRes.rows,
      categories: catRes.rows,
      curCatId: catId,
      cartLen: cart.length
    });
  } catch (err) {
    console.error('Ошибка в getProducts:', err);
    res.status(500).send('Ошибка базы данных при загрузке товаров');
  }
};

// ===========================================
// 2. GET /products/add — форма добавления
// ===========================================
exports.addProductForm = async (req, res) => {
  try {
    const [catRes, brandRes] = await Promise.all([
      pool.query('SELECT * FROM categories ORDER BY cat_name'),
      pool.query('SELECT * FROM brands ORDER BY brand_name')
    ]);

    res.render('products/add', {
      categories: catRes.rows,
      brands: brandRes.rows,
      cartLen: cart.length
    });
  } catch (err) {
    console.error('Ошибка в addProductForm:', err);
    res.status(500).send('Ошибка при загрузке справочников');
  }
};

// ===========================================
// 3. POST /products/add — сохранение нового товара
// ===========================================
exports.createProduct = async (req, res) => {
  const {
    prod_name,
    description,
    price,
    stock = 10,
    cat_id,
    brand_id,
    image_main,
    image_hover,
    sku
  } = req.body;

  // Валидация (минимум)
  if (!prod_name || !price || !cat_id) {
    return res.status(400).send('Название, цена и категория обязательны');
  }

  const query = `
    INSERT INTO products (prod_name, description, price, stock, cat_id, brand_id, image_main, image_hover, sku)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING prod_id
  `;

  try {
    const values = [
      prod_name,
      description || '',
      parseFloat(price),
      parseInt(stock),
      parseInt(cat_id),
      brand_id ? parseInt(brand_id) : null,
      image_main || '',
      image_hover || '',
      sku || null
    ];

    const result = await pool.query(query, values);
    console.log(`✅ Товар "${prod_name}" (ID: ${result.rows[0].prod_id}) добавлен`);
    res.redirect('/products');
  } catch (err) {
    console.error('Ошибка в createProduct:', err);
    res.status(500).send(`Ошибка добавления товара: ${err.message}`);
  }
};

// ===========================================
// 4. GET /products/edit/:id — форма редактирования
// ===========================================
exports.editProductForm = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send('ID товара не указан');

  try {
    const [prodRes, catRes, brandRes] = await Promise.all([
      pool.query('SELECT * FROM products WHERE prod_id = $1', [id]),
      pool.query('SELECT * FROM categories ORDER BY cat_name'),
      pool.query('SELECT * FROM brands ORDER BY brand_name')
    ]);

    if (prodRes.rows.length === 0) {
      return res.status(404).send('Товар не найден');
    }

    res.render('products/edit', {
      product: prodRes.rows[0],
      categories: catRes.rows,
      brands: brandRes.rows,
      cartLen: cart.length
    });
  } catch (err) {
    console.error('Ошибка в editProductForm:', err);
    res.status(500).send('Ошибка при загрузке товара на редактирование');
  }
};

// ===========================================
// 5. POST /products/update — обновление
// ===========================================
exports.updateProduct = async (req, res) => {
  const {
    id,
    prod_name,
    description,
    price,
    stock,
    cat_id,
    brand_id,
    image_main,
    image_hover,
    sku
  } = req.body;

  if (!id) return res.status(400).send('ID товара не указан');

  const query = `
    UPDATE products
    SET prod_name = $1,
        description = $2,
        price = $3,
        stock = $4,
        cat_id = $5,
        brand_id = $6,
        image_main = $7,
        image_hover = $8,
        sku = $9,
        updated_at = NOW()
    WHERE prod_id = $10
  `;

  try {
    const values = [
      prod_name,
      description || '',
      parseFloat(price),
      parseInt(stock),
      parseInt(cat_id),
      brand_id ? parseInt(brand_id) : null,
      image_main || '',
      image_hover || '',
      sku || null,
      parseInt(id)
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).send('Товар для обновления не найден');
    }

    console.log(`✅ Товар ID=${id} обновлён`);
    res.redirect('/products');
  } catch (err) {
    console.error('Ошибка в updateProduct:', err);
    res.status(500).send(`Ошибка обновления товара: ${err.message}`);
  }
};

// ===========================================
// 6. POST /products/delete/:id — удаление
// ===========================================
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send('ID товара не указан');

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE prod_id = $1',
      [parseInt(id)]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Товар для удаления не найден');
    }

    console.log(`🗑️ Товар ID=${id} удалён`);
    res.redirect('/products');
  } catch (err) {
    console.error('Ошибка в deleteProduct:', err);
    if (err.code === '23503') { // foreign_key_violation
      return res.status(400).send('Невозможно удалить: товар есть в заказах');
    }
    res.status(500).send(`Ошибка удаления товара: ${err.message}`);
  }
};