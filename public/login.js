async function login() {
const username = document.getElementById('username').value.trim();
const password = document.getElementById('password').value;

```
const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});

const data = await res.json();

if (!res.ok) {
    document.getElementById('errorMsg').innerText = data.error;
    return;
}

sessionStorage.setItem('userId', data.userId);
sessionStorage.setItem('username', data.username);
sessionStorage.setItem('role', data.role);

if (data.role === 'admin') {
    window.location.href = 'admin.html';
} else {
    window.location.href = 'student.html';
}
```

}
