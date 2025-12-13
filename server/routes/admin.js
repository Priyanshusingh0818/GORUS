const express = require('express');
const router = express.Router();

module.exports = function (db) {
  const listUsers = db.prepare('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC');

  router.get('/users', async (req, res) => {
    try {
      const users = listUsers.all();
      return res.json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
