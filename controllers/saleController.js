const { pool, cart } = require('./connectController');

exports.addToCart = async (req, res) => {
  const { prod_id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE prod_id = $1', [prod_id]);
    if (rows.length > 0 && rows[0].stock > 0) {
      cart.push({ ...rows[0], quantity: 1 });
    }
    res.redirect('/products');
  } catch (err) {
    res.status(500).send('Ошибка');
  }
};

exports.getCart = async (req, res) => {
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { rows: clients } = await pool.query('SELECT * FROM clients');
  res.render('cart', { cart, totalPrice, clients });
};

exports.checkout = async (req, res) => {
  const { email, first_name, last_name, address, city, postcode, country, phone } = req.body;
  let clientId;

  try {
    // 1. Создать клиента (если не существует)
    const clientRes = await pool.query(
      `INSERT INTO clients (email, first_name, last_name, address, city, postcode, country, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name
       RETURNING client_id`,
      [email, first_name, last_name, address, city, postcode, country, phone]
    );
    clientId = clientRes.rows[0].client_id;

    // 2. Создать заказ
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderRes = await pool.query(
      'INSERT INTO orders (client_id, total) VALUES ($1, $2) RETURNING order_id',
      [clientId, total]
    );
    const orderId = orderRes.rows[0].order_id;

    // 3. Вставить позиции заказа
    for (const item of cart) {
      await pool.query(
        `INSERT INTO order_items (order_id, prod_id, quantity, price_at_time)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.prod_id, item.quantity, item.price]
      );
      // Уменьшить stock товара (опционально)
      await pool.query('UPDATE products SET stock = stock - $1 WHERE prod_id = $2',
        [item.quantity, item.prod_id]);
    }

    // 4. Очистить корзину
    cart.length = 0;

    res.redirect('/?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка оформления');
  }
};

exports.getHistory = async (req, res) => {
  const { client_id } = req.params;
  const { rows } = await pool.query(`
    SELECT oi.*, p.prod_name, c.first_name, c.last_name
    FROM order_items oi
    JOIN products p ON oi.prod_id = p.prod_id
    JOIN orders o ON oi.order_id = o.order_id
    JOIN clients c ON o.client_id = c.client_id
    WHERE c.client_id = $1
    ORDER BY oi.item_id DESC
  `, [client_id]);
  res.render('sales/history', { history: rows });
};