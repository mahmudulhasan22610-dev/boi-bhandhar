const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get all books
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [books] = await connection.query('SELECT * FROM books');
    connection.release();

    res.json({
      message: 'সকল বই সফলভাবে প্রাপ্ত',
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'বই প্রাপ্তি ব্যর্থ' });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [books] = await connection.query('SELECT * FROM books WHERE id = ?', [id]);
    connection.release();

    if (books.length === 0) {
      return res.status(404).json({ error: 'বই পাওয়া যায়নি' });
    }

    res.json({
      message: 'বই সফলভাবে প্রাপ্ত',
      data: books[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'বই প্রাপ্তি ব্যর্থ' });
  }
});

// Search books
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const connection = await pool.getConnection();
    const [books] = await connection.query(
      'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ?',
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    connection.release();

    res.json({
      message: 'সার্চ ফলাফল',
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'সার্চ ব্যর্থ' });
  }
});

// Get books by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const connection = await pool.getConnection();
    const [books] = await connection.query('SELECT * FROM books WHERE category = ?', [category]);
    connection.release();

    res.json({
      message: 'ক্যাটেগরি অনুযায়ী বই',
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'প্রাপ্তি ব্যর্থ' });
  }
});

module.exports = router;