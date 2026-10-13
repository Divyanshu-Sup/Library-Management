function showSection(name, el) {
document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

document.getElementById('sec-' + name).classList.add('active');
el.classList.add('active');

document.getElementById('pageTitle').innerText = name;
}


async function apiFetch(url, options = {}) {
const res = await fetch('/api' + url, options);
return res.json();
}

// Dashboard
async function loadDashboard() {
const books = await apiFetch('/books');
document.getElementById('statTotal').innerText = books.length;
}

// Books
async function loadBooks() {
const books = await apiFetch('/books');
const table = document.getElementById('bookTable');

table.innerHTML = books.map(b => `<tr>
    <td>${b.title}</td>
    <td>${b.author}</td>
    <td>${b.quantity}</td>
</tr>`).join('');
}


// Add Book
async function addBook() {
const title = document.getElementById('addTitle').value;
const author = document.getElementById('addAuthor').value;
const quantity = parseInt(document.getElementById('addQty').value);

const res = await apiFetch('/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author, quantity })
});

if (res.error) return alert(res.error);

alert("Book added");
loadBooks();
}


// Issue
async function issueBook() {
const userId = document.getElementById('issueUserId').value;
const bookId = document.getElementById('issueBookId').value;

await apiFetch('/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bookId })
});

alert("Issued");
}


// Init
window.onload = () => {
loadDashboard();
loadBooks();
};
