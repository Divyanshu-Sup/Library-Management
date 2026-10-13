const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function main() {
    const username = process.env.ADMIN_USERNAME?.trim();
    const password = process.env.ADMIN_PASSWORD;
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pustakshala';

    if (!username || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
        throw new Error('Set ADMIN_USERNAME to 3–30 letters, numbers, _, . or -.');
    }
    if (!password || password.length < 12 || password.length > 72) {
        throw new Error('Set ADMIN_PASSWORD to a strong password between 12 and 72 characters.');
    }

    await mongoose.connect(mongoUri);
    const existing = await User.findOne({ username });
    if (existing) {
        throw new Error('That username already exists. Choose a new ADMIN_USERNAME; this script will not change an existing account.');
    }

    await User.create({
        username,
        password: await bcrypt.hash(password, 12),
        role: 'admin'
    });
    console.log('Administrator account created successfully.');
}

main()
    .catch(err => {
        console.error('Could not create administrator:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => {});
    });
