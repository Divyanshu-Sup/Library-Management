const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware MUST come before routes
app.use(session({
    secret: 'pustakshala_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Serve static files
app.use(express.static('public'));

// Connect MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/pustakshala')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("DB Error:", err));

// Routes
app.use('/api', require('./routes/apiRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
