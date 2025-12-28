// /routes/clientRouter.js
const express = require('express');
const router = express.Router();
const { pool, cart } = require('../controllers/connectController');

// Список клиентов
router.get('/', (req, res) => {
  pool.query('SELECT * FROM clients', (err, result) => {
    if (err) return res.status(500).send('Ошибка БД');
    res.render('clients/list', { clients: result.rows });
  });
});

// Форма добавления клиента
router.get('/add', (req, res) => {
  res.render('clients/add');
});

// Сохранение нового клиента
router.post('/add', (req, res) => {
  const { email, first_name, last_name, phone, address, city, postcode, country } = req.body;
  pool.query(
    `INSERT INTO clients (email, first_name, last_name, phone, address, city, postcode, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [email, first_name, last_name, phone, address, city, postcode, country],
    (err) => {
      if (err) return res.status(500).send('Ошибка добавления клиента');
      res.redirect('/clients');
    }
  );
});

// История покупок клиента
router.get('/history/:client_id', (req, res) => {
  const { client_id } = req.params;
  pool.query(
    `SELECT oi.*, p.prod_name 
     FROM order_items oi
     JOIN products p ON oi.prod_id = p.prod_id
     WHERE oi.order_id IN (
       SELECT order_id FROM orders WHERE client_id = $1
     )`,
    [client_id],
    (err, result) => {
      if (err) return res.status(500).send('Ошибка БД');
      res.render('sales/history', { history: result.rows, client_id });
    }
  );
});

module.exports = router;