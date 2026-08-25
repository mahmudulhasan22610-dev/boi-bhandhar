const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Add review
router.post('/', async (req, res) => {
  try {
    const { book_id, user_id, rating, comment } = req.body;

    if (!book_id || !user_id || !rating) {
      return res.status(400).json({ error: 'প্রয়োজনীয় তথ্য প্রদান করুন' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [book_id, user_id, rating, comment || null]
    );

    // Update book rating
    const [reviews] = await connection.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE book_id = ?',
      [book_id]
    );

    await connection.query(
      'UPDATE books SET rating = ?, reviews_count = ? WHERE id = ?',
      [reviews[0].avg_rating, reviews[0].count, book_id]
    );

    connection.release();

    res.status(201).json({
      message: 'রিভিউ সফলভাবে যোগ হয়েছে',
      review_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'রিভিউ যোগ করা ব্যর্থ' });
  }
});

// Get book reviews
router.get('/book/:book_id', async (req, res) => {
  try {
    const { book_id } = req.params;
    const connection = await pool.getConnection();

    const [reviews] = await connection.query(
      'SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.book_id = ? ORDER BY r.created_at DESC',
      [book_id]
    );

    connection.release();

    res.json({
      message: 'রিভিউ প্রাপ্ত',
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'রিভিউ প্রাপ্তি ব��যর্থ' });
  }
});

module.exports = router;