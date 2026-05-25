const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  let token = req.cookies?.gorasToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, is_admin }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Missing token' });
  if (!req.user.is_admin) return res.status(403).json({ message: 'Admin access required' });
  next();
}

module.exports = { authMiddleware, adminOnly };
