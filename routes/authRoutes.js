const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

function validUsername(username) {
    return typeof username === 'string' && /^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim());
}

// Public registration can create students only. Create administrators with: npm run create-admin.
router.post('/register', async (req, res) => {
    try {
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const password = req.body.password;

        if (!validUsername(username)) {
            return res.status(400).json({ error: 'Username must be 3–30 characters and use letters, numbers, _, ., or -.' });
        }
        if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
            return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
        }

        const exists = await User.findOne({ username });
        if (exists) return res.status(409).json({ error: 'Username already taken.' });

        const user = await User.create({
            username,
            password: await bcrypt.hash(password, 12),
            role: 'student'
        });
        return res.status(201).json({ message: 'Account created. You can now log in.', userId: user._id });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Username already taken.' });
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Could not create account.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const password = req.body.password;
        if (!username || typeof password !== 'string' || password.length > 72) {
            return res.status(400).json({ error: 'Enter a valid username and password.' });
        }

        const user = await User.findOne({ username }).select('+password');
        const valid = user && await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid username or password.' });

        // Rotate the session ID after authentication to reduce session-fixation risk.
        req.session.regenerate(err => {
            if (err) {
                console.error('Session error:', err);
                return res.status(500).json({ error: 'Could not start session.' });
            }
            req.session.user = { _id: String(user._id), username: user.username, role: user.role };
            req.session.save(saveErr => {
                if (saveErr) return res.status(500).json({ error: 'Could not save session.' });
                return res.json({ role: user.role, userId: String(user._id), username: user.username });
            });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Could not log in.' });
    }
});

router.post('/logout', (req, res) => {
    if (!req.session) return res.json({ message: 'Logged out.' });
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Could not log out.' });
        res.clearCookie('pustakshala.sid', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        res.json({ message: 'Logged out.' });
    });
});

router.get('/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
    res.json(req.session.user);
});

module.exports = router;
