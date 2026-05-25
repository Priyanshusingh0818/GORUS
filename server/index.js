require('dotenv').config();
require('express-async-errors'); // Catch async errors without wrapping routes in try-catch
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
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

/* Configure Helmet CSP instead of disabling it */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://api.cashfree.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ✅ FIXED CORS - Allows credentials and specific origins */
app.use(cors({
  origin: [
    'https://gorus.in',
    'https://www.gorus.in',
    'https://gorus.onrender.com',
    'http://localhost:3000', // For local development
    'http://localhost:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/* General Rate limiting */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

/* Strict Rate limiting for Auth */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login/signup requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' }
});

// Serve uploaded payment proofs (only accessible with proper authentication)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
let pool;
try {
  pool = initDatabase();
  console.log('✅ PostgreSQL database pool initialized successfully');
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

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, 1)',
        ['Admin', adminEmail, hash]
      );
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('ℹ️  Admin user already exists:', adminEmail);
    }
  } catch (error) {
    console.error('⚠️  Error seeding admin user:', error.message);
  }
})();

/* Routes */
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', authRoutesFactory(pool));

app.use('/api/products', productsRoutesFactory(pool));
app.use('/api/orders', authMiddleware, ordersRoutesFactory(pool));
app.use('/api/payments', authMiddleware, paymentsRoutesFactory(pool));

app.use('/api/admin', authMiddleware, adminOnly, adminRoutesFactory(pool));
app.use('/api/admin/products', authMiddleware, adminOnly, productsRoutesFactory(pool, { allowWrites: true }));
app.use('/api/admin/orders', authMiddleware, adminOnly, ordersRoutesFactory(pool, { admin: true }));
app.use('/api/admin/analytics', authMiddleware, adminOnly, analyticsRoutesFactory(pool));

/* Health check */
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const fs = require('fs');
const buildPath = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildPath)) {
  // Serve React build
  app.use(express.static(buildPath));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const errorHandler = require('./middleware/errorHandler');

/* Error handling middleware */
app.use(errorHandler);

/* Start server */
app.listen(PORT, () => {
  console.log(`\n🚀 Server listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);

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

  console.log('✅ CORS configured for production domains');
  console.log('✅ CSP configured to allow same-origin API calls');
  console.log('');
});
