async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');
    const button = document.getElementById('loginBtn');

    errorMsg.textContent = '';
    if (!username || !password) {
        errorMsg.textContent = 'Enter your username and password.';
        return;
    }

    button.disabled = true;
    try {
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
            errorMsg.textContent = data.error || 'Login failed.';
            return;
        }
        // The server-side session cookie is the source of authentication.
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('role', data.role);
        window.location.replace(data.role === 'admin' ? '/admin.html' : '/student.html');
    } catch (err) {
        errorMsg.textContent = 'Could not connect to the server. Try again.';
    } finally {
        button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') login();
    });
});
