require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDatabase } = require('./db');
const authRoutesFactory = require('./routes/auth');
const adminRoutesFactory = require('./routes/admin');
const productsRoutesFactory = require('./routes/products');
const ordersRoutesFactory = require('./routes/orders');
const analyticsRoutesFactory = require('./routes/analytics');
const paymentsRoutesFactory = require('./routes/payments');
const { authMiddleware, adminOnly } = require('./middleware/auth');

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using default for development only.');
  console.warn('⚠️  Set JWT_SECRET in .env file for production!');
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production-' + Date.now();
}

const PORT = process.env.PORT || 5000;
const DB_FILE = process.env.DB_FILE || './data/database.sqlite3';

const app = express();

/* ✅ FIX FOR express-rate-limit + X-Forwarded-For */
app.set('trust proxy', 1);

/* Security & parsing middlewares */
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* CORS */
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
}));

/* Rate limiting */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Serve uploaded payment proofs (only accessible with proper authentication)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
let db;
try {
  db = initDatabase(DB_FILE);
  console.log('✅ Database initialized successfully');
  
  // Add payment_proof column if it doesn't exist
  try {
    db.prepare('SELECT payment_proof FROM orders LIMIT 1').get();
    console.log('✅ payment_proof column exists');
  } catch (e) {
    try {
      db.prepare('ALTER TABLE orders ADD COLUMN payment_proof TEXT').run();
      console.log('✅ Added payment_proof column to orders table');
    } catch (err) {
      console.error('❌ Could not add payment_proof column:', err.message);
    }
  }
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
}

// Seed admin user if ADMIN_EMAIL and ADMIN_PASSWORD provided
(async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('ℹ️  No admin credentials provided. Skipping admin user creation.');
      return;
    }

    const find = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

    if (!find) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(adminPassword, 12);
      const insert = db.prepare(
        'INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)'
      );
      insert.run('Admin', adminEmail, hash);
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('ℹ️  Admin user already exists:', adminEmail);
    }
  } catch (error) {
    console.error('⚠️  Error seeding admin user:', error.message);
  }
})();

/* Routes */
app.use('/api/auth', authRoutesFactory(db));
app.use('/api/auth/profile', authMiddleware);
app.use('/api/auth/change-password', authMiddleware);

app.use('/api/products', productsRoutesFactory(db));
app.use('/api/orders', authMiddleware, ordersRoutesFactory(db));
app.use('/api/payments', authMiddleware, paymentsRoutesFactory(db));

app.use('/api/admin', authMiddleware, adminOnly, adminRoutesFactory(db));
app.use('/api/admin/products', authMiddleware, adminOnly, productsRoutesFactory(db));
app.use('/api/admin/orders', authMiddleware, adminOnly, ordersRoutesFactory(db));
app.use('/api/admin/analytics', authMiddleware, adminOnly, analyticsRoutesFactory(db));

/* Health check */
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Serve React build
app.use(express.static(path.join(__dirname, '..', 'build')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

/* Error handling middleware */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

/* Start server */
app.listen(PORT, () => {
  console.log(`\n🚀 Server listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);

  // Check email configuration
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Email credentials not configured. Email notifications will be skipped.');
      console.warn('⚠️  Set GMAIL_USER and GMAIL_APP_PASSWORD in .env file to enable email notifications.');
    }
  } else {
    console.log('✅ Email service configured (Gmail)');
    console.log(`📧 Admin notifications will be sent to: ${process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER}`);
  }

  // Check Cashfree configuration
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    console.warn('⚠️  Cashfree credentials not set. Online payment features will not work.');
  } else {
    console.log('✅ Cashfree payment gateway configured');
  }

  console.log('');
});
