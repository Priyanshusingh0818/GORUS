const express = require('express');
const router = express.Router();

module.exports = function (db) {
  const getAllOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
  const getOrderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const getAllUsers = db.prepare('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
  const getAllProducts = db.prepare('SELECT * FROM products');

  // GET dashboard statistics
  router.get('/dashboard', (req, res) => {
    try {
      const orders = getAllOrders.all();
      const users = getAllUsers.all();
      const products = getAllProducts.all();

      // Calculate total sales
      const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;
      const totalUsers = users.length;
      const totalProducts = products.length;

      // Sales by status
      const salesByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + order.total_amount;
        return acc;
      }, {});

      // Orders by status count
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Sales by product
      const salesByProduct = {};
      orders.forEach(order => {
        const items = getOrderItems.all(order.id);
        items.forEach(item => {
          if (!salesByProduct[item.product_name]) {
            salesByProduct[item.product_name] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0
            };
          }
          salesByProduct[item.product_name].quantity += item.quantity;
          salesByProduct[item.product_name].revenue += item.subtotal;
        });
      });

      // Recent orders (last 10)
      const recentOrders = orders.slice(0, 10).map(order => {
        const items = getOrderItems.all(order.id);
        return { ...order, items };
      });

      // Sales over time (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const daySales = orders
          .filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= date && orderDate < nextDate;
          })
          .reduce((sum, order) => sum + order.total_amount, 0);

        last7Days.push({
          date: date.toISOString().split('T')[0],
          sales: daySales,
          orders: orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= date && orderDate < nextDate;
          }).length
        });
      }

      // New users (last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const newUsers = users.filter(user => new Date(user.created_at) >= last30Days);

      return res.json({
        stats: {
          totalSales,
          totalOrders,
          totalUsers,
          totalProducts,
          newUsersCount: newUsers.length
        },
        salesByStatus,
        ordersByStatus,
        salesByProduct: Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue),
        recentOrders,
        salesOverTime: last7Days,
        newUsers: newUsers.map(u => ({ id: u.id, name: u.name, email: u.email, created_at: u.created_at }))
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};

