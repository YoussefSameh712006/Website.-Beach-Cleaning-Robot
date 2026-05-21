const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname)));

// إنشاء والاتصال بقاعدة البيانات
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Database Connection Error:', err.message);
    } else {
        console.log('Database connected successfully.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            phone TEXT,
            serial TEXT
        )`);
    }
});

// --- تعديل مسارات عرض الصفحات الثابتة لربطها بالأسماء الجديدة ---
app.get('/', (req, res) => {
    // التعديل هنا: خليه يقرأ index.html مباشرة بدل الاسم القديم index2
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'login.html'));
});

app.get('/C1.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'C1.html'));
});


// --- مسار استقبال بيانات إنشاء الحساب الجديد ---
app.post('/api/signup', (req, res) => {
    const { username, email, password, phone, serial } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, target: 'general', message: 'برجاء ملء الخانات الأساسية!' });
    }
    
    const checkQuery = `SELECT email, password, serial FROM users WHERE email = ? OR password = ? OR serial = ?`;
    db.get(checkQuery, [email, password, serial], (err, row) => {
        if (err) return res.status(500).json({ success: false, target: 'general', message: 'حدث خطأ في السيرفر!' });
        
        if (row) {
            if (row.email === email) return res.status(400).json({ success: false, target: 'email', message: 'البريد الإلكتروني هذا متغير أو مسجل بالفعل!' });
            if (row.password === password) return res.status(400).json({ success: false, target: 'password', message: 'كلمة السر المستخدمة مسجلة مع حساب آخر!' });
            if (row.serial === serial) return res.status(400).json({ success: false, target: 'serial', message: 'الرقم السلسلي للروبوت مسجل مع حساب آخر بالفعل!' });
        }
        
        const insertQuery = `INSERT INTO users (username, email, password, phone, serial) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertQuery, [username, email, password, phone, serial], function(err) {
            if (err) return res.status(500).json({ success: false, target: 'general', message: 'حدث خطأ أثناء حفظ البيانات!' });
            return res.json({ success: true });
        });
    });
});


// --- مسار استقبال بيانات تسجيل الدخول وفحصها ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, target: 'general', message: 'برجاء ملء جميع البيانات المطلوب إدخالها!' });
    }
    
    const checkMailQuery = `SELECT * FROM users WHERE email = ?`;
    db.get(checkMailQuery, [email], (err, row) => {
        if (err) return res.status(500).json({ success: false, target: 'general', message: 'حدث خطأ في السيرفر!' });
        
        if (!row) {
            return res.status(404).json({ success: false, target: 'email', message: 'البريد الإلكتروني الذي قمت بإدخاله غير مسجل لدينا!' });
        }
        
        if (row.password !== password) {
            return res.status(400).json({ success: false, target: 'password', message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى!' });
        }
        
        return res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running successfully on port: ${PORT}`);
});
