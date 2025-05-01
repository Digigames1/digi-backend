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

// Додати товар
app.post('/add-to-cart', (req, res) => {
  const { product } = req.body;
  if (!product || !product.id || !product.price) return res.status(400).json({ error: "Bad product" });

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

// Показати корзину
app.get('/api/cart', (req, res) => {
  const now = Date.now();
  const timeout = CART_TIMEOUT_MINUTES * 60 * 1000;

  if (req.session.cartCreatedAt && now - req.session.cartCreatedAt > timeout) {
    req.session.cart = [];
    req.session.cartCreatedAt = now;
  }

  res.json({ items: req.session.cart || [] });
});

// Видалити товар
app.post('/remove-from-cart', (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) return res.status(200).json({ success: true });

  req.session.cart = req.session.cart.filter(p => p._id !== productId);
  res.status(200).json({ success: true });
});

// Checkout
app.post('/checkout', (req, res) => {
  res.redirect("https://www.dundle.com/cart/");
});

// Маршрути
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});
app.get('/:brand/:region?', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));



