const { pool, cart } = require('./connectController');

// Добавление товара в корзину
exports.addToCart = async (req, res) => {
    try {
        const { prod_id } = req.params;
        
        // Получаем товар из БД
        const result = await pool.query(
            'SELECT * FROM products WHERE prod_id = $1 AND stock > 0',
            [prod_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден или нет в наличии' });
        }
        
        const product = result.rows[0];
        
        // Проверяем, есть ли уже в корзине
        const existingItem = cart.find(item => item.prod_id === parseInt(prod_id));
        
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.quantity * existingItem.price;
        } else {
            cart.push({
                prod_id: product.prod_id,
                prod_name: product.prod_name,
                price: parseFloat(product.price),
                image_main: product.image_main,
                quantity: 1,
                subtotal: parseFloat(product.price),
                stock: product.stock,
                sku: product.sku
            });
        }
        
        // Редирект обратно или на страницу корзины
        const referer = req.get('Referer') || '/products';
        res.redirect(referer);
        
    } catch (err) {
        console.error('Ошибка добавления в корзину:', err);
        res.status(500).render('error', {
            message: 'Ошибка добавления товара в корзину',
            error: err.message
        });
    }
};

// Просмотр корзины
exports.getCart = async (req, res) => {
    try {
        // Получаем список клиентов для выпадающего списка
        const clientsResult = await pool.query(
            'SELECT client_id, email, first_name, last_name, phone FROM clients ORDER BY first_name'
        );
        
        // Считаем общую сумму
        const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
        
        res.render('Sales/Cart', {
            cartItems: cart,
            totalAmount: totalAmount.toFixed(2),
            clients: clientsResult.rows,
            cartCount: cart.length,
            title: 'Корзина покупок'
        });
        
    } catch (err) {
        console.error('Ошибка загрузки корзины:', err);
        res.status(500).render('error', {
            message: 'Ошибка загрузки корзины',
            error: err.message
        });
    }
};

// Оформление заказа
exports.cartToOrder = async (req, res) => {
    try {
        const { client_id, shipping_address, notes } = req.body;
        
        // Проверяем, есть ли товары в корзине
        if (cart.length === 0) {
            return res.status(400).render('error', {
                message: 'Корзина пуста',
                title: 'Ошибка оформления заказа'
            });
        }
        
        // Проверяем клиента
        const clientResult = await pool.query(
            'SELECT * FROM clients WHERE client_id = $1',
            [client_id]
        );
        
        if (clientResult.rows.length === 0) {
            return res.status(404).render('error', {
                message: 'Клиент не найден',
                title: 'Ошибка оформления заказа'
            });
        }
        
        const client = clientResult.rows[0];
        
        // Считаем общую сумму
        const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Начинаем транзакцию
        await pool.query('BEGIN');
        
        try {
            // 1. Создаем заказ
            const orderResult = await pool.query(
                `INSERT INTO orders 
                (client_id, total_amount, shipping_address, notes, status)
                VALUES ($1, $2, $3, $4, 'pending')
                RETURNING order_id`,
                [client_id, totalAmount, shipping_address || client.address, notes]
            );
            
            const orderId = orderResult.rows[0].order_id;
            
            // 2. Добавляем позиции заказа и обновляем остатки
            for (const item of cart) {
                // Проверяем наличие товара
                const productResult = await pool.query(
                    'SELECT stock FROM products WHERE prod_id = $1 FOR UPDATE',
                    [item.prod_id]
                );
                
                if (productResult.rows.length === 0) {
                    throw new Error(`Товар ID ${item.prod_id} не найден`);
                }
                
                const currentStock = productResult.rows[0].stock;
                
                if (currentStock < item.quantity) {
                    throw new Error(`Недостаточно товара "${item.prod_name}". В наличии: ${currentStock}`);
                }
                
                // Добавляем позицию заказа
                await pool.query(
                    `INSERT INTO order_items 
                    (order_id, prod_id, quantity, unit_price)
                    VALUES ($1, $2, $3, $4)`,
                    [orderId, item.prod_id, item.quantity, item.price]
                );
                
                // Обновляем остатки
                await pool.query(
                    'UPDATE products SET stock = stock - $1 WHERE prod_id = $2',
                    [item.quantity, item.prod_id]
                );
            }
            
            // 3. Очищаем корзину
            cart.length = 0;
            
            // 4. Коммитим транзакцию
            await pool.query('COMMIT');
            
            // Редирект на страницу успеха
            res.redirect(`/sales/order-success/${orderId}`);
            
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
        
    } catch (err) {
        console.error('Ошибка оформления заказа:', err);
        res.status(500).render('error', {
            message: 'Ошибка оформления заказа',
            error: err.message,
            title: 'Ошибка оформления'
        });
    }
};

// Страница успешного оформления заказа
exports.orderSuccess = async (req, res) => {
    try {
        const { order_id } = req.params;
        
        const orderResult = await pool.query(`
            SELECT o.*, c.first_name, c.last_name, c.email, c.phone
            FROM orders o
            JOIN clients c ON o.client_id = c.client_id
            WHERE o.order_id = $1
        `, [order_id]);
        
        if (orderResult.rows.length === 0) {
            return res.status(404).render('error', {
                message: 'Заказ не найден',
                title: 'Ошибка'
            });
        }
        
        const order = orderResult.rows[0];
        
        // Получаем товары заказа
        const itemsResult = await pool.query(`
            SELECT oi.*, p.prod_name, p.image_main, p.sku
            FROM order_items oi
            JOIN products p ON oi.prod_id = p.prod_id
            WHERE oi.order_id = $1
            ORDER BY oi.item_id
        `, [order_id]);
        
        res.render('Sales/OrderSuccess', {
            order: order,
            items: itemsResult.rows,
            title: 'Заказ оформлен успешно'
        });
        
    } catch (err) {
        console.error('Ошибка загрузки заказа:', err);
        res.status(500).render('error', {
            message: 'Ошибка загрузки информации о заказе',
            error: err.message
        });
    }
};

// Удаление товара из корзины
exports.removeFromCart = async (req, res) => {
    try {
        const { prod_id } = req.params;
        const index = cart.findIndex(item => item.prod_id === parseInt(prod_id));
        
        if (index !== -1) {
            cart.splice(index, 1);
        }
        
        res.redirect('/sales/cart');
        
    } catch (err) {
        console.error('Ошибка удаления из корзины:', err);
        res.status(500).json({ error: 'Ошибка удаления товара' });
    }
};

// Обновление количества товара в корзине
exports.updateCartQuantity = async (req, res) => {
    try {
        const { prod_id } = req.params;
        const { quantity } = req.body;
        
        const item = cart.find(item => item.prod_id === parseInt(prod_id));
        
        if (item) {
            const newQuantity = parseInt(quantity);
            if (newQuantity > 0 && newQuantity <= item.stock) {
                item.quantity = newQuantity;
                item.subtotal = item.price * newQuantity;
            }
        }
        
        res.redirect('/sales/cart');
        
    } catch (err) {
        console.error('Ошибка обновления корзины:', err);
        res.status(500).json({ error: 'Ошибка обновления количества' });
    }
};