const express = require('express'); // إطار العمل الأساسي
const bcrypt = require('bcryptjs'); // مكتبة تشفير الباسورد
const jwt = require('jsonwebtoken'); // مكتبة إنشاء والتحقق من التوكن
const pool = require('../db'); // الاتصال بقاعدة البيانات

const router = express.Router(); // بنعمل راوتر منفصل عشان نظم الكود

// ===== الحراس (Middleware) =====
// هاي الدوال بتشتغل قبل أي route عشان تتحقق من صلاحية المستخدم

// الحارس الأول — بيتحقق إنه المستخدم مسجل دخول وعنده توكن صالح
const verifyToken = (req, res, next) => {
  // بياخد التوكن من الهيدر — شكله: "Bearer eyJhbGc..."
  const token = req.headers['authorization']?.split(' ')[1];
  
  // مافي توكن؟ ارفض الطلب فوراً
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    // تحقق من صحة التوكن باستخدام المفتاح السري
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // احفظ بيانات المستخدم عشان نستخدمها بعدين في الكود
    req.user = decoded;
    // كمّل للـ route التالي
    next();
  } catch {
    // التوكن غلط أو منتهي الصلاحية
    return res.status(401).json({ message: 'Invalid token' });
  }
};  

// الحارس الثاني — بيتحقق إنه المستخدم هو super_admin
const isSuperAdmin = (req, res, next) => {
  // req.user جاي من الحارس الأول فوق
  if (req.user.account_type !== 'super_admin') {
    // مسجل دخول بس مش أدمن؟ ممنوع!
    return res.status(403).json({ message: 'Access denied' });
  }
  // هو أدمن؟ كمّل
  next();
};

// ===== الـ Routes =====

// إنشاء يوزر جديد — محمي بالحارسين، فقط super_admin يقدر ينشئ حسابات
router.post('/register', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, account_type } = req.body;

    // تحقق إنه مافي حقل فاضي
    if (!name || !email || !password || !account_type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // تحقق إنه نوع الحساب من الأنواع المسموحة بس
    if (!['super_admin', 'company_admin', 'pharmacy_admin'].includes(account_type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    // تحقق إنه الإيميل مش مسجل مسبقاً
    const [existing] = await pool.query(
      `SELECT id FROM users WHERE email = ?`, [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // شفّر الباسورد قبل الحفظ — الـ 10 هي قوة التشفير
    const hashedPassword = await bcrypt.hash(password, 10);

    // احفظ اليوزر الجديد في قاعدة البيانات
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, account_type, is_active) 
       VALUES (?, ?, ?, ?, 1)`, // is_active=1 يعني الحساب فعال تلقائياً
      [name, email, hashedPassword, account_type]
    );

    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.insertId // رجّع id اليوزر الجديد
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تسجيل طلب حساب جديد — مفتوح للعموم، يحتاج موافقة الأدمن
router.post('/public-register', async (req, res) => {
  try {
    const { name, email, password, account_type, phone, entity_name } = req.body;

    if (!name || !email || !password || !account_type || !phone || !entity_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['company_admin', 'pharmacy_admin'].includes(account_type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // is_active=0 يعني الحساب معلق حتى يوافق الأدمن
    await pool.query(
      `INSERT INTO users (name, email, password, account_type, phone, entity_name, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [name, email, hashedPassword, account_type, phone, entity_name]
    );

    res.status(201).json({
      message: 'Registration request submitted successfully. Our team will review your application and contact you within 24-48 hours.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تسجيل الدخول — مفتوح للكل بدون حراس
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // تحقق إنه الإيميل والباسورد موجودين
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // دور على اليوزر في قاعدة البيانات
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ?`, [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // تحقق إنه الحساب مو معطل
    if (user.is_active === 0) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // قارن الباسورد المكتوب مع الباسورد المشفر في قاعدة البيانات
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // كل شي تمام — اعمل توكن صالح لـ 8 ساعات
    const token = jwt.sign(
      { id: user.id, account_type: user.account_type }, // البيانات اللي داخل التوكن
      process.env.JWT_SECRET, // المفتاح السري من ملف .env
      { expiresIn: '8h' } // التوكن بينتهي بعد 8 ساعات
    );

    res.json({ 
      message: 'Login successful', 
      token, // ابعت التوكن للفرونت عشان يحفظه ويبعته مع كل طلب
      user: {
        id: user.id,
        name: user.name,
        account_type: user.account_type // مهم للفرونت عشان يعرف يوجهك لأي داشبورد
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب كل اليوزرات — فقط super_admin
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    // لاحظ ما حطينا password في الـ SELECT — أمان!
    const [rows] = await pool.query(
      `SELECT id, name, email, account_type, is_active, created_at FROM users`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب يوزر واحد بالـ id — فقط super_admin
// مثال: GET /api/users/5 بيجيب اليوزر رقم 5
router.get('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params; // ياخد الـ id من الـ URL
    const [rows] = await pool.query(
      `SELECT id, name, email, account_type, is_active, created_at FROM users WHERE id = ?`, [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تحديث يوزر — فقط super_admin
// مثال: PUT /api/users/5 بيعدل اليوزر رقم 5
router.put('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, account_type, is_active, password } = req.body;
    const { id } = req.params;

    // تحقق إنه اليوزر موجود أصلاً
    const [existing] = await pool.query(`SELECT id FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // لو بدو يغير نوع الحساب — تحقق إنه النوع صحيح
    if (account_type && !['super_admin', 'company_admin', 'pharmacy_admin'].includes(account_type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    // لو بعت باسورد جديد — شفّره قبل الحفظ
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name=?, email=?, account_type=?, is_active=?, password=? WHERE id=?`,
        [name, email, account_type, is_active, hashedPassword, id]
      );
    } else {
      // ما بعت باسورد — حدّث باقي البيانات بس وخلي الباسورد كما هو
      await pool.query(
        `UPDATE users SET name=?, email=?, account_type=?, is_active=? WHERE id=?`,
        [name, email, account_type, is_active, id]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف يوزر — فقط super_admin ومحمي من حذف نفسه
// مثال: DELETE /api/users/5 بيحذف اليوزر رقم 5
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // منع الأدمن من حذف حسابه هو — لو صار ما في أدمن يدير النظام!
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // تحقق إنه اليوزر موجود أصلاً
    const [existing] = await pool.query(`SELECT id FROM users WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(`DELETE FROM users WHERE id=?`, [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 