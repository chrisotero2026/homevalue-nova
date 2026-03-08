const jwt = require('jsonwebtoken');

/**
 * Middleware: verify JWT from Authorization Bearer header.
 * Attaches decoded payload to req.user on success.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalid or expired.' });
  }
}

module.exports = { requireAuth };
