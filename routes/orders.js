const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Create order
router.post('/', async (req, res) => {
  try {
    const { user_id, items, shipping_address } = req.body;

    if (!user_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'অপরিহার্য তথ্য প্রয়োজন' });
    }

    const connection = await pool.getConnection();

    // Calculate total
    let total_amount = 0;
    for (let item of items) {
      const [books] = await connection.query('SELECT price FROM books WHERE id = ?', [item.book_id]);
      if (books.length > 0) {
        total_amount += books[0].price * item.quantity;
      }
    }

    // Create order
    const order_number = 'ORD-' + Date.now();
    const [result] = await connection.query(
      'INSERT INTO orders (user_id, order_number, total_amount, shipping_address) VALUES (?, ?, ?, ?)',
      [user_id, order_number, total_amount, shipping_address]
    );

    // Add order items
    for (let item of items) {
      const [books] = await connection.query('SELECT price FROM books WHERE id = ?', [item.book_id]);
      if (books.length > 0) {
        await connection.query(
          'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)',
          [result.insertId, item.book_id, item.quantity, books[0].price]
        );
      }
    }

    connection.release();

    res.status(201).json({
      message: 'অর্ডার সফলভাবে তৈরি হয়েছে',
      order_id: result.insertId,
      order_number,
      total_amount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'অর্ডার তৈরি ব্যর্থ' });
  }
});

// Get user orders
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();
    const [orders] = await connection.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    connection.release();

    res.json({
      message: 'অর্ডার তথ্য প্রাপ্ত',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'অর্ডার প্রাপ্তি ব্যর্থ' });
  }
});

// Get order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'অর্ডার পাওয়া যায়নি' });
    }

    const [items] = await connection.query(
      'SELECT oi.*, b.title, b.author FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?',
      [id]
    );

    connection.release();

    res.json({
      message: 'অর্ডার বিস্তারিত প্রাপ্ত',
      order: orders[0],
      items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'অর্ডার প্রাপ্তি ব্যর্থ' });
  }
});

module.exports = router;