const test = require('node:test');
const assert = require('node:assert/strict');
const Book = require('../models/Book');
const User = require('../models/User');
const Issue = require('../models/Issue');

test('Book requires a title and author and a non-negative integer quantity', () => {
    assert.ok(new Book({ title: '', author: 'Author', quantity: 1 }).validateSync());
    assert.ok(new Book({ title: 'Book', author: '', quantity: 1 }).validateSync());
    assert.ok(new Book({ title: 'Book', author: 'Author', quantity: -1 }).validateSync());
    assert.ok(new Book({ title: 'Book', author: 'Author', quantity: 1.5 }).validateSync());
    assert.equal(new Book({ title: 'Book', author: 'Author', quantity: 0 }).validateSync(), undefined);
});

test('User schema accepts only the student and admin roles', () => {
    const valid = new User({ username: 'student01', password: 'hashed-password', role: 'student' });
    assert.equal(valid.validateSync(), undefined);
    const invalid = new User({ username: 'student02', password: 'hashed-password', role: 'superadmin' });
    assert.ok(invalid.validateSync());
});

test('Issue schema requires user and book references', () => {
    assert.ok(new Issue({}).validateSync());
});
