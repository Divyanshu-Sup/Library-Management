const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Issue = require('../models/Issue');
const User = require('../models/User');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session?.user) return res.status(401).json({ error: 'Please log in first.' });
    next();
}
function requireAdmin(req, res, next) {
    if (!req.session?.user) return res.status(401).json({ error: 'Please log in first.' });
    if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
    next();
}
function validId(id) {
    return typeof id === 'string' && mongoose.isValidObjectId(id);
}
function validationError(err) {
    return err && (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000);
}

router.get('/books/search', requireAuth, async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (!q) return res.json([]);
    try {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const books = await Book.find({
            $or: [
                { title: { $regex: escaped, $options: 'i' } },
                { author: { $regex: escaped, $options: 'i' } }
            ]
        }).limit(100);
        res.json(books);
    } catch (err) {
        console.error('Book search error:', err);
        res.status(500).json({ error: 'Could not search books.' });
    }
});

router.get('/books', requireAuth, async (req, res) => {
    try {
        res.json(await Book.find().sort({ title: 1 }).limit(500));
    } catch (err) {
        console.error('List books error:', err);
        res.status(500).json({ error: 'Could not load books.' });
    }
});

router.post('/books', requireAdmin, async (req, res) => {
    try {
        const { title, author, quantity } = req.body;
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) return res.status(400).json({ error: 'Title is required and must be at most 200 characters.' });
        if (typeof author !== 'string' || !author.trim() || author.trim().length > 120) return res.status(400).json({ error: 'Author is required and must be at most 120 characters.' });
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000) return res.status(400).json({ error: 'Quantity must be a whole number between 0 and 100000.' });
        const book = await Book.create({ title: title.trim(), author: author.trim(), quantity });
        res.status(201).json({ message: 'Book added.', book });
    } catch (err) {
        console.error('Add book error:', err);
        res.status(validationError(err) ? 400 : 500).json({ error: validationError(err) ? 'Invalid book details.' : 'Could not add book.' });
    }
});

router.put('/books/:id', requireAdmin, async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid book ID.' });
    const updates = {};
    const { title, author, quantity } = req.body;
    if (title !== undefined) {
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) return res.status(400).json({ error: 'Invalid title.' });
        updates.title = title.trim();
    }
    if (author !== undefined) {
        if (typeof author !== 'string' || !author.trim() || author.trim().length > 120) return res.status(400).json({ error: 'Invalid author.' });
        updates.author = author.trim();
    }
    if (quantity !== undefined) {
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000) return res.status(400).json({ error: 'Quantity must be a whole number between 0 and 100000.' });
        updates.quantity = quantity;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Provide at least one valid field to update.' });
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
        if (!book) return res.status(404).json({ error: 'Book not found.' });
        res.json({ message: 'Book updated.', book });
    } catch (err) {
        console.error('Update book error:', err);
        res.status(validationError(err) ? 400 : 500).json({ error: validationError(err) ? 'Invalid book details.' : 'Could not update book.' });
    }
});

router.delete('/books/:id', requireAdmin, async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid book ID.' });
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ error: 'Book not found.' });
        res.json({ message: 'Book deleted.' });
    } catch (err) {
        console.error('Delete book error:', err);
        res.status(500).json({ error: 'Could not delete book.' });
    }
});

router.post('/issue', requireAdmin, async (req, res) => {
    const { bookId, userId } = req.body;
    if (!validId(bookId) || !validId(userId)) return res.status(400).json({ error: 'Valid bookId and userId are required.' });
    try {
        const user = await User.findOne({ _id: userId, role: 'student' });
        if (!user) return res.status(404).json({ error: 'Student not found.' });
        const book = await Book.findOneAndUpdate({ _id: bookId, quantity: { $gte: 1 } }, { $inc: { quantity: -1 } }, { new: true });
        if (!book) {
            const exists = await Book.exists({ _id: bookId });
            return exists ? res.status(400).json({ error: 'No copies available.' }) : res.status(404).json({ error: 'Book not found.' });
        }
        try {
            const issue = await Issue.create({ user: userId, book: bookId });
            return res.status(201).json({ message: 'Book issued.', issue });
        } catch (err) {
            await Book.updateOne({ _id: bookId }, { $inc: { quantity: 1 } });
            throw err;
        }
    } catch (err) {
        console.error('Issue book error:', err);
        res.status(validationError(err) ? 400 : 500).json({ error: validationError(err) ? 'Invalid issue details.' : 'Could not issue book.' });
    }
});

router.post('/return', requireAdmin, async (req, res) => {
    const { issueId } = req.body;
    if (!validId(issueId)) return res.status(400).json({ error: 'A valid issueId is required.' });
    try {
        const issue = await Issue.findOneAndUpdate({ _id: issueId, returned: false }, { $set: { returned: true, returnDate: new Date() } }, { new: true });
        if (!issue) {
            const exists = await Issue.exists({ _id: issueId });
            return exists ? res.status(409).json({ error: 'This book has already been returned.' }) : res.status(404).json({ error: 'Issue record not found.' });
        }
        const bookUpdate = await Book.updateOne({ _id: issue.book }, { $inc: { quantity: 1 } });
        if (bookUpdate.matchedCount === 0) {
            console.error('Returned issue references missing book:', String(issue.book));
            return res.status(500).json({ error: 'Return was recorded, but the book record is missing. Contact an administrator.' });
        }
        res.json({ message: 'Book returned.' });
    } catch (err) {
        console.error('Return book error:', err);
        res.status(500).json({ error: 'Could not return book.' });
    }
});

router.get('/issued/:userId', requireAuth, async (req, res) => {
    if (!validId(req.params.userId)) return res.status(400).json({ error: 'Invalid user ID.' });
    if (String(req.session.user._id) !== req.params.userId && req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'You can only view your own issued books.' });
    }
    try {
        res.json(await Issue.find({ user: req.params.userId, returned: false }).populate('book').sort({ issueDate: -1 }));
    } catch (err) {
        console.error('List issued books error:', err);
        res.status(500).json({ error: 'Could not load issued books.' });
    }
});

router.get('/issues/all', requireAdmin, async (req, res) => {
    try {
        res.json(await Issue.find({ returned: false }).populate('book').populate('user', 'username').sort({ issueDate: -1 }));
    } catch (err) {
        console.error('List issues error:', err);
        res.status(500).json({ error: 'Could not load issues.' });
    }
});

router.get('/users', requireAdmin, async (req, res) => {
    try {
        res.json(await User.find({ role: 'student' }).select('username').sort({ username: 1 }).limit(1000));
    } catch (err) {
        console.error('List users error:', err);
        res.status(500).json({ error: 'Could not load users.' });
    }
});

module.exports = router;
