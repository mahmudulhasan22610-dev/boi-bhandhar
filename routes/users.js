const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, email, phone, address, city, postal_code, country, created_at FROM users WHERE id = ?',
      [id]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    res.json({
      message: 'ব্যবহারকারী তথ্য প্রাপ্ত',
      data: users[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'প্রাপ্তি ব্যর্থ' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, postal_code, country } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, postal_code = ?, country = ? WHERE id = ?',
      [name, phone, address, city, postal_code, country, id]
    );
    connection.release();

    res.json({ message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'আপডেট ব্যর্থ' });
  }
});

module.exports = router;