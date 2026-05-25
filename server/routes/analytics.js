const express = require('express');
const router = express.Router();

module.exports = function (pool) {
  // GET dashboard statistics
  router.get('/dashboard', async (req, res) => {
    const { rows: orders } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const { rows: users } = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    const { rows: products } = await pool.query('SELECT * FROM products');

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
    for (const order of orders) {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
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
    }

    // Recent orders (last 10)
    const recentOrders = await Promise.all(orders.slice(0, 10).map(async order => {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return { ...order, items };
    }));

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
  });

  return router;
};

