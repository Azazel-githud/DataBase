const { Pool } = require('pg');
require('dotenv').config();

// Создание пула подключений к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'brand_shop',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Функция для выполнения SQL-запросов
const query = (text, params) => {
  return pool.query(text, params);
};

// Тест подключения к базе данных
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Подключение к PostgreSQL успешно:', res.rows[0]);
  } catch (err) {
    console.error('Ошибка подключения к PostgreSQL:', err);
  }
};

module.exports = {
  query,
  testConnection
};