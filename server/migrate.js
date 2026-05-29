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

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);');

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
        shipping_pincode VARCHAR(6),
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

    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_pincode VARCHAR(6);');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_pincodes (
        id SERIAL PRIMARY KEY,
        pincode VARCHAR(6) UNIQUE NOT NULL,
        city TEXT NOT NULL,
        state TEXT DEFAULT 'Bihar',
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      INSERT INTO delivery_pincodes (pincode, city, state, active)
      VALUES ('802101', 'Buxar', 'Bihar', 1)
      ON CONFLICT (pincode)
      DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state, active = 1;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unsupported_delivery_requests (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        pincode VARCHAR(6) NOT NULL,
        source TEXT DEFAULT 'website',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_delivery_pincodes_active ON delivery_pincodes(active);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_unsupported_delivery_requests_pincode ON unsupported_delivery_requests(pincode);');
    console.log('✅ Delivery pincode tables created');

    // Create MILK SUBSCRIPTIONS tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        milk_type TEXT NOT NULL,
        litres_per_day NUMERIC(10,2) NOT NULL,
        duration_months INTEGER NOT NULL,
        plan_label TEXT NOT NULL,
        price_per_litre NUMERIC(10,2) NOT NULL DEFAULT 55,
        advance_days INTEGER NOT NULL DEFAULT 10,
        advance_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
        advance_remaining NUMERIC(10,2) NOT NULL DEFAULT 0,
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_payment',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT NOT NULL DEFAULT 'upi',
        payment_proof TEXT,
        delivery_address TEXT,
        delivery_phone TEXT,
        delivery_pincode VARCHAR(6),
        pause_started_on DATE,
        renewal_reminder_sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Subscriptions table created');

    await pool.query('ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(6);');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_delivery_logs (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        delivery_date DATE NOT NULL,
        delivered INTEGER NOT NULL DEFAULT 0,
        litres NUMERIC(10,2) NOT NULL DEFAULT 0,
        price_per_litre NUMERIC(10,2) NOT NULL DEFAULT 55,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        note TEXT,
        marked_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subscription_id, delivery_date)
      );
    `);
    console.log('✅ Subscription delivery logs table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_invoices (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        invoice_month TEXT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        delivered_days INTEGER NOT NULL DEFAULT 0,
        delivered_litres NUMERIC(10,2) NOT NULL DEFAULT 0,
        gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        advance_adjusted NUMERIC(10,2) NOT NULL DEFAULT 0,
        amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subscription_id, invoice_month)
      );
    `);
    console.log('✅ Subscription invoices table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_pauses (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        pause_start DATE NOT NULL,
        pause_end DATE,
        days_extended INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Subscription pauses table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_payments (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        amount NUMERIC(10,2) NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'upi',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_proof TEXT,
        payment_type TEXT NOT NULL DEFAULT 'advance',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Subscription payments table created');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_subscription_delivery_date ON subscription_delivery_logs(subscription_id, delivery_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);');

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
