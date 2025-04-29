// server.js — з доданим маршрутом /api/cart

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

// =======================
// ==== ROUTES BELOW ====
// =======================

// Головна
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Кошик (HTML)
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Додати в корзину
const CART_TIMEOUT_MINUTES = 30;
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

// ✅ Повернення кошика (JSON формат)
app.get('/api/cart', (req, res) => {
  res.json({
    items: req.session.cart || []
  });
});

// Видалити з корзини
app.post('/remove-from-cart', (req, res) => {
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ error: 'Missing productId' });
  if (!req.session.cart) req.session.cart = [];

  req.session.cart = req.session.cart.filter(p => p.id !== productId);
  res.status(200).json({ success: true });
});

// Замовлення
app.post('/api/order', (req, res) => {
  const { productId, email, name, price, quantity } = req.body;

  if (!productId || !email || !name || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log("✅ Нове замовлення:", { productId, email, name, price, quantity });
  res.status(200).json({ success: true, orderId: Math.floor(Math.random() * 1000000) });
});

// Переадресація на оплату
app.post('/checkout', (req, res) => {
  res.redirect('https://www.dundle.com/cart/');
});

// Checkout сторінка
app.get('/checkout.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Захист API маршрутів
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

// Catch-all для динамічних сторінок
app.get('/:brand/:region?', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено: http://localhost:${PORT}`);
});


