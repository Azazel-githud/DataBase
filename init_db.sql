-- Создание базы данных для интернет-магазина BRAND SHOP

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы брендов
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    brand_id INTEGER REFERENCES brands(id),
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы корзин
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы элементов заказов
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- Создание таблицы отзывов
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);

-- Вставка начальных данных

-- Бренды
INSERT INTO brands (name, description) VALUES
('Gucci', 'Итальянский дом моды, основанный в 1921 году в Florence, Италия.'),
('Chanel', 'Французский дом моды, основанный Габриэль "Коко" Шанель.'),
('Louis Vuitton', 'Французский дом моды, основанный в 1854 году.'),
('Hermès', 'Французский дом моды, специализирующийся на кожевенных изделиях.'),
('Dior', 'Французский дом моды, основанный Кристианом Диором в 1946 году.'),
('Prada', 'Итальянский дом моды, основанный в 1913 году.'),
('H&M', 'Шведская компания одежды и аксессуаров.'),
('Zara', 'Испанская компания одежды и аксессуаров.');

-- Категории
INSERT INTO categories (name, description) VALUES
('Одежда', 'Брендовая одежда для мужчин и женщин.'),
('Косметика', 'Брендовая косметика и уход за кожей.'),
('Сумки', 'Брендовые сумки и клатчи.'),
('Обувь', 'Брендовая обувь для мужчин и женщин.'),
('Аксессуары', 'Брендовые аксессуары и украшения.');

-- Примеры товаров
INSERT INTO products (name, description, price, category_id, brand_id, stock_quantity) VALUES
('Платье Gucci', 'Элегантное вечернее платье от Gucci', 2500.00, 1, 1, 10),
('Туалетная вода Chanel', 'Популярная туалетная вода Chanel No. 5', 1200.00, 2, 2, 25),
('Сумка Louis Vuitton', 'Классическая сумка Speedy от Louis Vuitton', 3200.00, 3, 3, 5),
('Туфли Dior', 'Элегантные туфли на каблуке от Dior', 1800.00, 4, 5, 8),
('Солнцезащитные очки Prada', 'Стильные солнцезащитные очки от Prada', 800.00, 5, 6, 15),
('Косметичка Hermès', 'Элегантная косметичка из кожи от Hermès', 4500.00, 3, 4, 3),
('Пальто H&M', 'Модное пальто осень-зима от H&M', 350.00, 1, 7, 20),
('Кроссовки Zara', 'Удобные кроссовки от Zara', 120.00, 4, 8, 30);