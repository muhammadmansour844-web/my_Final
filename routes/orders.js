const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Add missing columns (silently ignored if they already exist)
pool.query(`ALTER TABLE orders ADD COLUMN notes TEXT`).catch(() => {});
pool.query(`ALTER TABLE orders ADD COLUMN shipped_at DATETIME`).catch(() => {});
pool.query(`ALTER TABLE orders ADD COLUMN delivered_at DATETIME`).catch(() => {});

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

const isAuthenticated = (req, res, next) => {
  if (!['super_admin', 'company_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// إنشاء طلبية — فقط pharmacy_admin
router.post('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    if (req.user.account_type !== 'pharmacy_admin') {
      return res.status(403).json({ message: 'Only pharmacy can create orders' });
    }

    const { company_id, items } = req.body;
    // items = [{ product_id, quantity }, ...]

    // Validation
    if (!company_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'company_id and items are required' });
    }

    // تحقق إنه الصيدلية مرتبطة باليوزر
    const [relation] = await pool.query(
      `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`,
      [req.user.id]
    );
    if (relation.length === 0) {
      return res.status(403).json({ message: 'Not linked to any pharmacy' });
    }

    const pharmacyId = relation[0].pharmacy_id;

    // تحقق إنه الشركة موجودة
    const [company] = await pool.query(
      `SELECT id FROM companies WHERE id = ?`, [company_id]
    );
    if (company.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // تحقق من المنتجات والكميات
    for (const item of items) {
      const [product] = await pool.query(
        `SELECT id, stock_quantity, price FROM products WHERE id = ? AND company_id = ?`,
        [item.product_id, company_id]
      );
      if (product.length === 0) {
        return res.status(404).json({ message: `Product ${item.product_id} not found` });
      }
      if (product[0].stock_quantity < item.quantity) {
        return res.status(400).json({ message: `Product ${item.product_id} insufficient stock` });
      }
    }

    // إنشاء الطلبية
    const [order] = await pool.query(
      `INSERT INTO orders (pharmacy_id, company_id, status) VALUES (?, ?, 'pending')`,
      [pharmacyId, company_id]
    );

    const orderId = order.insertId;

    // إضافة المنتجات للطلبية
    for (const item of items) {
      const [product] = await pool.query(
        `SELECT price FROM products WHERE id = ?`, [item.product_id]
      );
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, product[0].price]
      );
    }

    res.status(201).json({ 
      message: 'Order created successfully', 
      orderId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب كل الطلبيات — حسب الصلاحية
router.get('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    // super_admin — يشوف كل شي مع اسم الصيدلية والشركة والمجموع
    if (req.user.account_type === 'super_admin') {
      const [rows] = await pool.query(
        `SELECT o.*,
          ph.name AS pharmacy_name,
          c.name  AS company_name,
          COALESCE((
            SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.id
          ), 0) AS total_amount,
          (
            SELECT COUNT(*) FROM order_items oi2 WHERE oi2.order_id = o.id
          ) AS items_count
         FROM orders o
         LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
         LEFT JOIN companies  c  ON c.id  = o.company_id`
      );
      return res.json(rows);
    }

    // company_admin — يشوف بس طلبيات شركته
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`,
        [req.user.id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Not linked to any company' });
      }
      const [rows] = await pool.query(
        `SELECT o.*,
          ph.name AS pharmacy_name,
          COALESCE((
            SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.id
          ), 0) AS total_amount
         FROM orders o
         LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
         WHERE o.company_id = ?`,
        [relation[0].company_id]
      );
      return res.json(rows);
    }

    // pharmacy_admin — طلبيات الصيدلية مع المورد والمجموع والتصنيف (للوحة والجداول)
    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`,
        [req.user.id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Not linked to any pharmacy' });
      }
      const [rows] = await pool.query(
        `SELECT o.*,
          c.name AS company_name,
          COALESCE((
            SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.id
          ), 0) AS total_amount,
          (
            SELECT p.category FROM order_items oi2
            JOIN products p ON p.id = oi2.product_id
            WHERE oi2.order_id = o.id LIMIT 1
          ) AS category_sample
         FROM orders o
         LEFT JOIN companies c ON c.id = o.company_id
         WHERE o.pharmacy_id = ?`,
        [relation[0].pharmacy_id]
      );
      return res.json(rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب طلبية واحدة
router.get('/:id', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT o.*,
              ph.name  AS pharmacy_name,
              ph.phone AS pharmacy_phone,
              ph.email AS pharmacy_email,
              c.name   AS company_name,
              JSON_ARRAYAGG(JSON_OBJECT(
                'product_id',   oi.product_id,
                'product_name', p.name,
                'quantity',     oi.quantity,
                'price',        oi.price
              )) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
       LEFT JOIN companies  c  ON c.id  = o.company_id
       WHERE o.id = ?
       GROUP BY o.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = rows[0];

    // تحقق من الصلاحية
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, order.company_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ? AND pharmacy_id = ?`,
        [req.user.id, order.pharmacy_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تحديث حالة الطلبية — حسب مين بيغير شو
router.put('/:id', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // تحقق إنه الطلبية موجودة
    const [existing] = await pool.query(
      `SELECT * FROM orders WHERE id = ?`, [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = existing[0];

    // تحديد مين بيقدر يغير لأي حالة
    const allowedTransitions = {
      // الشركة بتوافق أو ترفض أو تشحن أو تلغي
      company_admin: {
        pending: ['approved', 'rejected'],
        approved: ['shipped', 'cancelled']
      },
      // الصيدلية بتلغي طلباتها المعلقة وبتأكد الاستلام
      pharmacy_admin: {
        pending: ['cancelled'],
        shipped: ['delivered']
      },
      // الأدمن يغير أي حالة
      super_admin: {
        pending: ['approved', 'rejected', 'cancelled'],
        approved: ['shipped', 'rejected', 'cancelled'],
        shipped: ['delivered']
      }
    };

    const userTransitions = allowedTransitions[req.user.account_type];
    const currentStatus = order.status;

    // تحقق إنه التغيير مسموح
    if (!userTransitions?.[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${currentStatus} to ${status}` 
      });
    }

    // لو company_admin — تحقق إنه الطلبية تبع شركته
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, order.company_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // لو pharmacy_admin — تحقق إنه الطلبية تبعته
    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ? AND pharmacy_id = ?`,
        [req.user.id, order.pharmacy_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // حدّث الحالة والملاحظات
    await pool.query(
      `UPDATE orders SET status = ?, notes = COALESCE(?, notes) WHERE id = ?`,
      [status, notes || null, id]
    );

    // لو shipped — حدّث shipped_at
    if (status === 'shipped') {
      await pool.query(
        `UPDATE orders SET shipped_at = NOW() WHERE id = ?`, [id]
      );
    }

    // لو delivered — حدّث delivered_at
    if (status === 'delivered') {
      await pool.query(
        `UPDATE orders SET delivered_at = NOW() WHERE id = ?`, [id]
      );
    }

    // لو cancelled أو rejected — رجّع الكمية للمخزون
    if (status === 'cancelled' || status === 'rejected') {
      const [orderItems] = await pool.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = ?`, [id]
      );
      for (const item of orderItems) {
        await pool.query(
          `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }
    }

    res.json({ message: `Order status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف طلبية — company_admin فقط (طلباتها المعلقة أو المرفوضة)
router.delete('/:id', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = existing[0];

    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, order.company_id]
      );
      if (relation.length === 0) return res.status(403).json({ message: 'Access denied' });
    } else if (req.user.account_type === 'pharmacy_admin') {
      return res.status(403).json({ message: 'Pharmacy cannot delete orders' });
    }

    await pool.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);
    await pool.query(`DELETE FROM orders WHERE id = ?`, [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;