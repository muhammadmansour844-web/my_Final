const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ===== Middleware =====

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
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

const isAdminOrPharmacy = (req, res, next) => {
  if (!['super_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// إنشاء صيدلية — فقط super_admin
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validation
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // تحقق إنه الإيميل مش مكرر
    const [existing] = await pool.query(
      `SELECT id FROM pharmacies WHERE email = ?`, [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // إنشاء الصيدلية
    const [result] = await pool.query(
      `INSERT INTO pharmacies (name, email, phone, address) VALUES (?, ?, ?, ?)`,
      [name, email, phone, address]
    );

    const pharmacyId = result.insertId;

    // إنشاء سلة افتراضية للصيدلية الجديدة
    await pool.query(
      `INSERT INTO carts (pharmacy_id, status) VALUES (?, 'active')`,
      [pharmacyId]
    );

    res.status(201).json({ 
      message: 'Pharmacy created successfully', 
      pharmacyId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب كل الصيدليات — فقط super_admin
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, address, created_at FROM pharmacies`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب صيدلية واحدة — super_admin أو pharmacy_admin (بس صيدليته هو)
router.get('/:id', verifyToken, isAdminOrPharmacy, async (req, res) => {
  try {
    const { id } = req.params;

    // لو pharmacy_admin — تحقق إنه بيطلب صيدليته هو بس
    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ? AND pharmacy_id = ?`,
        [req.user.id, id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, phone, address, created_at FROM pharmacies WHERE id = ?`, [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تعديل صيدلية — super_admin أو pharmacy_admin (بس صيدليته هو)
router.put('/:id', verifyToken, isAdminOrPharmacy, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // تحقق إنه الصيدلية موجودة
    const [existing] = await pool.query(
      `SELECT id FROM pharmacies WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    // لو pharmacy_admin — تحقق إنه بيعدل صيدليته هو بس
    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ? AND pharmacy_id = ?`,
        [req.user.id, id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await pool.query(
      `UPDATE pharmacies SET name=?, email=?, phone=?, address=? WHERE id=?`,
      [name, email, phone, address, id]
    );

    res.json({ message: 'Pharmacy updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف صيدلية — فقط super_admin
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // تحقق إنه الصيدلية موجودة
    const [existing] = await pool.query(
      `SELECT id FROM pharmacies WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    await pool.query(`DELETE FROM pharmacies WHERE id=?`, [id]);
    res.json({ message: 'Pharmacy deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;