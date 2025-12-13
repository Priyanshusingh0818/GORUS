const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function initDatabase(dbFile) {
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbFile);

  // create users table if not exists
  db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  // create products table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      image TEXT,
      available INTEGER DEFAULT 1,
      tag TEXT,
      stock INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  // create orders table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_number TEXT UNIQUE NOT NULL,
      total_amount REAL NOT NULL,
      shipping_name TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_phone TEXT NOT NULL,
      payment_method TEXT DEFAULT 'card',
      payment_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`
  ).run();

  // Migration: Add payment columns if they don't exist
  try {
    db.prepare('SELECT payment_id FROM orders LIMIT 1').get();
  } catch (e) {
    try {
      db.prepare('ALTER TABLE orders ADD COLUMN payment_id TEXT').run();
      db.prepare('ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT "pending"').run();
      console.log('Added payment_id and payment_status columns to orders table');
    } catch (err) {
      // Columns might already exist
    }
  }

  // Migration: Add payment_method column if it doesn't exist
  try {
    db.prepare('SELECT payment_method FROM orders LIMIT 1').get();
  } catch (e) {
    try {
      db.prepare('ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT "card"').run();
      console.log('Added payment_method column to orders table');
    } catch (err) {
      // Column might already exist or table might not exist yet
    }
  }

  // create order_items table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );`
  ).run();

  // Seed products if table is empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const insertProduct = db.prepare(
      'INSERT INTO products (name, description, price, unit, image, available, tag, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    const products = [
      ['Pure Desi Ghee', '100% pure desi cow ghee made from traditional bilona method. Rich in vitamins and nutrients.', 1800, 'kg', '/images/ghee.jpg', 1, 'Premium', 50],
      ['Sarso Tel (Mustard Oil)', 'Cold-pressed mustard oil, rich in nutrients. Perfect for cooking and health benefits.', 210, 'litre', '/images/sarso-tel.jpg', 1, 'Fresh', 100],
      ['Fresh Cow Milk', 'Farm-fresh pure cow milk delivered daily. No additives, no preservatives.', 60, 'litre', '/images/milk.jpg', 1, 'Daily Fresh', 200],
      ['Paneer', 'Fresh homemade paneer from pure cow milk.', 320, 'kg', '/images/paneer.jpg', 1, null, 30],
      ['Curd', 'Fresh thick curd made from pure cow milk.', 55, '500ml', '/images/curd.jpg', 1, null, 80],
      ['Buttermilk', 'Refreshing buttermilk made from fresh curd.', 20, '500ml', '/images/buttermilk.jpg', 1, null, 150]
    ];

    products.forEach(product => {
      insertProduct.run(...product);
    });
    console.log('Products seeded successfully');
  }

  return db;
}

module.exports = { initDatabase };
