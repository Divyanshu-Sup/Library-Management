const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Issue = require('../models/Issue');

// ── Books ────────────────────────────────────────────────────────────────────

// GET all books
router.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD book
router.post('/books', async (req, res) => {
    try {
        const book = new Book(req.body);
        await book.save();
        res.json({ message: "Book Added", book });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE book
router.put('/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Book Updated", book });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE book
router.delete('/books/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: "Book Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEARCH book
router.get('/books/search', async (req, res) => {
    try {
        const q = req.query.q;
        const books = await Book.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } }
            ]
        });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Issue / Return ────────────────────────────────────────────────────────────

// Issue book (decrements quantity)
router.post('/issue', async (req, res) => {
    try {
        const book = await Book.findById(req.body.bookId);
        if (!book) return res.status(404).json({ error: "Book not found" });
        if (book.quantity < 1) return res.status(400).json({ error: "No copies available" });

        const issue = new Issue({
            user: req.body.userId,
            book: req.body.bookId
        });
        await issue.save();

        book.quantity -= 1;
        await book.save();

        res.json({ message: "Book Issued", issue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Return book (increments quantity)
router.post('/return', async (req, res) => {
    try {
        const issue = await Issue.findById(req.body.issueId);
        if (!issue) return res.status(404).json({ error: "Issue record not found" });
        if (issue.returned) return res.status(400).json({ error: "Already returned" });

        issue.returned = true;
        issue.returnDate = new Date();
        await issue.save();

        await Book.findByIdAndUpdate(issue.book, { $inc: { quantity: 1 } });

        res.json({ message: "Book Returned" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get issued books for a user
router.get('/issued/:userId', async (req, res) => {
    try {
        const data = await Issue.find({ user: req.params.userId, returned: false })
            .populate('book');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all active issues (admin)
router.get('/issues/all', async (req, res) => {
    try {
        const data = await Issue.find({ returned: false })
            .populate('book')
            .populate('user', 'username');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users (admin)
router.get('/users', async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find({ role: 'student' }, 'username _id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
