// ====== LOAD ENV VARIABLES ======
require('dotenv').config();

// ====== IMPORTS ======
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ====== APP CONFIG ======
const app = express();
const PORT = process.env.PORT || 5000; // ✅ declared once

// ====== CREATE UPLOADS FOLDER IF NOT EXISTS ======
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir)); // serve uploaded files
app.use(express.static(path.join(__dirname, 'public')));

// ====== MONGODB CONNECTION ======
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
});

// ====== MODELS ======
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

const stockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: String,
    purchasePrice: Number,
    quantity: Number
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Stock = mongoose.model('Stock', stockSchema);

// ====== AUTH MIDDLEWARE ======
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: '❌ No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: '❌ Invalid or expired token' });
        req.user = user;
        next();
    });
}

// ====== MULTER SETUP ======
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ====== ROUTES ======

// Root check
app.get('/', (req, res) => {
    res.json({ message: '✅ API is running...' });
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: '❌ Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '❌ Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.json({ message: '✅ User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: '❌ Server error', error: err.message });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: '❌ Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: '❌ User not found' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: '❌ Invalid password' });

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ message: '❌ Server error', error: err.message });
    }
});

// Add New Stock
app.post('/api/stock', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { name, purchasePrice, quantity } = req.body;
        const newStock = new Stock({
            name,
            image: req.file ? `/uploads/${req.file.filename}` : '',
            purchasePrice,
            quantity
        });
        await newStock.save();
        res.json({ message: '✅ Stock added successfully' });
    } catch (err) {
        res.status(500).json({ message: '❌ Server error', error: err.message });
    }
});

// Get All Stock
app.get('/api/stock', authenticateToken, async (req, res) => {
    try {
        const stock = await Stock.find();
        res.json(stock);
    } catch (err) {
        res.status(500).json({ message: '❌ Server error', error: err.message });
    }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
