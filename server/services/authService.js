const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

class AuthService {
  constructor(pool) {
    this.pool = pool;
  }

  async signup(name, email, password) {
    const { rows: existingRows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingRows.length > 0) {
      const error = new Error('User already exists');
      error.statusCode = 409;
      throw error;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await this.pool.query(
      'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id',
      [name || null, email, password_hash, 0]
    );
    
    const user = { id: rows[0].id, name: name || null, email, is_admin: 0 };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return { user: { id: user.id, name: user.name, email: user.email, is_admin: false }, token };
  }

  async login(email, password) {
    const { rows } = await this.pool.query('SELECT id, name, email, phone, password_hash, is_admin FROM users WHERE email = $1', [email]);
    const user = rows[0];
    
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const payload = { id: user.id, email: user.email, is_admin: !!user.is_admin, phone: user.phone || null };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return { user: { id: user.id, name: user.name, email: user.email, phone: user.phone || null, is_admin: !!user.is_admin }, token };
  }

  async updateProfile(userId, name, email, phone) {
    const { rows: existingRows } = await this.pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows.length > 0 && existingRows[0].id !== userId) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }

    await this.pool.query('UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4', [name, email, phone || null, userId]);
    
    const { rows } = await this.pool.query('SELECT id, name, email, phone, is_admin FROM users WHERE id = $1', [userId]);
    const updatedUser = rows[0];
    return { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone || null, is_admin: !!updatedUser.is_admin };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const { rows } = await this.pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
  }

  async requestPasswordReset(email, clientUrl) {
    const { rows } = await this.pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return; // Prevent email enumeration

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    await this.pool.query('UPDATE users SET reset_token = $1, reset_expires_at = $2 WHERE id = $3', [resetTokenHash, resetExpiresAt, user.id]);

    const baseUrl = clientUrl ? clientUrl.split(',')[0] : 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset for your GORUS account.</p>
        <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Reset Password</a>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    const emailText = `
Password Reset

You requested a password reset for your GORUS account.
Please visit the following URL to reset your password. This link will expire in 1 hour:
${resetUrl}

If you didn't request this, you can safely ignore this email.
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - GORUS',
        htmlContent: emailHtml,
        textContent: emailText
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err.message);
      throw new Error('Failed to send password reset email. Please try again later.');
    }
  }

  async resetPassword(email, token, newPassword) {
    const { rows } = await this.pool.query('SELECT id, reset_token, reset_expires_at FROM users WHERE email = $1', [email]);
    const user = rows[0];
    
    if (!user || !user.reset_token || !user.reset_expires_at) {
      const error = new Error('Invalid or expired reset token');
      error.statusCode = 400;
      throw error;
    }

    if (new Date() > new Date(user.reset_expires_at)) {
      const error = new Error('Reset token has expired');
      error.statusCode = 400;
      throw error;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (tokenHash !== user.reset_token) {
      const error = new Error('Invalid reset token');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires_at = NULL WHERE id = $2', [passwordHash, user.id]);
  }
}

module.exports = AuthService;
