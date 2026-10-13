function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function showSection(name, el) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const section = document.getElementById('sec-' + name);
    if (section) section.classList.add('active');
    if (el) el.classList.add('active');
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = name.charAt(0).toUpperCase() + name.slice(1);
}

async function apiFetch(url, options = {}) {
    const response = await fetch('/api' + url, {
        credentials: 'same-origin',
        ...options,
        headers: { ...(options.headers || {}) }
    });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
        window.location.replace('/login.html');
        throw new Error(data.error || 'Access denied.');
    }
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
}

function setTableMessage(id, message) {
    const table = document.getElementById(id);
    if (table) table.innerHTML = '<tr><td>' + escapeHtml(message) + '</td></tr>';
}

async function loadDashboard() {
    try {
        const books = await apiFetch('/books');
        const copies = books.reduce((sum, book) => sum + Number(book.quantity || 0), 0);
        document.getElementById('statTotal').textContent = books.length;
        document.getElementById('statCopies').textContent = copies;
        document.getElementById('statAvail').textContent = copies;
        const recent = document.getElementById('dashBookTable');
        recent.innerHTML = books.slice(0, 5).map(book =>
            '<tr><td>' + escapeHtml(book.title) + '</td><td>' + escapeHtml(book.author) +
            '</td><td>' + escapeHtml(book.quantity) + '</td></tr>').join('');
        const issues = await apiFetch('/issues/all');
        document.getElementById('statIssued').textContent = issues.length;
        document.getElementById('statAvail').textContent = Math.max(0, copies);
    } catch (err) {
        console.error(err);
    }
}

async function loadBooks() {
    try {
        const books = await apiFetch('/books');
        const table = document.getElementById('bookTable');
        table.innerHTML = books.length ? books.map(book =>
            '<tr><td>' + escapeHtml(book.title) + '</td><td>' + escapeHtml(book.author) +
            '</td><td>' + escapeHtml(book.quantity) + '</td></tr>').join('')
            : '<tr><td colspan="3">No books added yet.</td></tr>';
        const select = document.getElementById('issueBookId');
        if (select) select.innerHTML = '<option value="">Select a book</option>' + books
            .filter(book => book.quantity > 0)
            .map(book => '<option value="' + escapeHtml(book._id) + '">' +
                escapeHtml(book.title) + ' (' + escapeHtml(book.quantity) + ' available)</option>').join('');
    } catch (err) {
        setTableMessage('bookTable', err.message);
    }
}

async function loadUsers() {
    try {
        const users = await apiFetch('/users');
        const select = document.getElementById('issueUserId');
        if (select) select.innerHTML = '<option value="">Select a student</option>' + users
            .map(user => '<option value="' + escapeHtml(user._id) + '">' + escapeHtml(user.username) + '</option>').join('');
    } catch (err) {
        console.error(err);
    }
}

async function loadIssues() {
    try {
        const issues = await apiFetch('/issues/all');
        const table = document.getElementById('issueTable');
        table.innerHTML = issues.length ? issues.map(issue =>
            '<tr><td>' + escapeHtml(issue.book?.title || 'Book unavailable') + '</td><td>' +
            escapeHtml(issue.user?.username || 'Unknown student') + '</td><td>' +
            escapeHtml(issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : '') +
            '</td><td><button type="button" onclick="returnBook(\'' + escapeHtml(issue._id) + '\')">Return</button></td></tr>'
        ).join('') : '<tr><td colspan="4">No active issues.</td></tr>';
    } catch (err) {
        setTableMessage('issueTable', err.message);
    }
}

async function addBook() {
    const title = document.getElementById('addTitle').value.trim();
    const author = document.getElementById('addAuthor').value.trim();
    const quantity = Number(document.getElementById('addQty').value);
    try {
        await apiFetch('/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, quantity })
        });
        alert('Book added.');
        document.getElementById('addTitle').value = '';
        document.getElementById('addAuthor').value = '';
        document.getElementById('addQty').value = '';
        await Promise.all([loadBooks(), loadDashboard()]);
    } catch (err) {
        alert(err.message);
    }
}

async function issueBook() {
    const userId = document.getElementById('issueUserId').value;
    const bookId = document.getElementById('issueBookId').value;
    if (!userId || !bookId) return alert('Select a student and a book.');
    try {
        await apiFetch('/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId })
        });
        alert('Book issued.');
        await Promise.all([loadBooks(), loadIssues(), loadDashboard()]);
    } catch (err) {
        alert(err.message);
    }
}

async function returnBook(issueId) {
    if (!confirm('Mark this book as returned?')) return;
    try {
        await apiFetch('/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issueId })
        });
        await Promise.all([loadBooks(), loadIssues(), loadDashboard()]);
    } catch (err) {
        alert(err.message);
    }
}

async function logout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
    sessionStorage.clear();
    window.location.replace('/login.html');
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/auth/me', { credentials: 'same-origin' });
        const me = await response.json();
        if (!response.ok || me.role !== 'admin') return window.location.replace('/login.html');
        const topbar = document.querySelector('.topbar');
        const logoutButton = document.createElement('button');
        logoutButton.type = 'button';
        logoutButton.textContent = 'Log out';
        logoutButton.addEventListener('click', logout);
        topbar?.appendChild(logoutButton);
        await Promise.all([loadDashboard(), loadBooks(), loadUsers(), loadIssues()]);
    } catch (err) {
        console.error(err);
        window.location.replace('/login.html');
    }
});
