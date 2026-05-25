const express = require('express');
const router = express.Router();
const { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } = require('../utils/emailService');

module.exports = function (pool, options = {}) {
  const isAdminRoute = options.admin === true;

  // Generate unique order number
  function generateOrderNumber() {
    return 'GOR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // POST create order (requires auth)
  if (!isAdminRoute) router.post('/', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { items, shipping, paymentMethod = 'cod' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !shipping) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    if (!['upi', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method. Only UPI and COD are allowed.' });
    }

    const client = await pool.connect();
    let orderId;

    try {
      await client.query('BEGIN');

      // Check stock availability
      const orderItems = [];
      let calculatedTotal = 0;

      for (const item of items) {
        const productId = Number(item.id);
        const quantity = Number(item.quantity);

        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error('Invalid item data');
        }

        const { rows } = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
        const product = rows[0];
        
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }
        if (Number(product.stock) < quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
        }
        if (product.available !== 1 && product.available !== true && product.available !== '1') {
          throw new Error(`Product ${product.name} is not available`);
        }

        const productPrice = Number(product.price);
        const subtotal = productPrice * quantity;
        calculatedTotal += subtotal;
        orderItems.push({
          id: product.id,
          name: product.name,
          price: productPrice,
          quantity,
          subtotal
        });
      }

      const orderNumber = generateOrderNumber();
      const paymentStatus = paymentMethod === 'cod' ? 'cod' : 'pending';

      const { rows: orderRows } = await client.query(
        'INSERT INTO orders (user_id, order_number, total_amount, shipping_name, shipping_address, shipping_phone, payment_method, payment_status, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
        [userId, orderNumber, calculatedTotal, shipping.name, shipping.address, shipping.phone, paymentMethod, paymentStatus, 'pending']
      );
      orderId = orderRows[0].id;

      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
          [orderId, item.id, item.name, item.price, item.quantity, item.subtotal]
        );
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ message: e.message });
    }
    client.release();

    const { rows: finalOrderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const { rows: finalOrderItems } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    const { rows: userRows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);

    const order = finalOrderRows[0];
    const customer = userRows[0];

    sendOrderNotificationEmail({
      order,
      customer: customer || { name: shipping.name, email: req.user?.email || 'N/A' },
      items: finalOrderItems
    }).catch(err => {
      console.error('Failed to send order notification email:', err);
    });

    sendCustomerOrderConfirmationEmail({
      order,
      customer: customer || { name: shipping.name, email: req.user?.email || 'N/A' },
      items: finalOrderItems
    }).catch(err => {
      console.error('Failed to send customer order notification email:', err);
    });

    return res.status(201).json({
      order: {
        ...order,
        items: finalOrderItems
      }
    });
  });

  // GET user orders
  if (!isAdminRoute) router.get('/my-orders', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { rows: orders } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return { ...order, items };
    }));
    
    return res.json({ orders: ordersWithItems });
  });

  // GET all orders (admin only)
  if (isAdminRoute) router.get('/', async (req, res) => {
    const { rows: orders } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return { ...order, items };
    }));
    
    return res.json({ orders: ordersWithItems });
  });

  // GET order by id
  router.get('/:id', async (req, res) => {
    const userId = req.user?.id;
    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!isAdminRoute && order.user_id !== userId) {
      return res.status(403).json({ message: 'You can only view your own orders' });
    }
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    return res.json({ order: { ...order, items } });
  });

  // PUT update order status (admin only)
  if (isAdminRoute) router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const { rows: items } = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
        for (const item of items) {
          await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
      }

      await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    const { rows: updatedOrderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

    return res.json({ order: { ...updatedOrderRows[0], items } });
  });

  // PUT update payment status (admin only)
  if (isAdminRoute) router.put('/:id/payment-status', async (req, res) => {
    const { paymentStatus, paymentId } = req.body;
    const orderId = req.params.id;

    if (!['pending', 'pending_verification', 'paid', 'failed', 'cod'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await pool.query('UPDATE orders SET payment_id = $1, payment_status = $2 WHERE id = $3', [paymentId || null, paymentStatus, orderId]);
    
    if (paymentStatus === 'paid' && order.status === 'pending') {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['processing', orderId]);
    }

    const { rows: updatedOrderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

    return res.json({ order: { ...updatedOrderRows[0], items } });
  });

  // PUT cancel order
  if (!isAdminRoute) router.put('/:id/cancel', async (req, res) => {
    const userId = req.user?.id;
    const orderId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own orders' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: items } = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of items) {
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
      await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    const { rows: cancelledOrderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const { rows: orderItems } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

    return res.json({ order: { ...cancelledOrderRows[0], items: orderItems } });
  });

  return router;
};