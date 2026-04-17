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

const isPharmacy = (req, res, next) => {
  if (!['super_admin', 'pharmacy_admin'].includes(req.user.account_type)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ===== Helper =====

// دالة للتحقق إنه السلة تبع الصيدلية
const verifyCartOwnership = async (cartId, userId) => {
  const [relation] = await pool.query(
    `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`, [userId]
  );
  if (relation.length === 0) return false;

  const pharmacyId = relation[0].pharmacy_id;
  const [cart] = await pool.query(
    `SELECT id FROM carts WHERE id = ? AND pharmacy_id = ?`, [cartId, pharmacyId]
  );
  return cart.length > 0;
};

// ===== Routes =====

// إنشاء سلة جديدة — فقط pharmacy_admin
router.post('/', verifyToken, isPharmacy, async (req, res) => {
  try {
    // جيب pharmacy_id من العلاقة
    const [relation] = await pool.query(
      `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`, [req.user.id]
    );
    if (relation.length === 0) {
      return res.status(403).json({ message: 'Not linked to any pharmacy' });
    }

    const pharmacyId = relation[0].pharmacy_id;

    // إنشاء سلة جديدة
    const [result] = await pool.query(
      `INSERT INTO carts (pharmacy_id, status) VALUES (?, 'active')`,
      [pharmacyId]
    );

    res.status(201).json({ 
      message: 'Cart created successfully', 
      cartId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب سلات الصيدلية
router.get('/', verifyToken, isPharmacy, async (req, res) => {
  try {
    const [relation] = await pool.query(
      `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`, [req.user.id]
    );
    if (relation.length === 0) {
      return res.status(403).json({ message: 'Not linked to any pharmacy' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM carts WHERE pharmacy_id = ?`, [relation[0].pharmacy_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// إضافة منتج للسلة — لو موجود بتجمع الكمية
router.post('/:cartId/items', verifyToken, isPharmacy, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'product_id and quantity are required' });
    }

    // تحقق إنه السلة تبع الصيدلية
    const isOwner = await verifyCartOwnership(cartId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // تحقق إنه السلة لسا active
    const [cart] = await pool.query(
      `SELECT status FROM carts WHERE id = ?`, [cartId]
    );
    if (cart[0].status !== 'active') {
      return res.status(400).json({ message: 'Cart is already ordered' });
    }

    // تحقق إنه المنتج موجود وفيه كمية كافية
    const [product] = await pool.query(
      `SELECT id, price, stock_quantity FROM products WHERE id = ?`, [product_id]
    );
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product[0].stock_quantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock, available: ${product[0].stock_quantity}` 
      });
    }

    // لو المنتج موجود بالسلة — جمّع الكمية
    const [existingItem] = await pool.query(
      `SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?`,
      [cartId, product_id]
    );

    if (existingItem.length > 0) {
      const newQuantity = existingItem[0].quantity + parseInt(quantity);

      // تحقق من المخزون بعد الجمع
      if (product[0].stock_quantity < newQuantity) {
        return res.status(400).json({ 
          message: `Insufficient stock, available: ${product[0].stock_quantity}` 
        });
      }

      await pool.query(
        `UPDATE cart_items SET quantity = ?, price = ? WHERE id = ?`,
        [newQuantity, product[0].price, existingItem[0].id]
      );

      return res.json({ message: 'Item quantity updated', quantity: newQuantity });
    }

    // لو مش موجود — أضفه
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
      [cartId, product_id, quantity, product[0].price]
    );

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب محتويات السلة
router.get('/:cartId/items', verifyToken, isPharmacy, async (req, res) => {
  try {
    const { cartId } = req.params;

    // تحقق إنه السلة تبع الصيدلية
    const isOwner = await verifyCartOwnership(cartId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [rows] = await pool.query(
      `SELECT ci.id, ci.quantity, ci.price,
              p.name, p.stock_quantity,
              (ci.quantity * ci.price) as subtotal
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    // احسب المجموع الكلي
    const total = rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({ items: rows, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف منتج من السلة
router.delete('/:cartId/items/:itemId', verifyToken, isPharmacy, async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    // تحقق إنه السلة تبع الصيدلية
    const isOwner = await verifyCartOwnership(cartId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // تحقق إنه الصنف موجود
    const [item] = await pool.query(
      `SELECT id FROM cart_items WHERE id = ? AND cart_id = ?`, [itemId, cartId]
    );
    if (item.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await pool.query(`DELETE FROM cart_items WHERE id = ?`, [itemId]);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تفضية السلة كلها
router.delete('/:cartId/items', verifyToken, isPharmacy, async (req, res) => {
  try {
    const { cartId } = req.params;

    // تحقق إنه السلة تبع الصيدلية
    const isOwner = await verifyCartOwnership(cartId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checkout — تحويل السلة لطلبية
router.post('/:cartId/checkout', verifyToken, isPharmacy, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ message: 'company_id is required' });
    }

    // تحقق إنه السلة تبع الصيدلية
    const isOwner = await verifyCartOwnership(cartId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // جيب محتويات السلة
    const [items] = await pool.query(
      `SELECT ci.product_id, ci.quantity, ci.price,
              p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // جيب pharmacy_id
    const [relation] = await pool.query(
      `SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?`, [req.user.id]
    );
    const pharmacyId = relation[0].pharmacy_id;

    // إنشاء الطلبية
    const [order] = await pool.query(
      `INSERT INTO orders (pharmacy_id, company_id, status) VALUES (?, ?, 'pending')`,
      [pharmacyId, company_id]
    );

    const orderId = order.insertId;

    // نقل المنتجات من السلة للطلبية + تخفيض المخزون
    for (const item of items) {
      // أضف للطلبية
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // خفّض المخزون
      await pool.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // فضّي السلة وغيّر حالتها
    await pool.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
    await pool.query(
      `UPDATE carts SET status = 'ordered' WHERE id = ?`, [cartId]
    );

    res.status(201).json({ 
      message: 'Order created successfully', 
      orderId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;