-- Примеры SQL-запросов для лабораторной работы по базам данных

-- 1. Создание таблицы пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Вставка данных
INSERT INTO users (name, email) VALUES 
('Иван Иванов', 'ivan@example.com'),
('Мария Смирнова', 'maria@example.com'),
('Петр Петров', 'petr@example.com');

-- 3. Выборка всех пользователей
SELECT * FROM users;

-- 4. Выборка пользователя по ID
SELECT * FROM users WHERE id = 1;

-- 5. Обновление данных пользователя
UPDATE users SET name = 'Иван Новиков' WHERE id = 1;

-- 6. Удаление пользователя
DELETE FROM users WHERE id = 1;

-- 7. Выборка с сортировкой
SELECT * FROM users ORDER BY created_at DESC;

-- 8. Выборка с фильтрацией
SELECT * FROM users WHERE name LIKE '%Иван%';

-- 9. Подсчет количества записей
SELECT COUNT(*) FROM users;

-- 10. Выборка с лимитом
SELECT * FROM users LIMIT 10 OFFSET 0;