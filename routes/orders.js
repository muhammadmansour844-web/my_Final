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

const isAuthenticated = (req, res, next) => {
  if (!['super_admin', 'company_admin', 'pharmacy_admin', 'delivery_admin'].includes(req.user.account_type)) {
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

      if (item.variant_id) {
        const [variant] = await pool.query(
          `SELECT stock_quantity, pieces_per_unit FROM product_unit_variants WHERE id = ?`, [item.variant_id]
        );
        if (variant.length === 0) return res.status(404).json({ message: `Variant ${item.variant_id} not found` });
        const variantQty = Math.ceil(item.quantity / (variant[0].pieces_per_unit || 1));
        if (variant[0].stock_quantity < variantQty) {
          return res.status(400).json({ message: `Insufficient variant stock` });
        }
      } else {
        if (product[0].stock_quantity < item.quantity) {
          return res.status(400).json({ message: `Product ${item.product_id} insufficient stock` });
        }
      }
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // إنشاء الطلبية
      const [order] = await conn.query(
        `INSERT INTO orders (pharmacy_id, company_id, status) VALUES (?, ?, 'pending')`,
        [pharmacyId, company_id]
      );

      const orderId = order.insertId;

      // إضافة المنتجات للطلبية وخصم المخزون
      for (const item of items) {
        const [product] = await conn.query(
          `SELECT price FROM products WHERE id = ?`, [item.product_id]
        );
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price, variant_id, variant_pieces) VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, product[0].price, item.variant_id || null, item.variant_pieces || null]
        );

        if (item.variant_id) {
          const variantQty = Math.ceil(item.quantity / (item.variant_pieces || 1));
          await conn.query(
            `UPDATE product_unit_variants SET stock_quantity = stock_quantity - ? WHERE id = ?`,
            [variantQty, item.variant_id]
          );
        } else {
          await conn.query(
            `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
            [item.quantity, item.product_id]
          );
        }
      }

      await conn.commit();
      conn.release();

      res.status(201).json({
        message: 'Order created successfully',
        orderId
      });
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ error: txErr.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ملخص المدفوعات — يجب قبل /:id حتى لا يُعامَل "summary" كـ id
router.get('/summary/payments', verifyToken, isAuthenticated, async (req, res) => {
  try {
    let companyFilter = '';
    const params = [];

    if (req.user.account_type === 'company_admin') {
      const [rel] = await pool.query(`SELECT company_id FROM company_users WHERE user_id = ?`, [req.user.id]);
      if (rel.length === 0) return res.status(403).json({ message: 'Not linked to any company' });
      companyFilter = 'AND o.company_id = ?';
      params.push(rel[0].company_id);
    } else if (!['super_admin'].includes(req.user.account_type)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [rows] = await pool.query(
      `SELECT
        ph.id   AS pharmacy_id,
        ph.name AS pharmacy_name,
        ph.phone AS pharmacy_phone,
        c.id    AS company_id,
        c.name  AS company_name,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN (
          SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.id
        ) END), 0) AS total_delivered,
        COALESCE(SUM(CASE WHEN o.status IN ('pending','approved','shipped') THEN (
          SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.id
        ) END), 0) AS total_pending
       FROM orders o
       LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
       LEFT JOIN companies  c  ON c.id  = o.company_id
       WHERE o.status != 'rejected' ${companyFilter}
       GROUP BY ph.id, c.id
       ORDER BY total_delivered DESC`,
      params
    );
    res.json(rows);
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
          ph.phone AS pharmacy_phone,
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

    // delivery_admin — يشوف الطلبيات المشحونة المعينة له
    if (req.user.account_type === 'delivery_admin') {
      const [rows] = await pool.query(
        `SELECT o.*,
          ph.name AS pharmacy_name,
          ph.phone AS pharmacy_phone,
          ph.address AS pharmacy_address,
          c.name  AS company_name,
          u.name  AS driver_name,
          COALESCE((
            SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.id
          ), 0) AS total_amount,
          (SELECT COUNT(*) FROM order_items oi2 WHERE oi2.order_id = o.id) AS items_count
         FROM orders o
         LEFT JOIN pharmacies ph ON ph.id = o.pharmacy_id
         LEFT JOIN companies  c  ON c.id  = o.company_id
         LEFT JOIN users      u  ON u.id  = o.delivery_user_id
         WHERE o.status = 'shipped' AND o.delivery_user_id = ?`,
        [req.user.id]
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
                'id',           oi.id,
                'product_id',   oi.product_id,
                'product_name', p.name,
                'quantity',     oi.quantity,
                'price',        oi.price,
                'variant_id',   oi.variant_id,
                'variant_pieces', oi.variant_pieces
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
    const { status, notes, rejected_item_ids, delivery_user_id } = req.body;

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
      // الشركة بتوافق أو ترفض أو تشحن
      company_admin: {
        pending: ['approved', 'rejected'],
        approved: ['shipped', 'rejected'],
        shipped: ['delivered']
      },
      // الصيدلية ترفض طلباتها المعلقة وبتأكد الاستلام
      pharmacy_admin: {
        pending: ['rejected'],
        shipped: ['delivered'],
        delivered: ['completed']
      },
      // الأدمن يغير أي حالة
      super_admin: {
        pending: ['approved', 'rejected'],
        approved: ['shipped', 'rejected'],
        shipped: ['delivered'],
        delivered: ['completed']
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
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // لو approved مع بعض المنتجات مرفوضة — احذفهم وارجع مخزونهم
      if (status === 'approved' && Array.isArray(rejected_item_ids) && rejected_item_ids.length > 0) {
        const [rejItems] = await conn.query(
          `SELECT id, product_id, quantity, variant_id, variant_pieces FROM order_items WHERE id IN (?) AND order_id = ?`,
          [rejected_item_ids, id]
        );
        for (const item of rejItems) {
          if (item.variant_id) {
            const variantQty = Math.ceil(item.quantity / (item.variant_pieces || 1));
            await conn.query(
              `UPDATE product_unit_variants SET stock_quantity = stock_quantity + ? WHERE id = ?`,
              [variantQty, item.variant_id]
            );
          } else {
            await conn.query(
              `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
              [item.quantity, item.product_id]
            );
          }
          await conn.query(`DELETE FROM order_items WHERE id = ?`, [item.id]);
        }
      }

      await conn.query(
        `UPDATE orders SET status = ?, notes = COALESCE(?, notes) WHERE id = ?`,
        [status, notes || null, id]
      );

      // لو shipped — حدّث shipped_at وخصص السائق
      if (status === 'shipped') {
        await conn.query(
          `UPDATE orders SET shipped_at = NOW(), delivery_user_id = COALESCE(?, delivery_user_id) WHERE id = ?`,
          [delivery_user_id || null, id]
        );
      }

      // لو delivered — حدّث delivered_at
      if (status === 'delivered') {
        await conn.query(
          `UPDATE orders SET delivered_at = NOW() WHERE id = ?`, [id]
        );
      }

      // لو rejected — رجّع الكمية للمخزون فقط إذا ما كانت مرفوضة أصلاً
      if (status === 'rejected' && currentStatus !== 'rejected') {
        const [orderItems] = await conn.query(
          `SELECT product_id, quantity, variant_id, variant_pieces FROM order_items WHERE order_id = ?`, [id]
        );
        for (const item of orderItems) {
          if (item.variant_id) {
            const variantQty = Math.ceil(item.quantity / (item.variant_pieces || 1));
            await conn.query(
              `UPDATE product_unit_variants SET stock_quantity = stock_quantity + ? WHERE id = ?`,
              [variantQty, item.variant_id]
            );
          } else {
            await conn.query(
              `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
              [item.quantity, item.product_id]
            );
          }
        }
      }

      await conn.commit();
      conn.release();
      res.json({ message: `Order status updated to ${status}` });
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ error: txErr.message });
    }
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

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // إرجاع المخزون إذا الطلبية لم تكن مرفوضة مسبقاً
      if (order.status !== 'rejected') {
        const [orderItems] = await conn.query(
          `SELECT product_id, quantity, variant_id, variant_pieces FROM order_items WHERE order_id = ?`, [id]
        );
        for (const item of orderItems) {
          if (item.variant_id) {
            const variantQty = Math.ceil(item.quantity / (item.variant_pieces || 1));
            await conn.query(
              `UPDATE product_unit_variants SET stock_quantity = stock_quantity + ? WHERE id = ?`,
              [variantQty, item.variant_id]
            );
          } else {
            await conn.query(
              `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
              [item.quantity, item.product_id]
            );
          }
        }
      }

      await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);
      await conn.query(`DELETE FROM orders WHERE id = ?`, [id]);

      await conn.commit();
      conn.release();
      res.json({ message: 'Order deleted successfully' });
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ error: txErr.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;