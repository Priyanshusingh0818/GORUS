const express = require('express');
const router = express.Router();

module.exports = function (pool) {
  router.get('/users', async (req, res) => {
    const { rows: users } = await pool.query('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC');
    return res.json({ users });
  });

  return router;
};
