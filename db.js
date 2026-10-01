const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize schema

// Ensure is_deal column exists in existing database
try {
  db.exec('ALTER TABLE products ADD COLUMN is_deal INTEGER DEFAULT 0');
} catch (e) {
  // column already exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    short_description TEXT,
    price REAL NOT NULL DEFAULT 0,
    regular_price REAL,
    sale_price REAL,
    sku TEXT,
    stock_status TEXT DEFAULT 'instock',
    stock_quantity INTEGER,
    image_url TEXT,
    categories TEXT,
    status TEXT DEFAULT 'publish',
    is_deal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
  CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Password hashing helpers
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Auto-seed default admin credentials if table is empty
const adminCountStmt = db.prepare('SELECT COUNT(*) as count FROM admins');
if (adminCountStmt.get().count === 0) {
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const defaultHash = hashPassword('admin123', defaultSalt);
  db.prepare('INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)')
    .run('admin', defaultHash, defaultSalt);
  console.log('[DB] Administrador por defecto creado: Usuario=admin, Contraseña=admin123');
}


// Auto-seed from products.json if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM products');
const currentCount = countStmt.get().count;

if (currentCount === 0) {
  const jsonPath = path.join(__dirname, 'products.json');
  if (fs.existsSync(jsonPath)) {
    console.log('[DB] Inicializando base de datos SQLite con datos de products.json...');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const products = JSON.parse(rawData);

    const insertStmt = db.prepare(`
      INSERT INTO products (
        id, title, slug, description, short_description, price, regular_price, sale_price,
        sku, stock_status, stock_quantity, image_url, categories, status, is_deal
      ) VALUES (
        @id, @title, @slug, @description, @short_description, @price, @regular_price, @sale_price,
        @sku, @stock_status, @stock_quantity, @image_url, @categories, @status, @is_deal
      )
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertStmt.run({
          id: item.id || null,
          title: item.title || 'Producto sin título',
          slug: item.slug || '',
          description: item.description || '',
          short_description: item.short_description || '',
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          regular_price: item.regular_price ? parseFloat(item.regular_price) : null,
          sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
          sku: item.sku || '',
          stock_status: item.stock_status || 'instock',
          stock_quantity: item.stock_quantity !== undefined ? item.stock_quantity : null,
          image_url: item.image_url || '',
          categories: JSON.stringify(item.categories || ['General']),
          status: item.status || 'publish'
        });
      }
    });

    insertMany(products);
    console.log(`[DB] Se insertaron ${products.length} productos en SQLite exitosamente.`);
  }
}

// Database helper functions
module.exports = {
  db,

  getAllProducts({ search, category, status, deal } = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = {};

    if (status && status !== 'all') {
      query += ' AND status = @status';
      params.status = status;
    }

    if (search) {
      query += ' AND (title LIKE @search OR description LIKE @search OR sku LIKE @search)';
      params.search = `%${search}%`;
    }

    if (category && category !== 'all') {
      query += ' AND categories LIKE @category';
      params.category = `%"${category}"%`;
    }

    if (deal !== undefined && deal !== 'all') {
      query += ' AND is_deal = @deal';
      params.deal = (deal === '1' || deal === 1 || deal === true || deal === 'true') ? 1 : 0;
    }

    query += ' ORDER BY id DESC';

    const rows = db.prepare(query).all(params);
    return rows.map(r => ({
      ...r,
      categories: JSON.parse(r.categories || '[]')
    }));
  },

  getProductById(id) {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      categories: JSON.parse(row.categories || '[]')
    };
  },

  createProduct(data) {
    const categories = Array.isArray(data.categories) 
      ? JSON.stringify(data.categories) 
      : JSON.stringify(data.categories ? [data.categories] : ['General']);

    const stmt = db.prepare(`
      INSERT INTO products (
        title, slug, description, short_description, price, regular_price, sale_price,
        sku, stock_status, stock_quantity, image_url, categories, status
      ) VALUES (
        @title, @slug, @description, @short_description, @price, @regular_price, @sale_price,
        @sku, @stock_status, @stock_quantity, @image_url, @categories, @status
      )
    `);

    const result = stmt.run({
      title: data.title || 'Nuevo Producto',
      slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
      description: data.description || '',
      short_description: data.short_description || '',
      price: parseFloat(data.price) || 0,
      regular_price: data.regular_price ? parseFloat(data.regular_price) : (parseFloat(data.price) || 0),
      sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
      sku: data.sku || '',
      stock_status: data.stock_status || 'instock',
      stock_quantity: data.stock_quantity !== undefined && data.stock_quantity !== '' ? parseInt(data.stock_quantity) : null,
      image_url: data.image_url || '',
      categories: categories,
      status: data.status || 'publish',
      is_deal: (data.is_deal === '1' || data.is_deal === 1 || data.is_deal === true || data.is_deal === 'true' || data.is_deal === 'on') ? 1 : 0
    });

    return this.getProductById(result.lastInsertRowid);
  },

  updateProduct(id, data) {
    const current = this.getProductById(id);
    if (!current) return null;

    const categories = data.categories !== undefined
      ? (Array.isArray(data.categories) ? JSON.stringify(data.categories) : JSON.stringify([data.categories]))
      : JSON.stringify(current.categories);

    const stmt = db.prepare(`
      UPDATE products SET
        title = @title,
        slug = @slug,
        description = @description,
        short_description = @short_description,
        price = @price,
        regular_price = @regular_price,
        sale_price = @sale_price,
        sku = @sku,
        stock_status = @stock_status,
        stock_quantity = @stock_quantity,
        image_url = @image_url,
        categories = @categories,
        status = @status,
        is_deal = @is_deal,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({
      id: id,
      title: data.title !== undefined ? data.title : current.title,
      slug: data.slug !== undefined ? data.slug : current.slug,
      description: data.description !== undefined ? data.description : current.description,
      short_description: data.short_description !== undefined ? data.short_description : current.short_description,
      price: data.price !== undefined ? parseFloat(data.price) : current.price,
      regular_price: data.regular_price !== undefined ? (data.regular_price ? parseFloat(data.regular_price) : null) : current.regular_price,
      sale_price: data.sale_price !== undefined ? (data.sale_price ? parseFloat(data.sale_price) : null) : current.sale_price,
      sku: data.sku !== undefined ? data.sku : current.sku,
      stock_status: data.stock_status !== undefined ? data.stock_status : current.stock_status,
      stock_quantity: data.stock_quantity !== undefined ? (data.stock_quantity !== '' ? parseInt(data.stock_quantity) : null) : current.stock_quantity,
      image_url: data.image_url !== undefined ? data.image_url : current.image_url,
      categories: categories,
      status: data.status !== undefined ? data.status : current.status,
      is_deal: data.is_deal !== undefined ? ((data.is_deal === '1' || data.is_deal === 1 || data.is_deal === true || data.is_deal === 'true' || data.is_deal === 'on') ? 1 : 0) : (current.is_deal || 0)
    });

    return this.getProductById(id);
  },

  
  toggleDeal(id) {
    const prod = this.getProductById(id);
    if (!prod) return null;
    const newDeal = prod.is_deal ? 0 : 1;
    db.prepare('UPDATE products SET is_deal = ? WHERE id = ?').run(newDeal, id);
    return this.getProductById(id);
  },

  deleteProduct(id) {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  getCategories() {
    const rows = db.prepare("SELECT categories FROM products WHERE status = 'publish'").all();
    const catSet = new Set();
    for (const r of rows) {
      try {
        const cats = JSON.parse(r.categories || '[]');
        cats.forEach(c => catSet.add(c));
      } catch (e) {}
    }
    return Array.from(catSet).sort();
  },

  getStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const inStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_status = 'instock'").get().count;
    const outOfStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_status = 'outofstock'").get().count;
    const published = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'publish'").get().count;
    const categories = this.getCategories().length;

    return {
      total,
      inStock,
      outOfStock,
      published,
      categories
    };
  },

  // Auth Helpers
  getAdmin(username) {
    return db.prepare('SELECT id, username, password_hash, salt, created_at FROM admins WHERE username = ?').get(username);
  },

  verifyAdmin(username, password) {
    const admin = this.getAdmin(username);
    if (!admin) return false;
    const computedHash = hashPassword(password, admin.salt);
    return computedHash === admin.password_hash;
  },

  updateAdminPassword(username, newPassword) {
    const admin = this.getAdmin(username);
    if (!admin) return false;
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);
    const stmt = db.prepare('UPDATE admins SET password_hash = ?, salt = ? WHERE username = ?');
    const result = stmt.run(newHash, newSalt, username);
    return result.changes > 0;
  },

  // Contact Message Helpers
  createContactMessage({ name, phone, email, subject, message }) {
    const stmt = db.prepare(`
      INSERT INTO contact_messages (name, phone, email, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name || 'Anónimo',
      phone || '',
      email || '',
      subject || 'Consulta General',
      message || ''
    );
    return db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(result.lastInsertRowid);
  },

  getContactMessages() {
    return db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all();
  },

  markContactMessageRead(id) {
    const stmt = db.prepare("UPDATE contact_messages SET status = 'read' WHERE id = ?");
    return stmt.run(id).changes > 0;
  },

  deleteContactMessage(id) {
    const stmt = db.prepare('DELETE FROM contact_messages WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
};

