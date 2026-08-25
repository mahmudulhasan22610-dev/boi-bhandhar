const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../server');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'নাম, ইমেইল এবং পাসওয়ার্ড প্রয়োজন' });
    }

    const connection = await pool.getConnection();

    // Check if email already exists
    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'এই ইমেইল ইতিমধ্যে ব্যবহৃত' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null]
    );

    connection.release();

    // Create JWT Token
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'সফলভাবে রেজিস্ট্রেশন সম্পন্ন',
      token,
      user: {
        id: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'রেজিস্ট্রেশন ব্যর্থ' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      connection.release();
      return res.status(401).json({ error: 'ইমেইল বা পাসওয়ার্ড ভুল' });
    }

    connection.release();

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'সফলভাবে লগইন সম্পন্ন',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'লগইন ব্যর্থ' });
  }
});

module.exports = router;