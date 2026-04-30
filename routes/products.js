const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ===== Upload Config =====

const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 11)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

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

const isCompanyAdmin = (req, res, next) => {
  if (!['super_admin', 'company_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: `Access denied: your account type (${req.user.account_type}) cannot manage products.` });
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  if (!['super_admin', 'company_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Helper =====

async function attachImages(products) {
  if (products.length === 0) return products;
  const ids = products.map(p => p.id);
  const [imgs] = await pool.query(
    `SELECT product_id, picture FROM product_images WHERE product_id IN (?)`,
    [ids]
  );
  const map = {};
  imgs.forEach(img => {
    if (!map[img.product_id]) map[img.product_id] = [];
    map[img.product_id].push(img.picture);
  });
  return products.map(p => ({ ...p, images: map[p.id] || [] }));
}

async function getCompanyId(userId) {
  const [relation] = await pool.query(
    `SELECT company_id FROM company_users WHERE user_id = ?`, [userId]
  );
  return relation.length > 0 ? relation[0].company_id : null;
}

// ===== Routes =====

// POST /api/products — إضافة منتج (JSON)
router.post('/', verifyToken, isCompanyAdmin, async (req, res) => {
  try {
    let {
      company_id, name, category, manufacturer,
      description, price, stock_quantity,
      has_expiry, expiry_date, discount_percentage,
      promotion_end_date, unit_type, units_per_package
    } = req.body;

    if (req.user.account_type === 'company_admin') {
      company_id = await getCompanyId(req.user.id);
      if (!company_id) return res.status(403).json({ message: 'Not linked to any company' });
    }

    if (!company_id || !name || !price || !stock_quantity) {
      return res.status(400).json({ message: 'name, price, stock_quantity are required' });
    }

    const [company] = await pool.query(`SELECT id FROM companies WHERE id = ?`, [company_id]);
    if (company.length === 0) return res.status(404).json({ message: 'Company not found' });

    const [result] = await pool.query(
      `INSERT INTO products
       (company_id, name, category, manufacturer, description, price, stock_quantity,
        has_expiry, expiry_date, discount_percentage, promotion_end_date,
        unit_type, units_per_package, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [company_id, name, category, manufacturer, description, price, stock_quantity,
       has_expiry || 0, expiry_date || null, discount_percentage || 0, promotion_end_date || null,
       unit_type || 'Unit', parseInt(units_per_package) || 1]
    );

    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products/:id/images — رفع صور للمنتج (FormData)
router.post('/:id/images', verifyToken, isCompanyAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

    if (req.user.account_type === 'company_admin') {
      const companyId = await getCompanyId(req.user.id);
      if (!companyId || Number(companyId) !== Number(existing[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO product_images (product_id, company_id, picture) VALUES (?, ?, ?)`,
          [id, existing[0].company_id, file.filename]
        );
      }
    }

    res.json({ message: 'Images uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id/images — تحديث صور المنتج (FormData)
router.put('/:id/images', verifyToken, isCompanyAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

    if (req.user.account_type === 'company_admin') {
      const companyId = await getCompanyId(req.user.id);
      if (!companyId || Number(companyId) !== Number(existing[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const keepImages = req.body.keepImages
      ? (Array.isArray(req.body.keepImages) ? req.body.keepImages : [req.body.keepImages])
      : [];

    const [currentImages] = await pool.query(
      `SELECT picture FROM product_images WHERE product_id = ?`, [id]
    );
    for (const img of currentImages) {
      if (!keepImages.includes(img.picture)) {
        const filePath = path.join(uploadsDir, img.picture);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await pool.query(
          `DELETE FROM product_images WHERE product_id = ? AND picture = ?`,
          [id, img.picture]
        );
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO product_images (product_id, company_id, picture) VALUES (?, ?, ?)`,
          [id, existing[0].company_id, file.filename]
        );
      }
    }

    res.json({ message: 'Images updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products — جلب كل المنتجات
router.get('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    let rows;
    if (req.user.account_type === 'company_admin') {
      const companyId = await getCompanyId(req.user.id);
      if (!companyId) return res.status(403).json({ message: 'Not linked to any company' });
      [rows] = await pool.query(`SELECT * FROM products WHERE company_id = ?`, [companyId]);
    } else {
      [rows] = await pool.query(`SELECT * FROM products`);
    }
    res.json(await attachImages(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id — جلب منتج واحد
router.get('/:id', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });

    if (req.user.account_type === 'company_admin') {
      const companyId = await getCompanyId(req.user.id);
      if (!companyId || Number(companyId) !== Number(rows[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const [product] = await attachImages(rows);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id — تعديل منتج (JSON)
router.put('/:id', verifyToken, isCompanyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, manufacturer, description,
      price, stock_quantity, has_expiry,
      expiry_date, discount_percentage, promotion_end_date,
      unit_type, units_per_package
    } = req.body;

    const [existing] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

    if (req.user.account_type === 'company_admin') {
      const companyId = await getCompanyId(req.user.id);
      if (!companyId || Number(companyId) !== Number(existing[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await pool.query(
      `UPDATE products
       SET name=?, category=?, manufacturer=?, description=?, price=?,
           stock_quantity=?, has_expiry=?, expiry_date=?, discount_percentage=?,
           promotion_end_date=?, unit_type=?, units_per_package=?, updated_at=NOW()
       WHERE id=?`,
      [name, category, manufacturer, description, price, stock_quantity,
       has_expiry || 0, expiry_date || null, discount_percentage || 0, promotion_end_date || null,
       unit_type || existing[0].unit_type || 'Unit',
       parseInt(units_per_package) || existing[0].units_per_package || 1, id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id — حذف منتج
router.delete('/:id', verifyToken, isCompanyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

    if (req.user.account_type === 'company_admin') {
      const companyId = await getCompanyId(req.user.id);
      if (!companyId || Number(companyId) !== Number(existing[0].company_id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const [linkedOrders] = await pool.query(
      `SELECT COUNT(*) as cnt FROM order_items WHERE product_id = ?`, [id]
    );
    if (linkedOrders[0].cnt > 0) {
      return res.status(400).json({ message: 'Cannot delete: product has associated orders.' });
    }

    const [images] = await pool.query(`SELECT picture FROM product_images WHERE product_id = ?`, [id]);
    for (const img of images) {
      const filePath = path.join(uploadsDir, img.picture);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);
    await pool.query(`DELETE FROM products WHERE id=?`, [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
