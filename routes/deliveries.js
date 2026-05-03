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
  if (!['super_admin', 'company_admin', 'delivery_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Routes =====

// 1. Get deliveries based on role
router.get('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    let query = `
      SELECT d.*, 
             o.pharmacy_id, o.company_id, o.status as order_status, o.total_amount,
             c.name as company_name, 
             ph.name as pharmacy_name, ph.phone as pharmacy_phone, ph.location as pharmacy_location,
             u.name as driver_name
      FROM deliveries d
      JOIN orders o ON d.order_id = o.id
      LEFT JOIN companies c ON o.company_id = c.id
      LEFT JOIN pharmacies ph ON o.pharmacy_id = ph.id
      LEFT JOIN users u ON d.driver_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.account_type === 'delivery_admin') {
      query += ` AND d.driver_id = ?`;
      params.push(req.user.id);
    } else if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ?`, [req.user.id]
      );
      if (relation.length === 0) return res.json([]);
      query += ` AND o.company_id = ?`;
      params.push(relation[0].company_id);
    }

    query += ` ORDER BY d.created_at DESC`;

    const [deliveries] = await pool.query(query, params);
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Assign Delivery (Company Admin or Super Admin)
router.post('/', verifyToken, isAuthenticated, async (req, res) => {
  try {
    if (!['super_admin', 'company_admin'].includes(req.user.account_type)) {
      return res.status(403).json({ message: 'Only companies and admins can assign deliveries' });
    }

    const { order_id, driver_id, notes } = req.body;
    if (!order_id || !driver_id) {
      return res.status(400).json({ message: 'order_id and driver_id are required' });
    }

    // Verify order exists and is approved
    const [order] = await pool.query(`SELECT id, status, company_id FROM orders WHERE id = ?`, [order_id]);
    if (order.length === 0) return res.status(404).json({ message: 'Order not found' });
    
    if (order[0].status !== 'approved') {
      return res.status(400).json({ message: 'Order must be approved before assigning to delivery' });
    }

    // If company admin, verify ownership
    if (req.user.account_type === 'company_admin') {
      const [relation] = await pool.query(
        `SELECT company_id FROM company_users WHERE user_id = ? AND company_id = ?`,
        [req.user.id, order[0].company_id]
      );
      if (relation.length === 0) return res.status(403).json({ message: 'Access denied to this order' });
    }

    // Verify driver exists
    const [driver] = await pool.query(`SELECT id FROM users WHERE id = ? AND account_type = 'delivery_admin'`, [driver_id]);
    if (driver.length === 0) return res.status(404).json({ message: 'Driver not found' });

    // Insert delivery record
    await pool.query(
      `INSERT INTO deliveries (order_id, driver_id, status, notes) VALUES (?, ?, 'assigned', ?)`,
      [order_id, driver_id, notes || null]
    );

    res.status(201).json({ message: 'Delivery assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Delivery Status (Driver)
router.put('/:id/status', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const [deliveryRows] = await pool.query(`SELECT * FROM deliveries WHERE id = ?`, [id]);
    if (deliveryRows.length === 0) return res.status(404).json({ message: 'Delivery not found' });
    const delivery = deliveryRows[0];

    // Drivers can update their own deliveries. Company admins could theoretically cancel, but let's restrict to drivers for simplicity.
    if (req.user.account_type === 'delivery_admin' && delivery.driver_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(
        `UPDATE deliveries SET status = ?, notes = COALESCE(?, notes) WHERE id = ?`,
        [status, notes || null, id]
      );

      // Status sync logic with orders
      if (status === 'accepted') {
        // Driver accepted. Order stays 'approved' until picked up, or we can just leave it as is.
      } else if (status === 'rejected') {
        // Driver rejected. Order stays 'approved', company must reassign.
      } else if (status === 'picked_up' || status === 'on_way') {
        // Driver picked it up. Order becomes 'shipped'
        await conn.query(`UPDATE orders SET status = 'shipped', shipped_at = NOW() WHERE id = ?`, [delivery.order_id]);
        if (status === 'picked_up') {
          await conn.query(`UPDATE deliveries SET picked_up_at = NOW() WHERE id = ?`, [id]);
        }
      } else if (status === 'delivered') {
        // Driver delivered it. Order becomes 'delivered'. 
        // Pharmacy still needs to confirm to make it 'completed'.
        await conn.query(`UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE id = ?`, [delivery.order_id]);
        await conn.query(`UPDATE deliveries SET delivered_at = NOW() WHERE id = ?`, [id]);
      } else if (status === 'failed') {
        // Driver failed to deliver (e.g. pharmacy closed). Order stays 'shipped' or we could add a failed state. Let's keep it simple.
      }

      await conn.commit();
      conn.release();
      res.json({ message: `Delivery status updated to ${status}` });
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ error: txErr.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get all available drivers for company assignment
router.get('/drivers', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const [drivers] = await pool.query(
      `SELECT u.id, u.name, u.entity_name as license 
       FROM users u 
       WHERE u.account_type = 'delivery_admin'`
    );
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
