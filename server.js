const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Static files routing
const publicDir = path.join(__dirname, 'public');
const wpContentDir = path.join(__dirname, 'app/public/wp-content');
const wpIncludesDir = path.join(__dirname, 'app/public/wp-includes');

app.use(express.static(publicDir));

// Serve uploads from public/uploads first, fallback to WordPress uploads
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));
if (fs.existsSync(path.join(publicDir, 'wp-content/uploads'))) {
  app.use('/uploads', express.static(path.join(publicDir, 'wp-content/uploads')));
}
if (fs.existsSync(path.join(wpContentDir, 'uploads'))) {
  app.use('/uploads', express.static(path.join(wpContentDir, 'uploads')));
}

// Serve WordPress assets (CSS, JS, Fonts, Images) for standalone Elementor design
if (fs.existsSync(path.join(publicDir, 'wp-content'))) {
  app.use('/wp-content', express.static(path.join(publicDir, 'wp-content')));
}
if (fs.existsSync(wpContentDir)) {
  app.use('/wp-content', express.static(wpContentDir));
}

if (fs.existsSync(path.join(publicDir, 'wp-includes'))) {
  app.use('/wp-includes', express.static(path.join(publicDir, 'wp-includes')));
}
if (fs.existsSync(wpIncludesDir)) {
  app.use('/wp-includes', express.static(wpIncludesDir));
}

// API Routes
const productsRouter = require('./routes/products');
const { router: authRouter } = require('./routes/auth');
const contactRouter = require('./routes/contact');

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);


// Admin route
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// About & Contact routes
app.get(['/about', '/about/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/about/index.html'));
});

app.get(['/contact', '/contact/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/contact/index.html'));
});

// Shop / Tienda routes
app.get(['/shop', '/shop/', '/tienda', '/tienda/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/shop/index.html'));
});

// Fallback for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 HyM Multiservices Node.js App iniciada con éxito!`);
  console.log(`🌐 Sitio Web (Inicio Elementor): http://localhost:${PORT}/`);
  console.log(`⚙️  Panel de Administración:       http://localhost:${PORT}/admin`);
  console.log(`📦 API de Productos:             http://localhost:${PORT}/api/products`);
  console.log('==================================================');
});
