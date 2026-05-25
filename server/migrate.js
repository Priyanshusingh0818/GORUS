require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrate = async () => {
  console.log('Starting Supabase Database Migration...');
  
  try {
    // Drop existing tables if needed (optional, doing it to ensure clean state since this is a migration script)
    // await pool.query(`DROP TABLE IF EXISTS order_items, orders, products, users;`);

    // Create USERS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        reset_token TEXT,
        reset_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create PRODUCTS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        image TEXT,
        available INTEGER DEFAULT 1,
        tag TEXT,
        stock INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Products table created');

    // Create ORDERS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_number TEXT UNIQUE NOT NULL,
        total_amount REAL NOT NULL,
        shipping_name TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        shipping_phone TEXT NOT NULL,
        payment_method TEXT DEFAULT 'card',
        payment_id TEXT,
        payment_status TEXT DEFAULT 'pending',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Orders table created');

    // Create ORDER_ITEMS table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_name TEXT NOT NULL,
        product_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL
      );
    `);
    console.log('✅ Order Items table created');

    // Seed Initial Products
    const { rows: productRows } = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productRows[0].count) === 0) {
      console.log('Seeding initial products...');
      await pool.query(`
        INSERT INTO products (name, description, price, unit, image, available, tag, stock) VALUES 
        ('Pure Desi Ghee', '100% pure desi cow ghee made from traditional bilona method. Rich in vitamins and nutrients.', 1800, 'kg', '/images/ghee.jpg', 1, 'Premium', 50),
        ('Sarso Tel (Mustard Oil)', 'Cold-pressed mustard oil, rich in nutrients. Perfect for cooking and health benefits.', 210, 'litre', '/images/sarso-tel.jpg', 1, 'Fresh', 100),
        ('Fresh Cow Milk', 'Farm-fresh pure cow milk delivered daily. No additives, no preservatives.', 60, 'litre', '/images/milk.jpg', 1, 'Daily Fresh', 200),
        ('Paneer', 'Fresh homemade paneer from pure cow milk.', 320, 'kg', '/images/paneer.jpg', 1, NULL, 30),
        ('Curd', 'Fresh thick curd made from pure cow milk.', 55, '500ml', '/images/curd.jpg', 1, NULL, 80),
        ('Buttermilk', 'Refreshing buttermilk made from fresh curd.', 20, '500ml', '/images/buttermilk.jpg', 1, NULL, 150)
      `);
      console.log('✅ Products seeded');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
};

migrate();
