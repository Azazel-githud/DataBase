// controllers/clientController.js
const { pool, cart } = require('./connectController');

// 1. Список клиентов
exports.getClients = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY client_id');
    res.render('Clients/clients', {
      extraCss: 'style2.css',
      clients: rows,
      cartLen: cart.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка загрузки клиентов');
  }
};

// 2. Форма добавления
exports.addClientForm = (req, res) => {
  res.render('Clients/addClient', {
    extraCss: 'style2.css',
    cartLen: require('./connectController').cart.length
  });
};

// 3. Сохранение нового клиента
exports.createClient = async (req, res) => {
  const { email, first_name, last_name, phone, address, city, country } = req.body;
  if (!email) return res.status(400).send('Email обязателен');

  try {
    await pool.query(
      `INSERT INTO clients (email, first_name, last_name, phone, address, city, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [email, first_name || '', last_name || '', phone || '',
       address || '', city || '', country || 'Australia']
    );
    res.redirect('/clients');
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).send('Клиент с таким email уже существует');
    }
    console.error(err);
    res.status(500).send('Ошибка сохранения клиента');
  }
};

// 4. Форма редактирования
exports.editClientForm = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE client_id = $1', [id]);
    if (!rows.length) return res.status(404).send('Клиент не найден');
    
    res.render('Clients/editClient', {
      extraCss: 'style2.css',
      client: rows[0],
      cartLen: require('./connectController').cart.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка загрузки клиента');
  }
};

// 5. Обновление клиента
exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { email, first_name, last_name, phone, address, city, country } = req.body;
  if (!email) return res.status(400).send('Email обязателен');

  try {
    await pool.query(
      `UPDATE clients SET 
        email = $1, first_name = $2, last_name = $3, phone = $4,
        address = $5, city = $6, country = $7
       WHERE client_id = $8`,
      [email, first_name || '', last_name || '', phone || '',
       address || '', city || '', country || 'Australia', id]
    );
    res.redirect('/clients');
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).send('Клиент с таким email уже существует');
    }
    console.error(err);
    res.status(500).send('Ошибка обновления клиента');
  }
};

// 6. Удаление клиента
exports.deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clients WHERE client_id = $1', [id]);
    res.redirect('/clients');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка удаления клиента');
  }
};