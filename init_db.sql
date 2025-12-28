\c brand_shop;

CREATE TABLE categories (
  cat_id SERIAL PRIMARY KEY,
  cat_name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE
);

CREATE TABLE products (
  prod_id SERIAL PRIMARY KEY,
  prod_name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  stock INT DEFAULT 10,
  cat_id INT REFERENCES categories(cat_id),
  brand_id INT REFERENCES brands(brand_id),
  image_main VARCHAR(255),
  image_hover VARCHAR(255),
  sku VARCHAR(50) UNIQUE
);

CREATE TABLE clients (
  client_id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postcode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Australia',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(client_id),
  total DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, shipped
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  item_id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
  prod_id INT REFERENCES products(prod_id),
  quantity INT DEFAULT 1,
  price_at_time DECIMAL(10,2)
);

INSERT INTO categories (cat_name, slug) VALUES
  ('NEW ARRIVALS', 'new-arrivals'),
  ('DIARIES & CALENDARS', 'diaries-calendars'),
  ('PLAN & WRITE', 'plan-write'),
  ('CARRY', 'carry'),
  ('LIFESTYLE', 'lifestyle'),
  ('GIFTING', 'gifting'),
  ('SALE', 'sale');

INSERT INTO brands (brand_name) VALUES
  ('kikki.K'), ('Moleskine'), ('Paperblanks'), ('Field Notes');

INSERT INTO products (prod_name, description, price, stock, cat_id, brand_id, image_main, image_hover, sku) VALUES
  ('Gift Pack In-Spiral', 'Freshly curated gift set...', 40.00, 15, 1, 1, 'img/11.png', 'img/1.png', 'GP-IS-001'),
  ('Midcity Notebook Holder', 'Leather notebook holder...', 65.00, 8, 4, 1, 'img/12.png', 'img/i2.png', 'MNH-002'),
  ('In-Spiral Notebook B5', 'Lined notebook, coral...', 20.00, 22, 3, 1, 'img/112image.png', '', 'ISN-B5-003');