const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = function (db) {
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)');
  const findByEmail = db.prepare('SELECT id, name, email, password_hash, is_admin, created_at FROM users WHERE email = ?');

  router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const existing = findByEmail.get(email);
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 12);
    try {
      const info = insertUser.run(name || null, email, password_hash, 0);
      const user = { id: info.lastInsertRowid, name: name || null, email, is_admin: 0 };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
      return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, is_admin: false }, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = findByEmail.get(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user.id, email: user.email, is_admin: !!user.is_admin };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, is_admin: !!user.is_admin }, token });
  });

  // PUT update profile (requires auth)
  const updateUser = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
  router.put('/profile', (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      // Check if email is already taken by another user
      const existingUser = findByEmail.get(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: 'Email already in use' });
      }

      updateUser.run(name, email, userId);
      const updatedUser = db.prepare('SELECT id, name, email, is_admin FROM users WHERE id = ?').get(userId);
      
      return res.json({ user: updatedUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // PUT change password (requires auth)
  router.put('/change-password', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const ok = await bcrypt.compare(currentPassword, user.password_hash);
      if (!ok) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);
      
      return res.json({ message: 'Password changed successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
