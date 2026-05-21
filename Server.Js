const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname)));

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

app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'index2.html')));
app.get('/index2.html', (req, res) => res.sendFile(path.resolve(__dirname, 'index2.html')));
app.get('/login.html', (req, res) => res.sendFile(path.resolve(__dirname, 'login.html')));
app.get('/C1.html', (req, res) => res.sendFile(path.resolve(__dirname, 'C1.html')));
app.get('/c1.html', (req, res) => res.sendFile(path.resolve(__dirname, 'C1.html')));

// مسار استقبال بيانات الحساب الجديد مع فحص التكرار بدقة
app.post('/api/signup', (req, res) => {
    const { username, email, password, phone, serial } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, target: 'general', message: 'برجاء ملء الخانات الأساسية' });
    }
    const checkQuery = `SELECT email, password, serial FROM users WHERE email = ? OR password = ? OR serial = ?`;
    db.get(checkQuery, [email, password, serial], (err, row) => {
        if (err) return res.status(500).json({ success: false, target: 'general', message: 'حدث خطأ في السيرفر' });
        if (row) {
            if (row.email === email) return res.status(400).json({ success: false, target: 'email', message: 'خذ بالك البريد الإلكتروني ده متكرر ومسجل بالفعل!' });
            if (row.password === password) return res.status(400).json({ success: false, target: 'password', message: 'خذ بالك كلمة السر دي متكررة ومسجل بها حساب آخر!' });
            if (row.serial === serial && serial) return res.status(400).json({ success: false, target: 'serial', message: 'خذ بالك السيريال نمبر ده متكرر ومسجل مع جهاز آخر!' });
        }
        const insertQuery = `INSERT INTO users (username, email, password, phone, serial) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertQuery, [username, email, password, phone, serial], function(err) {
            if (err) return res.status(500).json({ success: false, target: 'general', message: 'حدث خطأ أثناء حفظ البيانات' });
            return res.json({ success: true });
        });
    });
});

// مسار تسجيل الدخول المحدث لتحديد الخطأ بدقة (إيميل أم باسورد)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // 1. نبحث أولاً بالإيميل لمعرفة هل هو مسجل أصلاً أم لا
    const checkEmailQuery = `SELECT * FROM users WHERE email = ?`;
    db.get(checkEmailQuery, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, target: 'general', message: 'حدث خطأ في السيرفر' });
        }
        if (!row) {
            return res.status(400).json({ success: false, target: 'email', message: 'خذ بالك البريد الإلكتروني ده غلط وغير مسجل!' });
        }
        
        // 2. إذا كان الإيميل صح، نقارن كلمة السر الخاصة به
        if (row.password !== password) {
            return res.status(400).json({ success: false, target: 'password', message: 'خذ بالك كلمة السر دي غلط!' });
        }

        // 3. إذا كان الاثنان صحاح
        return res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running successfully on port: ${PORT}`);
});