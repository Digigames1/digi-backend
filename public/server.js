const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { sameSite: 'lax', secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

const CART_TIMEOUT_MINUTES = 30;

// Додати товар до кошика
app.post('/add-to-cart', (req, res) => {
  const { product } = req.body;
  if (!product || !product.id || !product.price || !product.currencyCode) {
    return res.status(400).json({ error: "Bad product" });
  }


  product._id = `${product.id}-${Date.now()}`;
  product.addedAt = Date.now();

  if (!req.session.cart) {
    req.session.cart = [];
    req.session.cartCreatedAt = Date.now();
  }

  const now = Date.now();
  if (now - req.session.cartCreatedAt > CART_TIMEOUT_MINUTES * 60 * 1000) {
    req.session.cart = [];
    req.session.cartCreatedAt = now;
  }

  req.session.cart.push(product);
  res.status(200).json({ success: true });
});

// Отримати кошик (тільки актуальні товари)
app.get('/api/cart', (req, res) => {
  const now = Date.now();
  const maxAge = 1000 * 60 * 60; // 1 година

  const allItems = req.session.cart || [];
  const validItems = allItems.filter(item => now - (item.addedAt || 0) < maxAge);

  res.json({ items: validItems });
});

// Видалити товар
app.post('/remove-from-cart', (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) return res.status(200).json({ success: true });

  req.session.cart = req.session.cart.filter(p => p._id !== productId);
  res.status(200).json({ success: true });
});

// Очистити кошик вручну (наприклад при зміні валюти)
app.post('/clear-cart', (req, res) => {
  req.session.cart = [];
  req.session.cartCreatedAt = Date.now();
  res.json({ success: true });
});

// Checkout
app.post('/checkout', (req, res) => {
  res.redirect("https://www.dundle.com/cart/");
});

// HTML сторінки
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/:brand/:region?', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));


