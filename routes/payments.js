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
  if (!['super_admin', 'company_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// إنشاء دفعة — الصيدلية بتدفع
router.post('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { order_id, payment_method, amount } = req.body;

    // Validation
    if (!order_id || !payment_method || !amount) {
      return res.status(400).json({ message: 'order_id, payment_method, amount are required' });
    }

    // تحقق إنه طريقة الدفع صحيحة
    if (!['cash_on_delivery', 'visa', 'bank_transfer', 'check'].includes(payment_method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // جيب تفاصيل الطلبية
    const [orders] = await pool.query(
      `SELECT o.*, 
              SUM(oi.price * oi.quantity) as total_amount
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = ?
       GROUP BY o.id`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // لو pharmacy_admin — تحقق إنه الطلبية تبعته هو
    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ? AND pharmacy_id = ?`,
        [req.user.id, order.pharmacy_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // تحقق إنه الطلبية ما فيها دفعة مسبقاً
    const [existingPayment] = await pool.query(
      `SELECT id FROM payments WHERE order_id = ?`, [order_id]
    );
    if (existingPayment.length > 0) {
      return res.status(409).json({ message: 'Payment already exists for this order' });
    }

    // ===== التحقق التلقائي من المبلغ =====
    const orderTotal = parseFloat(order.total_amount);
    const paidAmount = parseFloat(amount);
    const paymentStatus = Math.abs(paidAmount - orderTotal) < 0.01 ? 'paid' : 'failed';

    // سجل الدفعة
    const [result] = await pool.query(
      `INSERT INTO payments (order_id, payment_method, payment_status, amount) 
       VALUES (?, ?, ?, ?)`,
      [order_id, payment_method, paymentStatus, paidAmount]
    );

    // لو الدفع نجح — حدّث حالة الطلبية تلقائياً
    if (paymentStatus === 'paid') {
      await pool.query(
        `UPDATE orders SET status = 'approved' WHERE id = ?`,
        [order_id]
      );
    }

    res.status(201).json({ 
      message: paymentStatus === 'paid' 
        ? 'Payment successful, order approved!' 
        : 'Payment failed, amount does not match order total',
      paymentId: result.insertId,
      payment_status: paymentStatus,
      order_total: orderTotal,
      paid_amount: paidAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب كل الدفعات — حسب الصلاحية
router.get('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    // super_admin — يشوف كل شي
    if (req.user.account_type === 'super_admin') {
      const [rows] = await pool.query(`SELECT * FROM payments`);
      return res.json(rows);
    }

    // company_admin — يشوف بس الدفعات المتعلقة بشركته
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`,
        [req.user.id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Not linked to any company' });
      }

      const [rows] = await pool.query(
        `SELECT p.* FROM payments p
         JOIN orders o ON p.order_id = o.id
         WHERE o.company_id = ?`,
        [relation[0].company_id]
      );
      return res.json(rows);
    }

    // pharmacy_admin — يشوف بس فواتيره هو
    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`,
        [req.user.id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Not linked to any pharmacy' });
      }

      const [rows] = await pool.query(
        `SELECT p.* FROM payments p
         JOIN orders o ON p.order_id = o.id
         WHERE o.pharmacy_id = ?`,
        [relation[0].pharmacy_id]
      );
      return res.json(rows);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب دفعة واحدة
router.get('/:id', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT p.*, o.pharmacy_id, o.company_id 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = rows[0];

    // تحقق من الصلاحية
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, payment.company_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (req.user.account_type === 'pharmacy_admin') {
      const [relation] = await pool.query(
        `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ? AND pharmacy_id = ?`,
        [req.user.id, payment.pharmacy_id]
      );
      if (relation.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب ملخص الحساب بين شركة وصيدلية
router.get('/summary/:pharmacyId/:companyId', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { pharmacyId, companyId } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        COUNT(p.id) as total_invoices,
        SUM(p.amount) as total_paid,
        SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN p.payment_status = 'pending' THEN p.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN p.payment_status = 'failed' THEN p.amount ELSE 0 END) as failed_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.pharmacy_id = ? AND o.company_id = ?`,
      [pharmacyId, companyId]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;