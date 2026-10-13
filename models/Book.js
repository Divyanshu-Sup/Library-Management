const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    author: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    quantity: { type: Number, required: true, min: 0, validate: Number.isInteger }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
