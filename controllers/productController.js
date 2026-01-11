const { pool, cart } = require('./connectController');
const path = require('path');
const fs = require('fs');

exports.getProducts = async (req, res) => {
  const { cat_id, sort } = req.query;
  let catId = cat_id ? parseInt(cat_id) : undefined;
  if (catId === 0) catId = undefined;

  // Базовые части запроса
  let whereClause = '';
  let orderClause = '';
  const params = [];

  // Фильтрация по категории
  if (catId) {
    whereClause = 'WHERE p.cat_id = $1';
    params.push(catId);
  }

  // Сортировка
  switch (sort) {
    case 'name-asc':
      orderClause = 'ORDER BY p.prod_name ASC';
      break;
    case 'name-desc':
      orderClause = 'ORDER BY p.prod_name DESC';
      break;
    case 'price-asc':
      orderClause = 'ORDER BY p.price ASC';
      break;
    case 'price-desc':
      orderClause = 'ORDER BY p.price DESC';
      break;
    default:
      orderClause = 'ORDER BY p.prod_id'; // по умолчанию
  }

  try {
    // Запрос товаров
    const prodQuery = `
      SELECT p.*, c.cat_name, b.brand_name
      FROM products p
      LEFT JOIN categories c ON p.cat_id = c.cat_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      ${whereClause}
      ${orderClause}
    `;
    const prodRes = await pool.query(prodQuery, params);

    // Запрос категорий (для фильтра)
    const catRes = await pool.query('SELECT * FROM categories ORDER BY cat_name');

    res.render('Products/products', {
      extraCss: 'style1.css',
      products: prodRes.rows,
      categories: catRes.rows,
      curCatId: catId || 0,
      sort: sort || '',
      cartLen: require('./connectController').cart.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка загрузки товаров');
  }
};

exports.addProductForm = async (req, res) => {
  try {
    const [catRes, brandRes] = await Promise.all([
      pool.query('SELECT * FROM categories ORDER BY cat_name'),
      pool.query('SELECT * FROM brands ORDER BY brand_name')
    ]);
    res.render('Products/addProduct', {
      extraCss: "style2.css",
      categories: catRes.rows,
      brands: brandRes.rows,
      cartLen: cart.length
    });
  } catch (err) {
    console.error('Ошибка загрузки формы:', err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.createProduct = async (req, res) => {
  const { prod_name, description, price, stock, cat_id, brand_id, sku } = req.body;
  if (!prod_name || !price || !cat_id) {
    return res.status(400).send('Название, цена и категория обязательны');
  }

  let image_main = '';
  let image_hover = '';
  let image_gallery = [];

  if (req.files?.mainImage?.[0]) {
    image_main = `${req.files.mainImage[0].filename}`;
  }

  if (req.files?.hoverImage?.[0]) {
    image_hover = `${req.files.hoverImage[0].filename}`;
  }

  if (req.files?.galleryImages) {
    image_gallery = req.files.galleryImages.map(f => `${f.filename}`);
  }

  try {
    await pool.query(
      `INSERT INTO products 
       (prod_name, description, price, stock, cat_id, brand_id, 
        image_main, image_hover, image_gallery, sku)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [prod_name, description, parseFloat(price), parseInt(stock) || 0,
       parseInt(cat_id), brand_id ? parseInt(brand_id) : null,
       image_main, image_hover, JSON.stringify(image_gallery), sku || '']
    );
    res.redirect('/products');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сохранения товара');
  }
};

exports.getProductDetails = async (req, res) => {
  const { prod_id } = req.params;
  const product = await pool.query('SELECT * FROM products WHERE prod_id = $1', [prod_id]);
  const relatedProducts = await pool.query('SELECT * FROM products');

  res.render('Products/product-details', {
    extraCss: "style2.css",
    product: product.rows[0],
    relatedProducts: relatedProducts.rows
  })

}

exports.editProductForm = async (req, res) => {
  const { id } = req.params;
  try {
    // Получаем товар
    const prodRes = await pool.query('SELECT * FROM products WHERE prod_id = $1', [id]);
    if (!prodRes.rows.length) return res.status(404).send('Товар не найден');

    // Получаем категории и бренды для выпадающих списков
    const [catRes, brandRes] = await Promise.all([
      pool.query('SELECT * FROM categories ORDER BY cat_name'),
      pool.query('SELECT * FROM brands ORDER BY brand_name')
    ]);

    const product = prodRes.rows[0];
    // Парсим gallery из JSONB → массив
    let image_gallery = [];
    if (product.image_gallery) {
      try {
        image_gallery = JSON.parse(product.image_gallery);
      } catch (e) {
        console.warn('Ошибка парсинга image_gallery:', e);
      }
    }

    res.render('Products/edit', {
      extraCss: 'style2.css',
      product,
      image_gallery,
      categories: catRes.rows,
      brands: brandRes.rows,
      cartLen: require('./connectController').cart.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка загрузки товара');
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { prod_name, description, price, stock, cat_id, brand_id, sku } = req.body;

  if (!prod_name || !price || !cat_id) {
    return res.status(400).send('Название, цена и категория обязательны');
  }

  // Получаем текущий товар (чтобы удалить старые изображения)
  const currentRes = await pool.query('SELECT image_main, image_hover, image_gallery FROM products WHERE prod_id = $1', [id]);
  if (!currentRes.rows.length) return res.status(404).send('Товар не найден');
  const current = currentRes.rows[0];

  // Обработка изображений
  let image_main = current.image_main;
  let image_hover = current.image_hover;
  let image_gallery = current.image_gallery ? JSON.parse(current.image_gallery) : [];

  // Удаляем старые файлы, если загружены новые
  const imgDir = path.join(__dirname, '..', 'public');

  // Основное изображение
  if (req.files?.mainImage?.[0]) {
    if (image_main) {
      const oldPath = path.join(imgDir, image_main);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image_main = `img/${req.files.mainImage[0].filename}`;
  }

  // Ховер
  if (req.files?.hoverImage?.[0]) {
    if (image_hover) {
      const oldPath = path.join(imgDir, image_hover);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image_hover = `img/${req.files.hoverImage[0].filename}`;
  }

  // Галерея (заменяем полностью)
  if (req.files?.galleryImages) {
    // Удаляем старые файлы галереи
    if (Array.isArray(image_gallery)) {
      image_gallery.forEach(imgPath => {
        const oldPath = path.join(imgDir, imgPath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      });
    }
    // Новые файлы
    image_gallery = req.files.galleryImages.map(f => `img/${f.filename}`);
  }

  try {
    await pool.query(
      `UPDATE products SET
        prod_name = $1,
        description = $2,
        price = $3,
        stock = $4,
        cat_id = $5,
        brand_id = $6,
        image_main = $7,
        image_hover = $8,
        image_gallery = $9,
        sku = $10
       WHERE prod_id = $11`,
      [
        prod_name,
        description || '',
        parseFloat(price),
        parseInt(stock) || 0,
        parseInt(cat_id),
        brand_id ? parseInt(brand_id) : null,
        image_main,
        image_hover,
        JSON.stringify(image_gallery),
        sku || '',
        id
      ]
    );
    res.redirect('/products');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка обновления товара');
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Получаем товар, чтобы удалить его изображения
    const { rows } = await pool.query(
      'SELECT image_main, image_hover, image_gallery FROM products WHERE prod_id = $1',
      [id]
    );

    if (!rows.length) {
      return res.status(404).send('Товар не найден');
    }

    const product = rows[0];
    const imgDir = path.join(__dirname, '..', 'public');

    // 2. Удаляем основное изображение
    if (product.image_main) {
      const mainPath = path.join(imgDir, product.image_main);
      if (fs.existsSync(mainPath)) {
        fs.unlinkSync(mainPath);
      }
    }

    // 3. Удаляем ховер-изображение
    if (product.image_hover) {
      const hoverPath = path.join(imgDir, product.image_hover);
      if (fs.existsSync(hoverPath)) {
        fs.unlinkSync(hoverPath);
      }
    }

    // 4. Удаляем все изображения из галереи
    if (product.image_gallery) {
      try {
        const gallery = JSON.parse(product.image_gallery);
        if (Array.isArray(gallery)) {
          gallery.forEach(imgPath => {
            const fullPath = path.join(imgDir, imgPath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (e) {
        console.warn('Ошибка при удалении галереи:', e);
      }
    }

    // 5. Удаляем сам товар из БД
    await pool.query('DELETE FROM products WHERE prod_id = $1', [id]);

    // 6. Перенаправляем обратно в каталог
    res.redirect('/products?deleted=1');
  } catch (err) {
    console.error('Ошибка удаления товара:', err);
    res.status(500).send('Не удалось удалить товар');
  }
};