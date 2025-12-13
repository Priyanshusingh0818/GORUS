const express = require('express');
const router = express.Router();
const { sendOrderNotificationEmail } = require('../utils/emailService');

module.exports = function (db) {
  // First, let's check if upi_id column exists and add it if not
  try {
    db.prepare('SELECT upi_id FROM orders LIMIT 1').get();
    console.log('✅ upi_id column exists');
  } catch (e) {
    try {
      db.prepare('ALTER TABLE orders ADD COLUMN upi_id TEXT').run();
      console.log('✅ Added upi_id column to orders table');
    } catch (err) {
      console.error('❌ Could not add upi_id column:', err.message);
    }
  }

  const createOrder = db.prepare(
    'INSERT INTO orders (user_id, order_number, total_amount, shipping_name, shipping_address, shipping_phone, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const createOrderItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const getUserOrders = db.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  );
  const getAllOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
  const getOrderById = db.prepare('SELECT * FROM orders WHERE id = ?');
  const getOrderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const updateOrderStatus = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
  const updateOrderPayment = db.prepare('UPDATE orders SET payment_id = ?, payment_status = ? WHERE id = ?');
  const getProductById = db.prepare('SELECT * FROM products WHERE id = ?');
  const updateProductStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  const restoreProductStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
  const getUserById = db.prepare('SELECT id, name, email FROM users WHERE id = ?');

  // Generate unique order number
  function generateOrderNumber() {
    return 'GOR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // POST create order (requires auth)
  router.post('/', (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { items, shipping, totalAmount, paymentMethod = 'cod' } = req.body;

      if (!userId || !items || !Array.isArray(items) || items.length === 0 || !shipping || !totalAmount) {
        return res.status(400).json({ message: 'Invalid order data' });
      }

      // Validate payment method
      if (!['upi', 'cod'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Invalid payment method. Only UPI and COD are allowed.' });
      }

      // Check stock availability before creating order
      for (const item of items) {
        const product = getProductById.get(item.id);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.name} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
          });
        }
        if (product.available !== 1) {
          return res.status(400).json({ message: `Product ${item.name} is not available` });
        }
      }

      const orderNumber = generateOrderNumber();
      
      // Set payment status based on payment method
      const paymentStatus = paymentMethod === 'cod' ? 'cod' : 'pending';
      
      const transaction = db.transaction(() => {
        const orderInfo = createOrder.run(
          userId,
          orderNumber,
          totalAmount,
          shipping.name,
          shipping.address,
          shipping.phone,
          paymentMethod,
          paymentStatus,
          'pending'
        );

        const orderId = orderInfo.lastInsertRowid;

        // Create order items and reduce stock
        items.forEach(item => {
          createOrderItem.run(
            orderId,
            item.id,
            item.name,
            item.price,
            item.quantity,
            item.price * item.quantity
          );
          // Reduce stock
          updateProductStock.run(item.quantity, item.id);
        });

        return { orderId };
      });

      const { orderId } = transaction();

      const order = getOrderById.get(orderId);
      const orderItems = getOrderItems.all(orderId);

      // Get customer information
      const customer = getUserById.get(userId);

      // Send email notification to admin (non-blocking)
      sendOrderNotificationEmail({
        order,
        customer: customer || { name: shipping.name, email: req.user?.email || 'N/A' },
        items: orderItems
      }).catch(err => {
        // Log error but don't fail the order creation
        console.error('Failed to send order notification email:', err);
      });

      return res.status(201).json({
        order: {
          ...order,
          items: orderItems
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // GET user orders (requires auth - user can only see their own orders)
  router.get('/my-orders', (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const orders = getUserOrders.all(userId);
      const ordersWithItems = orders.map(order => {
        const items = getOrderItems.all(order.id);
        return { ...order, items };
      });
      return res.json({ orders: ordersWithItems });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // GET all orders (admin only)
  router.get('/', (req, res) => {
    try {
      const orders = getAllOrders.all();
      const ordersWithItems = orders.map(order => {
        const items = getOrderItems.all(order.id);
        return { ...order, items };
      });
      return res.json({ orders: ordersWithItems });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // GET order by id
  router.get('/:id', (req, res) => {
    try {
      const order = getOrderById.get(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      const items = getOrderItems.all(order.id);
      return res.json({ order: { ...order, items } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // PUT update order status (admin only)
  router.put('/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      const orderId = req.params.id;

      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const order = getOrderById.get(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // If cancelling, restore stock
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const items = getOrderItems.all(orderId);
        items.forEach(item => {
          restoreProductStock.run(item.quantity, item.product_id);
        });
      }

      updateOrderStatus.run(status, orderId);
      const updatedOrder = getOrderById.get(orderId);
      const items = getOrderItems.all(orderId);

      return res.json({ order: { ...updatedOrder, items } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // PUT update payment status (admin only - to mark UPI payment as paid)
  router.put('/:id/payment-status', (req, res) => {
    try {
      const { paymentStatus, paymentId } = req.body;
      const orderId = req.params.id;

      if (!['pending', 'paid', 'failed', 'cod'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }

      const order = getOrderById.get(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      updateOrderPayment.run(paymentId || null, paymentStatus, orderId);
      
      // If payment is marked as paid, update order status to processing
      if (paymentStatus === 'paid' && order.status === 'pending') {
        updateOrderStatus.run('processing', orderId);
      }

      const updatedOrder = getOrderById.get(orderId);
      const items = getOrderItems.all(orderId);

      return res.json({ order: { ...updatedOrder, items } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // PUT cancel order (user can cancel their own pending orders)
  router.put('/:id/cancel', (req, res) => {
    try {
      const userId = req.user?.id;
      const orderId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const order = getOrderById.get(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // User can only cancel their own orders
      if (order.user_id !== userId) {
        return res.status(403).json({ message: 'You can only cancel your own orders' });
      }

      // Can only cancel pending orders
      if (order.status !== 'pending') {
        return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
      }

      // Restore stock and cancel order
      const items = getOrderItems.all(orderId);
      items.forEach(item => {
        restoreProductStock.run(item.quantity, item.product_id);
      });

      updateOrderStatus.run('cancelled', orderId);
      const cancelledOrder = getOrderById.get(orderId);
      const orderItems = getOrderItems.all(orderId);

      return res.json({ order: { ...cancelledOrder, items: orderItems } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};