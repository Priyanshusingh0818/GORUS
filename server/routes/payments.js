const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendUPIPaymentEmail } = require('../utils/emailService');
const { PREMIUM_UNAVAILABLE_MESSAGE, validateDeliveryArea } = require('../services/deliveryService');

const { createClient } = require('@supabase/supabase-js');

let supabase;

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    const error = new Error('Payment proof storage is not configured');
    error.statusCode = 503;
    throw error;
  }

  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  return supabase;
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

module.exports = function (pool) {
  // POST confirm UPI payment with screenshot
  router.post('/confirm-upi', upload.single('paymentProof'), async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone } = req.body;
    
    if (!orderId || !req.file) {
      return res.status(400).json({ message: 'Order ID and payment proof are required' });
    }

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this order' });
    }

    if (order.payment_method !== 'upi') {
      return res.status(400).json({ message: 'This order is not a UPI payment' });
    }

    const availability = await validateDeliveryArea(pool, {
      pincode: order.shipping_pincode,
      address: order.shipping_address
    });

    if (!availability.allowed) {
      return res.status(422).json({
        code: 'DELIVERY_AREA_UNAVAILABLE',
        message: availability.message || PREMIUM_UNAVAILABLE_MESSAGE,
        availability
      });
    }

    const supabaseClient = getSupabaseClient();

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'payment-' + uniqueSuffix + path.extname(req.file.originalname);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('payment-proofs')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload payment proof to cloud storage' });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('payment-proofs')
      .getPublicUrl(filename);

    await pool.query('UPDATE orders SET payment_proof = $1, payment_status = $2 WHERE id = $3', [publicUrl, 'pending_verification', orderId]);

    const { rows: orderItems } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    const { rows: userRows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    const customer = userRows[0];

    // Send email asynchronously so it doesn't block the API response
    // (Render free tier can sometimes silently block SMTP causing Nodemailer to hang)
    sendUPIPaymentEmail({
      order: {
        ...order,
        order_number: orderNumber,
        total_amount: parseFloat(totalAmount) || order.total_amount,
        payment_proof: publicUrl
      },
      customer: customer || { 
        name: customerName, 
        email: customerEmail 
      },
      items: orderItems,
      paymentProofPath: publicUrl,
      phone: customerPhone
    }).catch(emailError => {
      console.error('Failed to send UPI payment email in background:', emailError);
    });

    return res.json({
      success: true,
      message: 'Payment proof uploaded successfully. Your order will be confirmed after verification.',
      orderId: orderId
    });
  });

  // POST verify payment status
  router.post('/verify-payment', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    return res.json({ 
      success: true, 
      order: {
        id: order.id,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        status: order.status
      }
    });
  });

  // GET payment status for an order
  router.get('/status/:orderId', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRows[0];
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    return res.json({
      orderId: order.id,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      orderStatus: order.status
    });
  });

  return router;
};
