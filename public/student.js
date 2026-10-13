function showSection(name, el) {
document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
document.getElementById('sec-' + name).classList.add('active');
}

async function searchBrowse(q) {
const url = q ? `/api/books/search?q=${q}` : '/api/books';
const books = await fetch(url).then(r => r.json());

```
document.getElementById('browseGrid').innerHTML =
    books.map(b => `<div>${b.title}</div>`).join('');
```

}
