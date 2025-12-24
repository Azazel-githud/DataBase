// Модель для работы с пользователями
const { Client } = require('pg');
require('dotenv').config();

// Подключение к базе данных
const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lab_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

class User {
  constructor() {
    this.client = client;
  }

  async connect() {
    if (this.client) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
    }
  }

  // Метод для получения всех пользователей
  async getAll() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM users ORDER BY id');
      return result.rows;
    } catch (err) {
      console.error('Ошибка при получении пользователей:', err);
      throw err;
    } finally {
      await this.disconnect();
    }
  }

  // Метод для получения пользователя по ID
  async getById(id) {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Ошибка при получении пользователя по ID:', err);
      throw err;
    } finally {
      await this.disconnect();
    }
  }

  // Метод для создания нового пользователя
  async create(userData) {
    try {
      await this.connect();
      const { name, email } = userData;
      const result = await this.client.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Ошибка при создании пользователя:', err);
      throw err;
    } finally {
      await this.disconnect();
    }
  }

  // Метод для обновления пользователя
  async update(id, userData) {
    try {
      await this.connect();
      const { name, email } = userData;
      const result = await this.client.query(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
        [name, email, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Ошибка при обновлении пользователя:', err);
      throw err;
    } finally {
      await this.disconnect();
    }
  }

  // Метод для удаления пользователя
  async delete(id) {
    try {
      await this.connect();
      await this.client.query('DELETE FROM users WHERE id = $1', [id]);
      return { message: 'Пользователь успешно удален' };
    } catch (err) {
      console.error('Ошибка при удалении пользователя:', err);
      throw err;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = User;