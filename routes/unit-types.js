const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ===== إنشاء الجدول تلقائياً عند تشغيل السيرفر =====
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unit_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        pieces_per_unit INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_company_unit (company_id, name)
      )
    `);
    // لو الجدول كان موجود من قبل بدون pieces_per_unit
    try {
      await pool.query(`ALTER TABLE unit_types ADD COLUMN pieces_per_unit INT NOT NULL DEFAULT 1`);
    } catch (e) { /* العمود موجود */ }
    // إضافة عمود unit_type لجدول المنتجات
    try {
      await pool.query(`ALTER TABLE products ADD COLUMN unit_type VARCHAR(100) DEFAULT NULL`);
    } catch (e) { /* العمود موجود */ }
    // إضافة الوحدات الافتراضية لكل شركة موجودة
    const [companies] = await pool.query(`SELECT id FROM companies`);
    for (const company of companies) {
      await seedDefaultUnits(company.id);
    }
    console.log('✅ unit_types table ready');
  } catch (err) {
    console.error('❌ Failed to create unit_types table:', err.message);
  }
})();

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

// جلب وحدات شركة معينة
router.get('/company/:companyId', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    if (req.user.account_type === 'company_admin') {
      const [rel] = await pool.query(
        'SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?',
        [req.user.id, companyId]
      );
      if (rel.length === 0) return res.status(403).json({ message: 'Access denied' });
    } else if (req.user.account_type !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const [rows] = await pool.query(
      'SELECT * FROM unit_types WHERE company_id = ? ORDER BY pieces_per_unit ASC',
      [companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب وحدات شركة الأدمن المسجل حالياً
router.get('/my', verifyToken, async (req, res) => {
  try {
    if (req.user.account_type === 'company_admin') {
      const [rel] = await pool.query(
        'SELECT company_id FROM company_users WHERE user_id = ?', [req.user.id]
      );
      if (rel.length === 0) return res.status(403).json({ message: 'Not linked to any company' });
      const [rows] = await pool.query(
        'SELECT * FROM unit_types WHERE company_id = ? ORDER BY pieces_per_unit ASC',
        [rel[0].company_id]
      );
      return res.json(rows);
    }
    if (req.user.account_type === 'super_admin') {
      const [rows] = await pool.query('SELECT * FROM unit_types ORDER BY company_id, pieces_per_unit ASC');
      return res.json(rows);
    }
    res.status(403).json({ message: 'Access denied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة وحدة جديدة — فقط super_admin
router.post('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { company_id, name } = req.body;
    const pieces_per_unit = parseInt(req.body.pieces_per_unit) || 1;
    console.log('📦 POST /unit-types — body:', { company_id, name, pieces_per_unit });

    if (!company_id || !name?.trim()) {
      return res.status(400).json({ message: 'company_id and name are required' });
    }
    const [comp] = await pool.query('SELECT id FROM companies WHERE id = ?', [company_id]);
    if (comp.length === 0) return res.status(404).json({ message: 'Company not found' });

    const [dup] = await pool.query(
      'SELECT id FROM unit_types WHERE company_id = ? AND name = ?',
      [company_id, name.trim()]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Unit type already exists for this company' });

    const [result] = await pool.query(
      'INSERT INTO unit_types (company_id, name, pieces_per_unit) VALUES (?, ?, ?)',
      [company_id, name.trim(), pieces_per_unit]
    );
    console.log('✅ Unit type created:', result.insertId);
    res.status(201).json({ message: 'Unit type created', id: result.insertId });
  } catch (err) {
    console.error('❌ POST /unit-types error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// تعديل وحدة — فقط super_admin
router.put('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const ppu = parseInt(req.body.pieces_per_unit);
    if (!name?.trim() || isNaN(ppu) || ppu < 1) {
      return res.status(400).json({ message: 'name and pieces_per_unit (≥1) are required' });
    }
    const [existing] = await pool.query('SELECT * FROM unit_types WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Unit type not found' });

    const [dup] = await pool.query(
      'SELECT id FROM unit_types WHERE company_id = ? AND name = ? AND id != ?',
      [existing[0].company_id, name.trim(), id]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Unit type name already exists' });

    await pool.query(
      'UPDATE unit_types SET name = ?, pieces_per_unit = ? WHERE id = ?',
      [name.trim(), ppu, id]
    );
    res.json({ message: 'Unit type updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف وحدة — فقط super_admin
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM unit_types WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Unit type not found' });
    await pool.query('DELETE FROM unit_types WHERE id = ?', [id]);
    res.json({ message: 'Unit type deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
