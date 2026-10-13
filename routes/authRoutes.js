const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Register
router.post('/register', async (req, res) => {
    try {
        const exists = await User.findOne({ username: req.body.username });
        if (exists) return res.status(400).json({ error: "Username already taken" });

        const hash = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            password: hash,
            role: req.body.role || 'student'
        });
        await user.save();
        res.json({ message: "User created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return res.status(401).json({ error: "User not found" });

        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) return res.status(401).json({ error: "Wrong password" });

        req.session.user = { _id: user._id, username: user.username, role: user.role };
        res.json({ role: user.role, userId: user._id, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

// Session check
router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: "Not logged in" });
    }
});

module.exports = router;
