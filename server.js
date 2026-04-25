require('dotenv').config(); // بيقرأ ملف .env عشان ياخد المتغيرات السرية زي JWT_SECRET
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// استدعاء الراوترات
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const pharmacyRoutes = require('./routes/pharmacies');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');

const app = express();

// ميدل وير
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// ربط الراوترات مع الامتداد الصحيح
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// معالجة أي مسار غير موجود
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// تشغيل السيرفر
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});