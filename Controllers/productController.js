const { query } = require('./connectController');

// Получение всех товаров с фильтрацией
const getAllProducts = async (req, res) => {
  try {
    const { category, brand, search, sort } = req.query;
    
    let baseQuery = `
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      baseQuery += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }
    
    if (brand) {
      paramCount++;
      baseQuery += ` AND p.brand_id = $${paramCount}`;
      params.push(brand);
    }
    
    if (search) {
      paramCount++;
      baseQuery += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    // Сортировка
    switch(sort) {
      case 'price-asc':
        baseQuery += ' ORDER BY p.price ASC';
        break;
      case 'price-desc':
        baseQuery += ' ORDER BY p.price DESC';
        break;
      case 'name-asc':
        baseQuery += ' ORDER BY p.name ASC';
        break;
      case 'name-desc':
        baseQuery += ' ORDER BY p.name DESC';
        break;
      default:
        baseQuery += ' ORDER BY p.created_at DESC';
    }
    
    const productsResult = await query(baseQuery, params);
    const products = productsResult.rows;
    
    // Получение всех категорий и брендов для фильтров
    const categoriesResult = await query('SELECT * FROM categories ORDER BY name');
    const brandsResult = await query('SELECT * FROM brands ORDER BY name');
    
    const categories = categoriesResult.rows;
    const brands = brandsResult.rows;
    
    res.render('Products/index', { 
      title: 'Товары', 
      products, 
      categories, 
      brands,
      currentCategory: category,
      currentBrand: brand,
      currentSearch: search,
      currentSort: sort
    });
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Получение одного товара
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const productQuery = `
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    
    const productResult = await query(productQuery, [productId]);
    const product = productResult.rows[0];
    
    if (!product) {
      return res.status(404).render('Home/404', { title: 'Товар не найден' });
    }
    
    // Получение похожих товаров
    const similarProductsQuery = `
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1 AND p.id != $2
      LIMIT 4
    `;
    
    const similarProductsResult = await query(similarProductsQuery, [product.category_id, productId]);
    const similarProducts = similarProductsResult.rows;
    
    res.render('Products/detail', { 
      title: product.name, 
      product, 
      similarProducts 
    });
  } catch (error) {
    console.error('Ошибка при получении товара:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Добавление товара в корзину
const addToCart = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    const { productId, quantity = 1 } = req.body;
    
    // Проверяем, есть ли уже такой товар в корзине у пользователя
    const existingCartItemQuery = `
      SELECT * FROM cart WHERE user_id = $1 AND product_id = $2
    `;
    
    const existingCartItemResult = await query(existingCartItemQuery, [userId, productId]);
    const existingCartItem = existingCartItemResult.rows[0];
    
    if (existingCartItem) {
      // Если товар уже в корзине, обновляем количество
      const updateCartQuery = `
        UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3
      `;
      await query(updateCartQuery, [parseInt(quantity), userId, productId]);
    } else {
      // Иначе добавляем новый товар в корзину
      const insertCartQuery = `
        INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)
      `;
      await query(insertCartQuery, [userId, productId, parseInt(quantity)]);
    }
    
    res.redirect('/products');
  } catch (error) {
    console.error('Ошибка при добавлении товара в корзину:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Получение корзины пользователя
const getCart = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    
    const cartQuery = `
      SELECT c.*, p.name, p.price, p.image_url, (c.quantity * p.price) as total_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `;
    
    const cartResult = await query(cartQuery, [userId]);
    const cartItems = cartResult.rows;
    
    // Подсчет общей суммы
    const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);
    
    res.render('Products/cart', { 
      title: 'Корзина', 
      cartItems, 
      totalAmount 
    });
  } catch (error) {
    console.error('Ошибка при получении корзины:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Удаление товара из корзины
const removeFromCart = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    const productId = req.params.id;
    
    const deleteQuery = `
      DELETE FROM cart WHERE user_id = $1 AND product_id = $2
    `;
    
    await query(deleteQuery, [userId, productId]);
    
    res.redirect('/products/cart');
  } catch (error) {
    console.error('Ошибка при удалении товара из корзины:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Обновление количества товара в корзине
const updateCartQuantity = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    const { productId, quantity } = req.body;
    
    if (parseInt(quantity) <= 0) {
      // Если количество <= 0, удаляем товар из корзины
      const deleteQuery = `
        DELETE FROM cart WHERE user_id = $1 AND product_id = $2
      `;
      await query(deleteQuery, [userId, productId]);
    } else {
      // Иначе обновляем количество
      const updateQuery = `
        UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3
      `;
      await query(updateQuery, [parseInt(quantity), userId, productId]);
    }
    
    res.redirect('/products/cart');
  } catch (error) {
    console.error('Ошибка при обновлении количества товара в корзине:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity
};