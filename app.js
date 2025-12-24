const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const homeRouter = require('./Routes/homeRouter');
const productRouter = require('./Routes/productRouter');
const clientRouter = require('./Routes/clientRouter');
const saleRouter = require('./Routes/saleRouter');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка Handlebars
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'Views', 'layouts'),
  partialsDir: path.join(__dirname, 'Views', 'partials')
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'Views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Сессии
app.use(session({
  secret: process.env.SESSION_SECRET || 'brand-shop-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Роуты
app.use('/', homeRouter);
app.use('/products', productRouter);
app.use('/clients', clientRouter);
app.use('/sales', saleRouter);

// Обработка 404
app.use((req, res) => {
  res.status(404).render('Home/404', { title: 'Страница не найдена' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('Home/500', { title: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});