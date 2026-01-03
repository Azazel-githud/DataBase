const express = require('express');
const hbs = require('hbs');
const path = require('path');

const app = express();
const urlencodedParser = express.urlencoded({ extended: false });

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

hbs.registerHelper('eq', (a, b) => a === b);

// Роутеры
app.use('/', require('./routes/homeRouter'));
app.use('/products', urlencodedParser, require('./routes/productRouter'));
app.use('/sales', urlencodedParser, require('./routes/saleRouter'));

app.listen(3000, () => {
  console.log('✅ http://localhost:3000');
});