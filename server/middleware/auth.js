const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No authorization token.' });
  try {
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
