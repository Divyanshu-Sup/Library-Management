function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function showSection(name, el) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const section = document.getElementById('sec-' + name);
    if (section) section.classList.add('active');
    document.querySelectorAll('.sidebar button').forEach(button => button.classList.remove('active'));
    if (el) el.classList.add('active');
}

async function studentFetch(url) {
    const response = await fetch(url, { credentials: 'same-origin' });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
        window.location.replace('/login.html');
        throw new Error('Please sign in again.');
    }
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
}

async function searchBrowse(query = '') {
    const url = query.trim()
        ? '/api/books/search?q=' + encodeURIComponent(query.trim())
        : '/api/books';
    const grid = document.getElementById('browseGrid');
    try {
        const books = await studentFetch(url);
        grid.innerHTML = books.length
            ? books.map(book => '<article class="book-card"><h3>' + escapeHtml(book.title) +
                '</h3><p>' + escapeHtml(book.author) + '</p><p>Available copies: ' +
                escapeHtml(book.quantity) + '</p></article>').join('')
            : '<p>No books found.</p>';
    } catch (err) {
        grid.textContent = err.message;
    }
}

async function loadMyBooks() {
    const table = document.getElementById('myBooksTable');
    try {
        const me = await studentFetch('/auth/me');
        const issues = await studentFetch('/api/issued/' + encodeURIComponent(me._id));
        table.innerHTML = issues.length ? issues.map(issue =>
            '<tr><td>' + escapeHtml(issue.book?.title || 'Book unavailable') +
            '</td><td>' + escapeHtml(issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : '') +
            '</td></tr>').join('') : '<tr><td colspan="2">You have no active books.</td></tr>';
    } catch (err) {
        table.innerHTML = '<tr><td>' + escapeHtml(err.message) + '</td></tr>';
    }
}

async function logout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
    sessionStorage.clear();
    window.location.replace('/login.html');
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const me = await studentFetch('/auth/me');
        if (me.role !== 'student') return window.location.replace('/admin.html');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Log out';
        button.addEventListener('click', logout);
        document.querySelector('.sidebar')?.appendChild(button);
        await searchBrowse();
        await loadMyBooks();
    } catch (err) {
        console.error(err);
    }
});
