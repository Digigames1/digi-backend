const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'yourSuperSecretKey',
  resave: false,
  saveUninitialized: true
}));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// ==== ROUTES BELOW ====
// =======================

// Головна сторінка (можеш змінити на index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Отримати корзину
app.get('/get-cart', (req, res) => {
  res.json(req.session.cart || []);
});

// Відображення кошика
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Додати товар до кошика
app.post('/add-to-cart', (req, res) => {
  const { product } = req.body;

  if (!product || !product.id || !product.name || !product.price) {
    return res.status(400).json({ error: 'Invalid product format' });
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart.push(product);
  res.redirect('/cart');
});

// Сторінка оформлення замовлення (можна перенаправити на сторонній сервіс)
app.post('/checkout', (req, res) => {
  // Ти можеш реалізувати тут інтеграцію з Dundle або іншим платіжним сервісом
  res.redirect('https://www.dundle.com/cart/');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено: http://localhost:${PORT}`);
});
