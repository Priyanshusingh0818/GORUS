const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('../utils/emailService');
const { PREMIUM_UNAVAILABLE_MESSAGE, validateDeliveryArea } = require('../services/deliveryService');

const SUBSCRIPTION_PRICE_PER_LITRE = 55;
const ADVANCE_DAYS = 10;
const PLAN_MONTHS = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  '1_year': 12
};
const PLAN_LABELS = {
  '1_month': '1 Month',
  '3_months': '3 Months',
  '6_months': '6 Months',
  '1_year': '1 Year'
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

let supabase;

function dateOnly(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function parseDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value, days) {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
}

function addMonths(value, months) {
  const date = parseDateOnly(value);
  const originalDay = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + months);
  if (date.getUTCDate() < originalDay) {
    date.setUTCDate(0);
  }
  return dateOnly(date);
}

function daysRemaining(expiryDate, fromDate = dateOnly()) {
  const diff = parseDateOnly(expiryDate) - parseDateOnly(fromDate);
  return Math.max(0, Math.floor(diff / 86400000) + 1);
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  return Math.round(numberValue(value) * 100) / 100;
}

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return null;
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

async function uploadPaymentProof(file) {
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `subscription-payment-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const supabaseClient = getSupabaseClient();

  if (supabaseClient) {
    const { error } = await supabaseClient.storage
      .from('payment-proofs')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;
    const { data: { publicUrl } } = supabaseClient.storage
      .from('payment-proofs')
      .getPublicUrl(filename);
    return publicUrl;
  }

  const uploadDir = path.join(__dirname, '..', 'uploads', 'subscription-payments');
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return `/uploads/subscription-payments/${filename}`;
}

async function sendSubscriptionEmail({ to, subject, intro, rows = [], actionLabel = null }) {
  if (!to) return { success: false, skipped: true };

  const rowHtml = rows.map(({ label, value }) => `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-weight:700;text-align:right;">${value}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8faf7;padding:28px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7df;border-radius:14px;overflow:hidden;">
        <div style="background:#0f3d2e;color:#fff;padding:26px 30px;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#b7f5d2;">GORUS Milk Subscription</p>
          <h1 style="margin:0;font-size:26px;line-height:1.25;">${subject}</h1>
        </div>
        <div style="padding:28px 30px;">
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">${intro}</p>
          <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7df;border-bottom:1px solid #e5e7df;">
            ${rowHtml}
          </table>
          ${actionLabel ? `<p style="margin:22px 0 0;color:#0f3d2e;font-weight:700;">${actionLabel}</p>` : ''}
          <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">This is an automated GORUS notification. Your subscription is billed only for delivered days.</p>
        </div>
      </div>
    </div>
  `;

  const textContent = `${subject}\n\n${intro}\n\n${rows.map(row => `${row.label}: ${row.value}`).join('\n')}`;

  try {
    return await sendEmail({ to, subject, htmlContent, textContent });
  } catch (error) {
    console.warn('Subscription email skipped:', error.message);
    return { success: false, skipped: true, error: error.message };
  }
}

function publicSubscription(row) {
  if (!row) return null;
  const remainingDays = daysRemaining(dateOnly(row.expiry_date));
  return {
    ...row,
    litres_per_day: numberValue(row.litres_per_day),
    price_per_litre: numberValue(row.price_per_litre),
    advance_paid: numberValue(row.advance_paid),
    advance_remaining: numberValue(row.advance_remaining),
    remaining_days: remainingDays
  };
}

module.exports = function subscriptionsRoutesFactory(pool, options = {}) {
  const router = express.Router();
  const isAdmin = options.admin === true;
  let tableReady;

  async function ensureTables() {
    if (tableReady) return tableReady;

    tableReady = (async () => {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);');

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

      await pool.query('CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);');
      await pool.query('ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(6);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_subscription_delivery_date ON subscription_delivery_logs(subscription_id, delivery_date);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);');
    })();

    return tableReady;
  }

  router.use(async (req, res, next) => {
    await ensureTables();
    next();
  });

  async function getSubscriptionForUser(subscriptionId, userId) {
    const params = isAdmin ? [subscriptionId] : [subscriptionId, userId];
    const where = isAdmin ? 's.id = $1' : 's.id = $1 AND s.user_id = $2';
    const { rows } = await pool.query(`
      SELECT s.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE ${where}
    `, params);
    return rows[0];
  }

  if (!isAdmin) {
    router.post('/', async (req, res) => {
      const userId = req.user?.id;
      const {
        milkType = 'Fresh Cow Milk',
        litresPerDay,
        duration = '1_month',
        startDate,
        deliveryAddress = '',
        deliveryPhone = '',
        deliveryPincode = ''
      } = req.body;

      const litres = numberValue(litresPerDay);
      const durationMonths = PLAN_MONTHS[duration];

      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      if (!durationMonths) return res.status(400).json({ message: 'Select a valid subscription duration' });
      if (!litres || litres < 0.5 || litres > 20) {
        return res.status(400).json({ message: 'Litres per day must be between 0.5 and 20' });
      }

      const availability = await validateDeliveryArea(pool, {
        pincode: deliveryPincode,
        address: deliveryAddress
      });

      if (!availability.allowed) {
        return res.status(422).json({
          code: 'DELIVERY_AREA_UNAVAILABLE',
          message: availability.message || PREMIUM_UNAVAILABLE_MESSAGE,
          availability
        });
      }

      const start = startDate || dateOnly();
      const expiry = addDays(addMonths(start, durationMonths), -1);
      const advanceAmount = money(litres * SUBSCRIPTION_PRICE_PER_LITRE * ADVANCE_DAYS);

      const { rows } = await pool.query(`
        INSERT INTO subscriptions (
          user_id, milk_type, litres_per_day, duration_months, plan_label,
          price_per_litre, advance_days, advance_paid, advance_remaining,
          start_date, expiry_date, status, payment_status, payment_method,
          delivery_address, delivery_phone, delivery_pincode
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,'pending_payment','pending','upi',$11,$12,$13)
        RETURNING *
      `, [
        userId,
        milkType,
        litres,
        durationMonths,
        PLAN_LABELS[duration],
        SUBSCRIPTION_PRICE_PER_LITRE,
        ADVANCE_DAYS,
        advanceAmount,
        start,
        expiry,
        deliveryAddress,
        deliveryPhone,
        availability.pincode
      ]);

      const subscription = rows[0];
      await pool.query(`
        INSERT INTO subscription_payments (subscription_id, amount, payment_status, payment_type)
        VALUES ($1, $2, 'pending', 'advance')
      `, [subscription.id, advanceAmount]);

      res.status(201).json({
        success: true,
        subscription: publicSubscription(subscription),
        payment: {
          method: 'upi',
          amount: advanceAmount,
          note: 'Advance covers 10 delivered days and is adjusted against future bills.'
        }
      });
    });

    router.post('/:id/confirm-payment', upload.single('paymentProof'), async (req, res) => {
      const userId = req.user?.id;
      const subscription = await getSubscriptionForUser(req.params.id, userId);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      if (!req.file) return res.status(400).json({ message: 'Payment proof image is required' });

      const availability = await validateDeliveryArea(pool, {
        pincode: subscription.delivery_pincode,
        address: subscription.delivery_address
      });
      if (!availability.allowed) {
        return res.status(422).json({
          code: 'DELIVERY_AREA_UNAVAILABLE',
          message: availability.message || PREMIUM_UNAVAILABLE_MESSAGE,
          availability
        });
      }

      const proofUrl = await uploadPaymentProof(req.file);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const { rows } = await client.query(`
          UPDATE subscriptions
          SET payment_proof = $1,
              payment_status = 'pending_verification',
              status = 'active',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [proofUrl, subscription.id]);
        await client.query(`
          UPDATE subscription_payments
          SET payment_proof = $1, payment_status = 'pending_verification'
          WHERE subscription_id = $2 AND payment_type = 'advance'
        `, [proofUrl, subscription.id]);
        await client.query('COMMIT');

        sendSubscriptionEmail({
          to: subscription.user_email,
          subject: 'Milk subscription activated',
          intro: 'Your GORUS milk subscription is active. We will bill only for days we actually deliver milk.',
          rows: [
            { label: 'Milk', value: subscription.milk_type },
            { label: 'Daily quantity', value: `${numberValue(subscription.litres_per_day)} litre/day` },
            { label: 'Subscription price', value: `Rs ${SUBSCRIPTION_PRICE_PER_LITRE}/litre` },
            { label: 'Advance paid', value: `Rs ${money(subscription.advance_paid)}` },
            { label: 'Start date', value: dateOnly(subscription.start_date) },
            { label: 'Expiry date', value: dateOnly(subscription.expiry_date) }
          ]
        });

        sendSubscriptionEmail({
          to: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL,
          subject: 'New milk subscription payment',
          intro: `${subscription.user_name || subscription.user_email} uploaded a UPI proof for a new milk subscription.`,
          rows: [
            { label: 'Customer', value: subscription.user_email },
            { label: 'Milk', value: subscription.milk_type },
            { label: 'Quantity', value: `${numberValue(subscription.litres_per_day)} litre/day` },
            { label: 'Advance', value: `Rs ${money(subscription.advance_paid)}` }
          ],
          actionLabel: 'Please verify the UPI proof in payment records.'
        });

        res.json({
          success: true,
          message: 'Payment proof uploaded. Subscription is active and pending admin verification.',
          subscription: publicSubscription(rows[0])
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    router.get('/my', async (req, res) => {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { rows: subscriptions } = await pool.query(`
        SELECT s.*,
          COALESCE((SELECT COUNT(*) FROM subscription_delivery_logs d WHERE d.subscription_id = s.id AND d.delivered = 1 AND date_trunc('month', d.delivery_date) = date_trunc('month', CURRENT_DATE)), 0) AS delivered_days_month,
          COALESCE((SELECT SUM(d.amount) FROM subscription_delivery_logs d WHERE d.subscription_id = s.id AND d.delivered = 1 AND date_trunc('month', d.delivery_date) = date_trunc('month', CURRENT_DATE)), 0) AS month_gross
        FROM subscriptions s
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
      `, [userId]);

      const ids = subscriptions.map(row => row.id);
      let deliveryHistory = [];
      let invoices = [];
      if (ids.length) {
        const { rows: deliveryRows } = await pool.query(`
          SELECT * FROM subscription_delivery_logs
          WHERE subscription_id = ANY($1::int[])
          ORDER BY delivery_date DESC
          LIMIT 40
        `, [ids]);
        deliveryHistory = deliveryRows;

        const { rows: invoiceRows } = await pool.query(`
          SELECT * FROM subscription_invoices
          WHERE subscription_id = ANY($1::int[])
          ORDER BY period_start DESC
          LIMIT 20
        `, [ids]);
        invoices = invoiceRows;
      }

      res.json({
        subscriptions: subscriptions.map(publicSubscription),
        activeSubscription: publicSubscription(subscriptions.find(row => ['active', 'paused', 'pending_payment'].includes(row.status))),
        deliveryHistory,
        invoices
      });
    });

    router.get('/:id/delivery-history', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id, req.user.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      const { rows } = await pool.query(`
        SELECT * FROM subscription_delivery_logs
        WHERE subscription_id = $1
        ORDER BY delivery_date DESC
        LIMIT 120
      `, [subscription.id]);
      res.json({ history: rows });
    });

    router.post('/:id/pause', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id, req.user.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      if (subscription.status !== 'active') return res.status(400).json({ message: 'Only active subscriptions can be paused' });

      const pauseStart = req.body.pauseStart || dateOnly();
      const reason = req.body.reason || null;
      const { rows } = await pool.query(`
        UPDATE subscriptions
        SET status = 'paused', pause_started_on = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [pauseStart, subscription.id]);
      await pool.query(`
        INSERT INTO subscription_pauses (subscription_id, pause_start, reason)
        VALUES ($1, $2, $3)
      `, [subscription.id, pauseStart, reason]);

      res.json({ success: true, subscription: publicSubscription(rows[0]) });
    });

    router.post('/:id/resume', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id, req.user.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      if (subscription.status !== 'paused') return res.status(400).json({ message: 'Only paused subscriptions can be resumed' });

      const resumeDate = req.body.resumeDate || dateOnly();
      const pauseStart = subscription.pause_started_on ? dateOnly(subscription.pause_started_on) : resumeDate;
      const pausedDays = Math.max(1, Math.floor((parseDateOnly(resumeDate) - parseDateOnly(pauseStart)) / 86400000));
      const newExpiry = addDays(dateOnly(subscription.expiry_date), pausedDays);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(`
          UPDATE subscriptions
          SET status = 'active', pause_started_on = NULL, expiry_date = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [newExpiry, subscription.id]);
        await client.query(`
          UPDATE subscription_pauses
          SET pause_end = $1, days_extended = $2
          WHERE id = (
            SELECT id FROM subscription_pauses
            WHERE subscription_id = $3 AND pause_end IS NULL
            ORDER BY created_at DESC
            LIMIT 1
          )
        `, [resumeDate, pausedDays, subscription.id]);
        await client.query('COMMIT');
        res.json({ success: true, subscription: publicSubscription(rows[0]) });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    router.post('/:id/cancel', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id, req.user.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

      const { rows: dueRows } = await pool.query(`
        SELECT COALESCE(SUM(amount_due), 0) AS dues
        FROM subscription_invoices
        WHERE subscription_id = $1 AND status <> 'paid'
      `, [subscription.id]);
      const dues = numberValue(dueRows[0]?.dues);
      if (dues > 0) {
        return res.status(409).json({ message: `Please clear pending dues of Rs ${money(dues)} before cancellation` });
      }

      const { rows } = await pool.query(`
        UPDATE subscriptions
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [subscription.id]);

      sendSubscriptionEmail({
        to: subscription.user_email,
        subject: 'Milk subscription cancelled',
        intro: 'Your GORUS milk subscription has been cancelled. There are no pending dues on this subscription.',
        rows: [
          { label: 'Subscription', value: `#${subscription.id}` },
          { label: 'Milk', value: subscription.milk_type }
        ]
      });

      res.json({ success: true, subscription: publicSubscription(rows[0]) });
    });

    router.post('/:id/renew', async (req, res) => {
      const oldSubscription = await getSubscriptionForUser(req.params.id, req.user.id);
      if (!oldSubscription) return res.status(404).json({ message: 'Subscription not found' });

      const durationKey = req.body.duration || (
        oldSubscription.duration_months === 12 ? '1_year' :
        oldSubscription.duration_months === 6 ? '6_months' :
        oldSubscription.duration_months === 3 ? '3_months' : '1_month'
      );
      const durationMonths = PLAN_MONTHS[durationKey];
      const start = addDays(dateOnly(oldSubscription.expiry_date), 1);
      const expiry = addDays(addMonths(start, durationMonths), -1);
      const advanceAmount = money(numberValue(oldSubscription.litres_per_day) * SUBSCRIPTION_PRICE_PER_LITRE * ADVANCE_DAYS);

      const { rows } = await pool.query(`
        INSERT INTO subscriptions (
          user_id, milk_type, litres_per_day, duration_months, plan_label,
          price_per_litre, advance_days, advance_paid, advance_remaining,
          start_date, expiry_date, status, payment_status, payment_method,
          delivery_address, delivery_phone, delivery_pincode
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,'pending_payment','pending','upi',$11,$12,$13)
        RETURNING *
      `, [
        oldSubscription.user_id,
        oldSubscription.milk_type,
        oldSubscription.litres_per_day,
        durationMonths,
        PLAN_LABELS[durationKey],
        SUBSCRIPTION_PRICE_PER_LITRE,
        ADVANCE_DAYS,
        advanceAmount,
        start,
        expiry,
        oldSubscription.delivery_address,
        oldSubscription.delivery_phone,
        oldSubscription.delivery_pincode
      ]);

      res.status(201).json({
        success: true,
        subscription: publicSubscription(rows[0]),
        payment: { method: 'upi', amount: advanceAmount }
      });
    });
  }

  if (isAdmin) {
    router.get('/', async (req, res) => {
      const { q = '', status = '', sort = 'expiry_asc' } = req.query;
      const values = [];
      const conditions = [];

      if (q) {
        values.push(`%${q.toLowerCase()}%`);
        conditions.push(`(LOWER(u.name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length} OR LOWER(s.milk_type) LIKE $${values.length})`);
      }
      if (status) {
        values.push(status);
        conditions.push(`s.status = $${values.length}`);
      }

      const orderBy = {
        expiry_asc: 's.expiry_date ASC',
        newest: 's.created_at DESC',
        litres_desc: 's.litres_per_day DESC',
        status: 's.status ASC, s.expiry_date ASC'
      }[sort] || 's.expiry_date ASC';

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows: subscriptions } = await pool.query(`
        SELECT s.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
          COALESCE((SELECT COUNT(*) FROM subscription_delivery_logs d WHERE d.subscription_id = s.id AND d.delivered = 1 AND date_trunc('month', d.delivery_date) = date_trunc('month', CURRENT_DATE)), 0) AS delivered_days_month,
          COALESCE((SELECT SUM(amount_due) FROM subscription_invoices i WHERE i.subscription_id = s.id AND i.status <> 'paid'), 0) AS pending_dues
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        ${where}
        ORDER BY ${orderBy}
      `, values);

      const { rows: statRows } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') AS active_subscribers,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days') AS expiring_soon,
          (SELECT COALESCE(SUM(amount_due), 0) FROM subscription_invoices WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) AS monthly_revenue,
          (SELECT COALESCE(SUM(litres), 0) FROM subscription_delivery_logs WHERE delivery_date = CURRENT_DATE AND delivered = 1) AS delivered_litres_today,
          (SELECT COALESCE(SUM(amount_due), 0) FROM subscription_invoices WHERE status <> 'paid') AS pending_payments
      `);

      res.json({
        subscriptions: subscriptions.map(publicSubscription),
        stats: {
          activeSubscribers: numberValue(statRows[0]?.active_subscribers),
          expiringSoon: numberValue(statRows[0]?.expiring_soon),
          monthlyRevenue: money(statRows[0]?.monthly_revenue),
          deliveredLitresToday: numberValue(statRows[0]?.delivered_litres_today),
          pendingPayments: money(statRows[0]?.pending_payments)
        }
      });
    });

    router.put('/:id', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

      if (req.body.delivery_pincode !== undefined || req.body.delivery_address !== undefined) {
        const availability = await validateDeliveryArea(pool, {
          pincode: req.body.delivery_pincode !== undefined ? req.body.delivery_pincode : subscription.delivery_pincode,
          address: req.body.delivery_address !== undefined ? req.body.delivery_address : subscription.delivery_address
        });
        if (!availability.allowed) {
          return res.status(422).json({
            code: 'DELIVERY_AREA_UNAVAILABLE',
            message: availability.message || PREMIUM_UNAVAILABLE_MESSAGE,
            availability
          });
        }
        if (req.body.delivery_pincode !== undefined) {
          req.body.delivery_pincode = availability.pincode;
        }
      }

      const allowed = ['milk_type', 'litres_per_day', 'status', 'delivery_address', 'delivery_phone', 'delivery_pincode', 'payment_status'];
      const updates = [];
      const values = [];
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) {
          values.push(req.body[field]);
          updates.push(`${field} = $${values.length}`);
        }
      });

      if (!updates.length) return res.status(400).json({ message: 'No valid fields to update' });
      values.push(subscription.id);

      const { rows } = await pool.query(`
        UPDATE subscriptions
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING *
      `, values);

      res.json({ success: true, subscription: publicSubscription(rows[0]) });
    });

    router.delete('/:id', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      await pool.query('DELETE FROM subscriptions WHERE id = $1', [subscription.id]);
      res.json({ success: true });
    });

    router.put('/:id/delivery', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      if (!['active', 'paused'].includes(subscription.status)) {
        return res.status(400).json({ message: 'Delivery can be marked only for active or paused subscriptions' });
      }

      const deliveryDate = req.body.deliveryDate || dateOnly();
      const delivered = req.body.delivered ? 1 : 0;
      if (subscription.status === 'paused' && delivered) {
        return res.status(400).json({ message: 'Paused subscriptions cannot be marked delivered' });
      }
      const note = req.body.note || (delivered ? 'Delivered' : 'Skipped');
      const litres = delivered && subscription.status === 'active' ? numberValue(subscription.litres_per_day) : 0;
      const amount = money(litres * SUBSCRIPTION_PRICE_PER_LITRE);

      const { rows } = await pool.query(`
        INSERT INTO subscription_delivery_logs (subscription_id, delivery_date, delivered, litres, price_per_litre, amount, note, marked_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (subscription_id, delivery_date)
        DO UPDATE SET delivered = EXCLUDED.delivered,
          litres = EXCLUDED.litres,
          price_per_litre = EXCLUDED.price_per_litre,
          amount = EXCLUDED.amount,
          note = EXCLUDED.note,
          marked_by = EXCLUDED.marked_by
        RETURNING *
      `, [subscription.id, deliveryDate, delivered, litres, SUBSCRIPTION_PRICE_PER_LITRE, amount, note, req.user.id]);

      res.json({ success: true, delivery: rows[0] });
    });

    router.get('/:id/billing-history', async (req, res) => {
      const subscription = await getSubscriptionForUser(req.params.id);
      if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
      const { rows: invoices } = await pool.query(`
        SELECT * FROM subscription_invoices
        WHERE subscription_id = $1
        ORDER BY period_start DESC
      `, [subscription.id]);
      const { rows: payments } = await pool.query(`
        SELECT * FROM subscription_payments
        WHERE subscription_id = $1
        ORDER BY created_at DESC
      `, [subscription.id]);
      res.json({ invoices, payments });
    });

    router.post('/generate-invoices', async (req, res) => {
      const today = dateOnly();
      const invoiceMonth = req.body.invoiceMonth || today.slice(0, 7);
      const periodStart = `${invoiceMonth}-01`;
      const periodEndDate = new Date(Date.UTC(Number(invoiceMonth.slice(0, 4)), Number(invoiceMonth.slice(5, 7)), 0));
      const periodEnd = dateOnly(periodEndDate);

      const { rows: subscriptions } = await pool.query(`
        SELECT s.*, u.email AS user_email, u.name AS user_name
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        WHERE s.status IN ('active', 'paused', 'expired', 'cancelled')
      `);

      const created = [];
      for (const subscription of subscriptions) {
        const { rows: totals } = await pool.query(`
          SELECT
            COALESCE(COUNT(*) FILTER (WHERE delivered = 1), 0) AS delivered_days,
            COALESCE(SUM(litres) FILTER (WHERE delivered = 1), 0) AS delivered_litres,
            COALESCE(SUM(amount) FILTER (WHERE delivered = 1), 0) AS gross_amount
          FROM subscription_delivery_logs
          WHERE subscription_id = $1 AND delivery_date BETWEEN $2 AND $3
        `, [subscription.id, periodStart, periodEnd]);

        const grossAmount = money(totals[0]?.gross_amount);
        if (grossAmount <= 0) continue;
        const advanceAdjusted = Math.min(money(subscription.advance_remaining), grossAmount);
        const amountDue = money(grossAmount - advanceAdjusted);

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const { rows: invoiceRows } = await client.query(`
            INSERT INTO subscription_invoices (
              subscription_id, invoice_month, period_start, period_end,
              delivered_days, delivered_litres, gross_amount,
              advance_adjusted, amount_due, status, sent_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)
            ON CONFLICT (subscription_id, invoice_month)
            DO UPDATE SET delivered_days = EXCLUDED.delivered_days,
              delivered_litres = EXCLUDED.delivered_litres,
              gross_amount = EXCLUDED.gross_amount,
              advance_adjusted = EXCLUDED.advance_adjusted,
              amount_due = EXCLUDED.amount_due,
              status = EXCLUDED.status,
              sent_at = CURRENT_TIMESTAMP
            RETURNING *
          `, [
            subscription.id,
            invoiceMonth,
            periodStart,
            periodEnd,
            numberValue(totals[0]?.delivered_days),
            numberValue(totals[0]?.delivered_litres),
            grossAmount,
            advanceAdjusted,
            amountDue,
            amountDue === 0 ? 'paid' : 'pending'
          ]);
          await client.query(`
            UPDATE subscriptions
            SET advance_remaining = GREATEST(advance_remaining - $1, 0), updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [advanceAdjusted, subscription.id]);
          await client.query('COMMIT');

          const invoice = invoiceRows[0];
          created.push(invoice);
          sendSubscriptionEmail({
            to: subscription.user_email,
            subject: `Milk subscription invoice - ${invoiceMonth}`,
            intro: 'Your monthly GORUS milk invoice is ready. Billing includes only delivered days.',
            rows: [
              { label: 'Delivered days', value: invoice.delivered_days },
              { label: 'Delivered litres', value: `${numberValue(invoice.delivered_litres)} L` },
              { label: 'Gross amount', value: `Rs ${money(invoice.gross_amount)}` },
              { label: 'Advance adjusted', value: `Rs ${money(invoice.advance_adjusted)}` },
              { label: 'Amount due', value: `Rs ${money(invoice.amount_due)}` }
            ]
          });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      res.json({ success: true, invoices: created });
    });

    router.post('/send-renewal-reminders', async (req, res) => {
      const { rows } = await pool.query(`
        SELECT s.*, u.email AS user_email, u.name AS user_name
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        WHERE s.status = 'active'
          AND s.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
          AND s.renewal_reminder_sent_at IS NULL
      `);

      for (const subscription of rows) {
        sendSubscriptionEmail({
          to: subscription.user_email,
          subject: 'Your milk subscription is nearing expiry',
          intro: 'Your GORUS milk subscription expires soon. Renew to keep the discounted daily rate active.',
          rows: [
            { label: 'Expiry date', value: dateOnly(subscription.expiry_date) },
            { label: 'Remaining days', value: daysRemaining(dateOnly(subscription.expiry_date)) },
            { label: 'Daily quantity', value: `${numberValue(subscription.litres_per_day)} litre/day` }
          ],
          actionLabel: 'Renewal is available from your subscription dashboard.'
        });
        await pool.query('UPDATE subscriptions SET renewal_reminder_sent_at = CURRENT_TIMESTAMP WHERE id = $1', [subscription.id]);
      }

      res.json({ success: true, remindersSent: rows.length });
    });
  }

  return router;
};
