const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

const DEFAULT_UNITS = [
  { name: 'Box', pieces_per_unit: 1 },
  { name: 'Carton', pieces_per_unit: 24 },
];

const seedDefaultUnits = async (companyId) => {
  for (const unit of DEFAULT_UNITS) {
    await pool.query(
      `INSERT IGNORE INTO unit_types (company_id, name, pieces_per_unit) VALUES (?, ?, ?)`,
      [companyId, unit.name, unit.pieces_per_unit]
    );
  }
};

// ===== Middleware =====

// التحقق من التوكن
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

// التحقق إنه super_admin
const isSuperAdmin = (req, res, next) => {
  if (req.user.account_type !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// التحقق إنه super_admin أو company_admin
const isAdminOrCompany = (req, res, next) => {
  if (!['super_admin', 'company_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// إنشاء شركة — فقط super_admin
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validation
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // تحقق إنه الإيميل مش مكرر
    const [existing] = await pool.query(
      `SELECT id FROM companies WHERE email = ?`, [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO companies (name, email, phone, address) VALUES (?, ?, ?, ?)`,
      [name, email, phone, address]
    );

    await seedDefaultUnits(result.insertId);

    res.status(201).json({
      message: 'Company created successfully',
      companyId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب كل الشركات — فقط super_admin
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, address, created_at FROM companies`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب شركة واحدة — super_admin أو company_admin (بس شركته هو)
router.get('/:id', verifyToken, isAdminOrCompany, async (req, res) => {
  try {
    const { id } = req.params;

    // لو company_admin — تحقق إنه بيطلب شركته هو بس
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const [rows] = await pool.query(
      `SELECT id, name, email, phone, address, created_at FROM companies WHERE id = ?`, [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تعديل شركة — super_admin أو company_admin (بس شركته هو)
router.put('/:id', verifyToken, isAdminOrCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // تحقق إنه الشركة موجودة
    const [existing] = await pool.query(
      `SELECT id FROM companies WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // لو company_admin — تحقق إنه بيعدل شركته هو بس
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await pool.query(
      `UPDATE companies SET name=?, email=?, phone=?, address=? WHERE id=?`,
      [name, email, phone, address, id]
    );

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف شركة — فقط super_admin
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // تحقق إنه الشركة موجودة
    const [existing] = await pool.query(
      `SELECT id FROM companies WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    await pool.query(`DELETE FROM companies WHERE id=?`, [id]);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;