// Скрипт для инициализации базы данных
const { Client } = require('pg');
require('dotenv').config();

// Подключение к PostgreSQL без указания имени базы данных (для создания новой)
const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function initDB() {
  try {
    await client.connect();
    console.log('Подключено к PostgreSQL для инициализации базы данных');

    // Создаем базу данных, если она не существует
    const dbName = process.env.DB_NAME || 'lab_db';
    
    // Проверяем, существует ли база данных
    const dbExists = await client.query(`
      SELECT 1 FROM pg_catalog.pg_database WHERE datname = $1
    `, [dbName]);
    
    if (dbExists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`База данных ${dbName} создана`);
    } else {
      console.log(`База данных ${dbName} уже существует`);
    }

    // Подключаемся к созданной базе данных
    const dbClient = new Client({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    await dbClient.connect();
    console.log(`Подключено к базе данных ${dbName}`);

    // Пример создания таблицы - замените на нужные вам таблицы из вашей лабораторной
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Таблица users создана (если не существовала)');

    // Добавляем пример данных
    await dbClient.query(`
      INSERT INTO users (name, email) 
      VALUES ('Тестовый Пользователь', 'test@example.com') 
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('Пример данных добавлен');

    await dbClient.end();
    console.log('Инициализация базы данных завершена');

  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
  } finally {
    await client.end();
  }
}

initDB();