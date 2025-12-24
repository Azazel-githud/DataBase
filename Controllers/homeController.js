const { query } = require('./connectController');

// Главная страница
const getIndex = async (req, res) => {
  try {
    // Получение популярных товаров (например, с наибольшим количеством в заказах)
    const popularProductsQuery = `
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
      LIMIT 8
    `;
    
    const popularProductsResult = await query(popularProductsQuery);
    const popularProducts = popularProductsResult.rows;

    res.render('Home/index', { 
      title: 'BRAND SHOP - Интернет-магазин брендовых товаров', 
      popularProducts 
    });
  } catch (error) {
    console.error('Ошибка при получении данных для главной страницы:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// О нас
const getAbout = (req, res) => {
  res.render('Home/about', { title: 'О нас' });
};

// Контакты
const getContact = (req, res) => {
  res.render('Home/contact', { title: 'Контакты' });
};

module.exports = {
  getIndex,
  getAbout,
  getContact
};