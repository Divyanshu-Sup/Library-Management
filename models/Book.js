const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    quantity: Number
});

module.exports = mongoose.model('Book', bookSchema);