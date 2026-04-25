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

const isCompanyAdmin = (req, res, next) => {
  if (!['super_admin', 'company_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: `Access denied: your account type (${req.user.account_type}) cannot manage products. Please log out and log in with a company admin account.` });
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  // كل المسجلين يقدروا يشوفوا المنتجات (شركة وصيدلية وأدمن)
  if (!['super_admin', 'company_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// إضافة منتج — super_admin أو company_admin (بس لشركته هو)
router.post('/', verifyToken, isCompanyAdmin, async (req, res) => {
  try {
    let {
      company_id, name, category, manufacturer,
      description, price, stock_quantity,
      has_expiry, expiry_date, discount_percentage
    } = req.body;

    // لو company_admin — جيب company_id تلقائياً من قاعدة البيانات (مش من الطلب)
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`,
        [req.user.id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Not linked to any company' });
      }
      company_id = relation[0].company_id;
    }

    // Validation
    if (!company_id || !name || !price || !stock_quantity) {
      return res.status(400).json({ message: 'company_id, name, price, stock_quantity are required' });
    }

    // تحقق إنه الشركة موجودة
    const [company] = await pool.query(
      `SELECT id FROM companies WHERE id = ?`, [company_id]
    );
    if (company.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { image_url, promotion_end_date } = req.body;
    const [result] = await pool.query(
      `INSERT INTO products
       (company_id, name, category, manufacturer, description, price, stock_quantity, has_expiry, expiry_date, discount_percentage, image_url, promotion_end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [company_id, name, category, manufacturer, description, price, stock_quantity, has_expiry, expiry_date || null, discount_percentage || 0, image_url || null, promotion_end_date || null]
    );

    res.status(201).json({ 
      message: 'Product created successfully', 
      productId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب كل المنتجات — كل المسجلين يشوفوا
router.get('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    // لو company_admin — بشوف بس منتجات شركته
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`,
        [req.user.id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Not linked to any company' });
      }

      const companyId = relation[0].company_id;
      const [rows] = await pool.query(
        `SELECT * FROM products WHERE company_id = ?`, [companyId]
      );
      return res.json(rows);
    }

    // super_admin و pharmacy_admin يشوفوا كل المنتجات
    const [rows] = await pool.query(`SELECT * FROM products`);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب منتج واحد — كل المسجلين يشوفوا
router.get('/:id', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE id = ?`, [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // لو company_admin — تحقق إنه المنتج تابع لشركته
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, rows[0].company_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تعديل منتج — super_admin أو company_admin (بس منتجات شركته)
router.put('/:id', verifyToken, isCompanyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, category, manufacturer, description, 
      price, stock_quantity, has_expiry, 
      expiry_date, discount_percentage 
    } = req.body;

    // تحقق إنه المنتج موجود
    const [existing] = await pool.query(
      `SELECT * FROM products WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // لو company_admin — تحقق إنه المنتج تابع لشركته
    if (req.user.account_type === 'company_admin') {
      const [userCompany] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`, [req.user.id]
      );
      if (userCompany.length === 0 || Number(userCompany[0].company_id) !== Number(existing[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { image_url, promotion_end_date } = req.body;
    await pool.query(
      `UPDATE products
       SET name=?, category=?, manufacturer=?, description=?, price=?,
           stock_quantity=?, has_expiry=?, expiry_date=?, discount_percentage=?, image_url=?, promotion_end_date=?, updated_at=NOW()
       WHERE id=?`,
      [name, category, manufacturer, description, price, stock_quantity, has_expiry, expiry_date || null, discount_percentage || 0, image_url || null, promotion_end_date || null, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف منتج — super_admin أو company_admin (بس منتجات شركته)
router.delete('/:id', verifyToken, isCompanyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // تحقق إنه المنتج موجود
    const [existing] = await pool.query(
      `SELECT * FROM products WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // لو company_admin — تحقق إنه المنتج تابع لشركته
    if (req.user.account_type === 'company_admin') {
      const [userCompany] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`, [req.user.id]
      );
      if (userCompany.length === 0 || Number(userCompany[0].company_id) !== Number(existing[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // تحقق لو المنتج مرتبط بطلبيات — امنع الحذف لحفظ السجل
    const [linkedOrders] = await pool.query(
      `SELECT COUNT(*) as cnt FROM order_items WHERE product_id = ?`, [id]
    );
    if (linkedOrders[0].cnt > 0) {
      return res.status(400).json({ message: 'Cannot delete: product has associated orders. Consider setting stock to 0 instead.' });
    }

    await pool.query(`DELETE FROM products WHERE id=?`, [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;