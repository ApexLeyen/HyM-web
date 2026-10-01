const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('./auth');

// Setup multer for product image uploads
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (PNG, JPG, JPEG, WEBP, etc.)'));
    }
  }
});

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { search, category, status, deal } = req.query;
    const products = db.getAllProducts({ search, category, status, deal });
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/products (con o sin subida de imagen) - Requiere Autenticación
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.image_url = `/uploads/${req.file.filename}`;
    }

    if (body.categories && typeof body.categories === 'string') {
      try {
        body.categories = JSON.parse(body.categories);
      } catch (e) {
        body.categories = body.categories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const created = db.createProduct(body);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto: ' + error.message });
  }
});

// PUT /api/products/:id (con o sin subida de imagen) - Requiere Autenticación
router.put('/:id', requireAuth, upload.single('image'), (req, res) => {
  try {
    const id = req.params.id;
    const body = { ...req.body };
    if (req.file) {
      body.image_url = `/uploads/${req.file.filename}`;
    }

    if (body.categories && typeof body.categories === 'string') {
      try {
        body.categories = JSON.parse(body.categories);
      } catch (e) {
        body.categories = body.categories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const updated = db.updateProduct(id, body);
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
  }
});

// DELETE /api/products/:id - Requiere Autenticación
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ success: true, message: `Producto #${id} eliminado correctamente` });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// POST /api/products/upload (subida independiente de archivo) - Requiere Autenticación
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    res.json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// PATCH /api/products/:id/toggle-deal (Activar/Desactivar Oferta del Día)
router.patch('/:id/toggle-deal', requireAuth, (req, res) => {
  try {
    const updated = db.toggleDeal(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error al cambiar estado de oferta:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
