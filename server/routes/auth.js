const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required.' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already taken.' });
    }
    const user = await User.create({ username, email, password });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, stats: user.stats }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, stats: user.stats }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token.' });
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user._id, username: user.username, email: user.email, stats: user.stats } });
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

module.exports = router;
