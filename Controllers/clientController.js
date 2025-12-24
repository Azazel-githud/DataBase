const { query } = require('./connectController');
const bcrypt = require('bcrypt');

// Регистрация нового пользователя
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Проверка, существует ли уже пользователь с таким email или username
    const existingUserQuery = `
      SELECT * FROM users WHERE email = $1 OR username = $2
    `;
    const existingUserResult = await query(existingUserQuery, [email, username]);
    
    if (existingUserResult.rows.length > 0) {
      return res.render('Clients/register', { 
        title: 'Регистрация', 
        error: 'Пользователь с таким email или username уже существует' 
      });
    }
    
    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Создание нового пользователя
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, first_name, last_name
    `;
    
    const result = await query(insertUserQuery, [username, email, passwordHash, firstName, lastName]);
    const user = result.rows[0];
    
    // Авторизация пользователя после регистрации
    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.redirect('/');
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.render('Clients/register', { 
      title: 'Регистрация', 
      error: 'Произошла ошибка при регистрации' 
    });
  }
};

// Авторизация пользователя
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Поиск пользователя по email
    const userQuery = `SELECT * FROM users WHERE email = $1`;
    const userResult = await query(userQuery, [email]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.render('Clients/login', { 
        title: 'Вход', 
        error: 'Неверный email или пароль' 
      });
    }
    
    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.render('Clients/login', { 
        title: 'Вход', 
        error: 'Неверный email или пароль' 
      });
    }
    
    // Авторизация пользователя
    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.redirect('/');
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    res.render('Clients/login', { 
      title: 'Вход', 
      error: 'Произошла ошибка при входе' 
    });
  }
};

// Выход пользователя
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Ошибка при выходе пользователя:', err);
    }
    res.redirect('/');
  });
};

// Получение профиля пользователя
const getProfile = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    
    const userQuery = `SELECT * FROM users WHERE id = $1`;
    const userResult = await query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(404).render('Home/404', { title: 'Пользователь не найден' });
    }
    
    res.render('Clients/profile', { title: 'Профиль', user });
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Получение истории покупок пользователя
const getPurchaseHistory = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    
    // Получение заказов пользователя
    const ordersQuery = `
      SELECT o.*, COUNT(oi.id) as items_count
      FROM orders o
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const ordersResult = await query(ordersQuery, [userId]);
    const orders = ordersResult.rows;
    
    // Для каждого заказа получаем его элементы
    for (const order of orders) {
      const orderItemsQuery = `
        SELECT oi.*, p.name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;
      
      const orderItemsResult = await query(orderItemsQuery, [order.id]);
      order.items = orderItemsResult.rows;
    }
    
    res.render('Clients/purchaseHistory', { 
      title: 'История покупок', 
      orders 
    });
  } catch (error) {
    console.error('Ошибка при получении истории покупок:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Отображение формы регистрации
const showRegisterForm = (req, res) => {
  res.render('Clients/register', { title: 'Регистрация' });
};

// Отображение формы входа
const showLoginForm = (req, res) => {
  res.render('Clients/login', { title: 'Вход' });
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  getPurchaseHistory,
  showRegisterForm,
  showLoginForm
};