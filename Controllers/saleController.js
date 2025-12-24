const { query } = require('./connectController');

// Создание заказа из корзины
const createOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    
    // Получение товаров из корзины пользователя
    const cartQuery = `
      SELECT c.*, p.name, p.price, (c.quantity * p.price) as total_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `;
    
    const cartResult = await query(cartQuery, [userId]);
    const cartItems = cartResult.rows;
    
    if (cartItems.length === 0) {
      return res.redirect('/products/cart');
    }
    
    // Подсчет общей суммы заказа
    const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // Начинаем транзакцию
    await query('BEGIN');
    
    // Создание заказа
    const createOrderQuery = `
      INSERT INTO orders (user_id, total_amount, status)
      VALUES ($1, $2, 'pending')
      RETURNING id
    `;
    
    const orderResult = await query(createOrderQuery, [userId, totalAmount]);
    const orderId = orderResult.rows[0].id;
    
    // Создание элементов заказа и обновление остатков товаров
    for (const cartItem of cartItems) {
      // Добавление элемента заказа
      const insertOrderItemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await query(insertOrderItemQuery, [
        orderId,
        cartItem.product_id,
        cartItem.quantity,
        cartItem.price,
        cartItem.total_price
      ]);
      
      // Обновление остатка товара
      const updateStockQuery = `
        UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2
      `;
      
      await query(updateStockQuery, [cartItem.quantity, cartItem.product_id]);
    }
    
    // Очистка корзины пользователя
    const clearCartQuery = `DELETE FROM cart WHERE user_id = $1`;
    await query(clearCartQuery, [userId]);
    
    // Фиксация транзакции
    await query('COMMIT');
    
    res.redirect(`/sales/order/${orderId}`);
  } catch (error) {
    // Откат транзакции в случае ошибки
    await query('ROLLBACK');
    
    console.error('Ошибка при создании заказа:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Получение информации о заказе
const getOrderById = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const orderId = req.params.id;
    const userId = req.session.userId;
    
    // Проверка, принадлежит ли заказ пользователю
    const orderQuery = `
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1 AND o.user_id = $2
    `;
    
    const orderResult = await query(orderQuery, [orderId, userId]);
    const order = orderResult.rows[0];
    
    if (!order) {
      return res.status(404).render('Home/404', { title: 'Заказ не найден' });
    }
    
    // Получение элементов заказа
    const orderItemsQuery = `
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    
    const orderItemsResult = await query(orderItemsQuery, [orderId]);
    const orderItems = orderItemsResult.rows;
    
    res.render('Sales/order', { 
      title: `Заказ #${order.id}`, 
      order, 
      orderItems 
    });
  } catch (error) {
    console.error('Ошибка при получении заказа:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Получение всех заказов пользователя (для истории покупок)
const getUserOrders = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const userId = req.session.userId;
    
    const ordersQuery = `
      SELECT o.*, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const ordersResult = await query(ordersQuery, [userId]);
    const orders = ordersResult.rows;
    
    res.render('Sales/orders', { title: 'Мои заказы', orders });
  } catch (error) {
    console.error('Ошибка при получении заказов пользователя:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

// Отмена заказа
const cancelOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/clients/login');
    }
    
    const orderId = req.params.id;
    const userId = req.session.userId;
    
    // Проверка, принадлежит ли заказ пользователю и не отменен ли он уже
    const orderQuery = `
      SELECT o.* FROM orders o
      WHERE o.id = $1 AND o.user_id = $2 AND o.status != 'cancelled'
    `;
    
    const orderResult = await query(orderQuery, [orderId, userId]);
    const order = orderResult.rows[0];
    
    if (!order) {
      return res.status(404).render('Home/404', { title: 'Заказ не найден или уже отменен' });
    }
    
    // Начинаем транзакцию
    await query('BEGIN');
    
    // Обновление статуса заказа
    const updateOrderQuery = `UPDATE orders SET status = 'cancelled' WHERE id = $1`;
    await query(updateOrderQuery, [orderId]);
    
    // Возврат товаров на склад (только если заказ еще не выполнен)
    if (order.status === 'pending') {
      const orderItemsQuery = `
        SELECT oi.product_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = $1
      `;
      
      const orderItemsResult = await query(orderItemsQuery, [orderId]);
      const orderItems = orderItemsResult.rows;
      
      for (const item of orderItems) {
        const updateStockQuery = `
          UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2
        `;
        await query(updateStockQuery, [item.quantity, item.product_id]);
      }
    }
    
    // Фиксация транзакции
    await query('COMMIT');
    
    res.redirect('/sales/orders');
  } catch (error) {
    // Откат транзакции в случае ошибки
    await query('ROLLBACK');
    
    console.error('Ошибка при отмене заказа:', error);
    res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  cancelOrder
};