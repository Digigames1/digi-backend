// server.js — з перевіркою валюти в API /cart і автовидаленням

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'yourSuperSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: 'lax',
    secure: false
  }
}));

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Головна
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const CART_TIMEOUT_MINUTES = 30;

// Додати в корзину
app.post('/add-to-cart', (req, res) => {
  const { product } = req.body;

  if (!product || !product.id || !product.name || !product.price) {
    return res.status(400).json({ error: 'Invalid product format' });
  }

  if (!req.session.cart) {
    req.session.cart = [];
    req.session.cartCreatedAt = Date.now();
  }

  const now = Date.now();
  if (now - req.session.cartCreatedAt > CART_TIMEOUT_MINUTES * 60 * 1000) {
    req.session.cart = [];
    req.session.cartCreatedAt = now;
  }

  const existing = req.session.cart.find(p => p.id === product.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    product.quantity = 1;
    req.session.cart.push(product);
  }

  res.status(200).json({ success: true });
});

// Повернення кошика (і перевірка таймауту)
app.get('/api/cart', (req, res) => {
  const now = Date.now();
  const timeout = CART_TIMEOUT_MINUTES * 60 * 1000;

  if (req.session.cartCreatedAt && now - req.session.cartCreatedAt > timeout) {
    req.session.cart = [];
    req.session.cartCreatedAt = now;
  }

  res.json({
    items: req.session.cart || []
  });
});

// Видалення товару з корзини
app.post('/remove-from-cart', (req, res) => {
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ error: 'Missing productId' });
  if (!req.session.cart) req.session.cart = [];

  req.session.cart = req.session.cart.filter(p => p._id !== productId);
  res.status(200).json({ success: true });
});

// Checkout і статичні сторінки
app.post('/checkout', (req, res) => {
  res.redirect('https://www.dundle.com/cart/');
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/checkout.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Захист маршрутів
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/add-to-cart') ||
    req.path.startsWith('/remove-from-cart') ||
    req.path.startsWith('/get-cart') ||
    req.path.startsWith('/checkout')
  ) {
    return next();
  }
  if (req.method !== 'GET') return res.status(404).send("Not found");
  next();
});

app.get('/:brand/:region?', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено: http://localhost:${PORT}`);
});


