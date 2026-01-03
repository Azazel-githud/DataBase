const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'brand_shop',
  password: 'postgresql',
});

let cart = [];

module.exports = { pool, cart };