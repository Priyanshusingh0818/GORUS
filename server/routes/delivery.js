const express = require('express');
const {
  ensureDeliveryTables,
  getAllowedPincodes,
  recordUnsupportedRequest,
  validateDeliveryArea
} = require('../services/deliveryService');

module.exports = function deliveryRoutesFactory(pool, options = {}) {
  const router = express.Router();
  const isAdmin = options.admin === true;
  let ready;

  router.use(async (req, res, next) => {
    if (!ready) ready = ensureDeliveryTables(pool);
    await ready;
    next();
  });

  if (!isAdmin) {
    router.get('/availability', async (req, res) => {
      const availability = await validateDeliveryArea(pool, {
        pincode: req.query.pincode,
        address: req.query.address
      });
      res.json({ availability });
    });

    router.post('/notify', async (req, res) => {
      const result = await recordUnsupportedRequest(pool, {
        ...req.body,
        source: req.body.source || 'website'
      });

      res.status(201).json({
        success: true,
        alreadyAvailable: result.alreadyAvailable,
        request: result.request,
        availability: result.availability,
        message: result.alreadyAvailable
          ? result.availability.message
          : "Thanks. We'll let you know when GORUS delivery opens in your area."
      });
    });
  }

  if (isAdmin) {
    router.get('/pincodes', async (req, res) => {
      const pincodes = await getAllowedPincodes(pool);
      res.json({ pincodes });
    });

    router.get('/requests', async (req, res) => {
      const { q = '', pincode = '' } = req.query;
      const values = [];
      const conditions = [];

      if (q) {
        values.push(`%${String(q).toLowerCase()}%`);
        conditions.push(`(LOWER(COALESCE(name, '')) LIKE $${values.length} OR LOWER(COALESCE(email, '')) LIKE $${values.length} OR LOWER(COALESCE(phone, '')) LIKE $${values.length})`);
      }

      if (pincode) {
        values.push(String(pincode).replace(/\D/g, '').slice(0, 6));
        conditions.push(`pincode = $${values.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows: requests } = await pool.query(`
        SELECT *
        FROM unsupported_delivery_requests
        ${where}
        ORDER BY created_at DESC
        LIMIT 500
      `, values);

      const { rows: summary } = await pool.query(`
        SELECT pincode, COUNT(*)::int AS request_count, MAX(created_at) AS latest_request
        FROM unsupported_delivery_requests
        GROUP BY pincode
        ORDER BY request_count DESC, latest_request DESC
      `);

      res.json({ requests, summary });
    });
  }

  return router;
};
