const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendUPIPaymentEmail } = require('../utils/emailService');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/payment-proofs');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

module.exports = function (db) {
  // Check and add payment_proof column if it doesn't exist
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

  const getOrderById = db.prepare('SELECT * FROM orders WHERE id = ?');
  const getOrderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const updateOrderPaymentProof = db.prepare('UPDATE orders SET payment_proof = ?, payment_status = ? WHERE id = ?');
  const getUserById = db.prepare('SELECT id, name, email FROM users WHERE id = ?');

  // POST confirm UPI payment with screenshot
  router.post('/confirm-upi', upload.single('paymentProof'), async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone } = req.body;
      
      if (!orderId || !req.file) {
        return res.status(400).json({ message: 'Order ID and payment proof are required' });
      }

      // Verify order belongs to user
      const order = getOrderById.get(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.user_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized to update this order' });
      }

      // Check if order payment method is UPI
      if (order.payment_method !== 'upi') {
        return res.status(400).json({ message: 'This order is not a UPI payment' });
      }

      // Save payment proof filename to database
      const paymentProofPath = req.file.filename;
      updateOrderPaymentProof.run(paymentProofPath, 'pending_verification', orderId);

      // Get order items for email
      const orderItems = getOrderItems.all(orderId);
      const customer = getUserById.get(userId);

      // Send email with payment proof
      try {
        await sendUPIPaymentEmail({
          order: {
            ...order,
            order_number: orderNumber,
            total_amount: parseFloat(totalAmount) || order.total_amount,
            payment_proof: paymentProofPath
          },
          customer: customer || { 
            name: customerName, 
            email: customerEmail 
          },
          items: orderItems,
          paymentProofPath: req.file.path,
          phone: customerPhone
        });
      } catch (emailError) {
        console.error('Failed to send UPI payment email:', emailError);
        // Don't fail the request if email fails
      }

      return res.json({
        success: true,
        message: 'Payment proof uploaded successfully. Your order will be confirmed after verification.',
        orderId: orderId
      });

    } catch (err) {
      console.error('UPI payment confirmation error:', err);
      return res.status(500).json({ message: 'Failed to confirm payment' });
    }
  });

  // POST verify payment status (for manual verification by admin)
  router.post('/verify-payment', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ message: 'orderId is required' });
      }

      const order = getOrderById.get(orderId);
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
    } catch (err) {
      console.error('Payment verification error:', err);
      return res.status(500).json({ message: 'Payment verification failed' });
    }
  });

  // GET payment status for an order
  router.get('/status/:orderId', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { orderId } = req.params;
      const order = getOrderById.get(orderId);
      
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
    } catch (err) {
      console.error('Get payment status error:', err);
      return res.status(500).json({ message: 'Failed to get payment status' });
    }
  });

  return router;
};