const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');
const { validate, signupSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../validators/authValidator');

module.exports = function (pool) {
  const authService = new AuthService(pool);

  router.post('/signup', validate(signupSchema), async (req, res) => {
    const { name, email, password } = req.body;
    const { user, token } = await authService.signup(name, email, password);
    
    res.cookie('gorasToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ user, token });
  });

  router.post('/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    
    res.cookie('gorasToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ user, token });
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('gorasToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res.json({ message: 'Logged out successfully' });
  });

  router.get('/me', authMiddleware, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const { rows } = await pool.query('SELECT id, name, email, phone, is_admin FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    return res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone || null, is_admin: !!user.is_admin } });
  });

  router.put('/profile', authMiddleware, validate(updateProfileSchema), async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { name, email, phone } = req.body;
    const updatedUser = await authService.updateProfile(userId, name, email, phone);
    return res.json({ user: updatedUser });
  });

  router.put('/change-password', authMiddleware, validate(changePasswordSchema), async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.json({ message: 'Password changed successfully' });
  });

  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    await authService.requestPasswordReset(email, process.env.CLIENT_URL);
    return res.json({ message: 'If an account with that email exists, we sent a password reset link.' });
  });

  router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    await authService.resetPassword(email, token, newPassword);
    return res.json({ message: 'Password has been successfully reset' });
  });

  return router;
};
