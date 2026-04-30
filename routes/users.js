const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');

const router = express.Router();

// ===== Auto-create pending_requests table =====
;(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        account_type ENUM('company_admin', 'pharmacy_admin') NOT NULL,
        company_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Could not create pending_requests table:', err.message);
  }
})();

// ===== Nodemailer =====
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

const sendMail = async (to, subject, html) => {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

// ===== Auth Middleware =====
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user.account_type !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// Admin creates a user directly (active immediately)
router.post('/register', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, account_type } = req.body;

    if (!name || !email || !password || !account_type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['super_admin', 'company_admin', 'pharmacy_admin'].includes(account_type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    const [existing] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, account_type, is_active) VALUES (?, ?, ?, ?, 1)`,
      [name, email, hashedPassword, account_type]
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public registration — saves into pending_requests awaiting admin approval
router.post('/public-register', async (req, res) => {
  try {
    const { name, email, password, account_type, phone, company_name } = req.body;

    if (!name || !email || !password || !account_type || !phone || !company_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['company_admin', 'pharmacy_admin'].includes(account_type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existingUser] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const [existingPending] = await pool.query(`SELECT id FROM pending_requests WHERE email = ?`, [email]);
    if (existingPending.length > 0) {
      return res.status(409).json({ message: 'A pending request with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO pending_requests (full_name, email, password, account_type, phone, company_name) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, account_type, phone, company_name]
    );

    res.status(201).json({
      message: 'Registration request submitted successfully. Our team will review your application and contact you within 24-48 hours.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending requests — super admin only
router.get('/pending', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, account_type, company_name, created_at
       FROM pending_requests ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve a pending request — moves user to active users, sends email
router.post('/approve/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM pending_requests WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pending request not found' });
    }
    const request = rows[0];

    const [existing] = await pool.query(`SELECT id FROM users WHERE email = ?`, [request.email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists in users' });
    }

    await pool.query(
      `INSERT INTO users (name, email, password, account_type, phone, entity_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [request.full_name, request.email, request.password, request.account_type, request.phone, request.company_name]
    );

    await pool.query(`DELETE FROM pending_requests WHERE id = ?`, [id]);

    await sendMail(
      request.email,
      'Your PharmaPridge Account Has Been Approved ✅',
      `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#16a34a">Welcome to PharmaPridge!</h2>
          <p>Dear <strong>${request.full_name}</strong>,</p>
          <p>Great news — your registration request has been <strong>approved</strong>.</p>
          <p>You can now log in using your registered email and password.</p>
          <p style="margin-top:1.5rem">
            <a href="http://localhost:5173/login"
               style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Login to PharmaPridge
            </a>
          </p>
          <p style="color:#888;font-size:0.85rem;margin-top:2rem">If you didn't request this, please ignore this email.</p>
        </div>
      `
    );

    res.json({ message: 'User approved and activated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject a pending request — removes it and notifies user
router.post('/reject/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT * FROM pending_requests WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pending request not found' });
    }
    const request = rows[0];

    await pool.query(`DELETE FROM pending_requests WHERE id = ?`, [id]);

    await sendMail(
      request.email,
      'PharmaPridge Registration Update',
      `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#dc2626">Registration Update</h2>
          <p>Dear <strong>${request.full_name}</strong>,</p>
          <p>We regret to inform you that your registration request for <strong>${request.company_name}</strong> could not be approved at this time.</p>
          <p>Please contact our support team for further assistance.</p>
        </div>
      `
    );

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.query(`SELECT * FROM users WHERE email = ?`, [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    if (user.is_active === 0) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let entity_name = null;
    let entity_id = null;
    if (user.account_type === 'pharmacy_admin') {
      const [rel] = await pool.query(
        `SELECT ph.id, ph.name FROM pharmacy_users pu JOIN pharmacies ph ON ph.id = pu.pharmacy_id WHERE pu.user_id = ? LIMIT 1`,
        [user.id]
      );
      if (rel.length > 0) { entity_name = rel[0].name; entity_id = rel[0].id; }
    } else if (user.account_type === 'company_admin') {
      const [rel] = await pool.query(
        `SELECT c.id, c.name FROM company_users cu JOIN companies c ON c.id = cu.company_id WHERE cu.user_id = ? LIMIT 1`,
        [user.id]
      );
      if (rel.length > 0) { entity_name = rel[0].name; entity_id = rel[0].id; }
    }

    const token = jwt.sign(
      { id: user.id, account_type: user.account_type },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, account_type: user.account_type, entity_name, entity_id }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active users
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, account_type, phone, entity_name, is_active, created_at FROM users`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user by id
router.get('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, name, email, account_type, phone, entity_name, is_active, created_at FROM users WHERE id = ?`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, account_type, is_active, password } = req.body;
    const { id } = req.params;

    const [existing] = await pool.query(`SELECT id FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'User not found' });

    if (account_type && !['super_admin', 'company_admin', 'pharmacy_admin'].includes(account_type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name=?, email=?, account_type=?, is_active=?, password=? WHERE id=?`,
        [name, email, account_type, is_active, hashedPassword, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET name=?, email=?, account_type=?, is_active=? WHERE id=?`,
        [name, email, account_type, is_active, id]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const [existing] = await pool.query(`SELECT id FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'User not found' });

    await pool.query(`DELETE FROM users WHERE id=?`, [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
