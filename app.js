const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');

const app = express();

app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    eq: (a, b) => a === b,
    add: (a, b) => Number(a) + Number(b),
    subtract: (a, b) => Number(a) - Number(b),
    multiply: (a, b) => Number(a) * Number(b),
    divide: (a, b) => b !== 0 ? Number(a) / Number(b) : 0,
    findCategory: (a, b) => {
      const cat = a.find(c => c.cat_id == b);
      return cat ? cat.cat_name : 'Неизвестно';
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Статика
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Роутеры
app.use('/products', require('./routes/productRouter'));
app.use('/sales', require('./routes/saleRouter'));
app.use('/clients', require('./routes/clientRouter'));
app.use('/', require('./routes/homeRouter'));


app.listen(3000, () => {
  console.log('✅ http://localhost:3000');
});