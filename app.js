const express = require('express');
const hbs = require('hbs');
const path = require('path');

const app = express();
const urlencodedParser = express.urlencoded({ extended: false });

// Настройки
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Регистрация partials
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Хелперы
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('sum', (a, b) => a + b);

// Роутеры
const homeRouter = require('./routes/homeRouter');
const productRouter = require('./routes/productRouter');
const clientRouter = require('./routes/clientRouter');
const saleRouter = require('./routes/saleRouter');

app.use('/', homeRouter);
app.use('/products', urlencodedParser, productRouter);
app.use('/clients', urlencodedParser, clientRouter);
app.use('/sales', urlencodedParser, saleRouter);

// 404
app.use((req, res) => {
  res.status(404).send('<h1>404 — Page not found</h1>');
});

// Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});