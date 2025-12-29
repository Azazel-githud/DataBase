const express = require('express');
const hbs = require('hbs');
const path = require('path');

const app = express();

// Настройки
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // ← отдаёт /css/, /img/

// Хелперы (если нужны)
hbs.registerHelper('eq', (a, b) => a === b);

// Главная
app.get('/', (req, res) => {
  // Пример данных — потом замените на запрос к БД
  const products = [
    { prod_id: 1, prod_name: "Gift Pack In-Spiral", price: 40.00, image_main: "11.png", image_hover: "1.png", color_hex: "#f36480" },
    { prod_id: 2, prod_name: "Midcity Notebook Holder", price: 65.00, image_main: "12.png", image_hover: "i2.png", color_hex: "#8ddeed" },
    { prod_id: 3, prod_name: "In-Spiral Notebook B5", price: 20.00, image_main: "112image.png", color_hex: "#000000" },
    { prod_id: 3, prod_name: "In-Spiral Notebook B5", price: 20.00, image_main: "112image.png", color_hex: "#000000" },
    { prod_id: 3, prod_name: "In-Spiral Notebook B5", price: 20.00, image_main: "112image.png", color_hex: "#000000" },
    { prod_id: 3, prod_name: "In-Spiral Notebook B5", price: 20.00, image_main: "112image.png", color_hex: "#000000" },
    { prod_id: 3, prod_name: "In-Spiral Notebook B5", price: 20.00, image_main: "112image.png", color_hex: "#000000" }
  ];
  res.render('index', { products, cartLen: 3 });
});

// 404
app.use((req, res) => {
  res.status(404).send('<h2>404 — Страница не найдена</h2>');
});

app.listen(3000, () => {
  console.log('✅ http://localhost:3000');
});