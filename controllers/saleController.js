const { pool, cart } = require('./connectController');

exports.addToCart = async (req, res) => {
  const { prod_id } = req.params;
  const { rows } = await pool.query('SELECT * FROM products WHERE prod_id = $1', [prod_id]);
  if (rows[0]) cart.push({ ...rows[0], quantity: 1 });
  res.redirect('/products');
};

exports.getCart = async (req, res) => {
  const totalPrice = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const { rows: clients } = await pool.query('SELECT * FROM clients');
  res.render('cart', { cart, totalPrice, clients, cartLen: cart.length });
};

exports.checkout = async (req, res) => {
  const { email, first_name, last_name, address, city, postcode, country, phone } = req.body;

  // 1. Клиент (INSERT или UPDATE)
  const client = await pool.query(
    `INSERT INTO clients (email, first_name, last_name, address, city, postcode, country, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
     RETURNING client_id`,
    [email, first_name, last_name, address, city, postcode, country, phone]
  );

  // 2. Заказ
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const order = await pool.query(
    'INSERT INTO orders (client_id, total) VALUES ($1, $2) RETURNING order_id',
    [client.rows[0].client_id, total]
  );

  // 3. Позиции
  for (const item of cart) {
    await pool.query(
      'INSERT INTO order_items (order_id, prod_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
      [order.rows[0].order_id, item.prod_id, item.quantity || 1, item.price]
    );
  }

  cart.length = 0; // очистка
  res.redirect('/');
};