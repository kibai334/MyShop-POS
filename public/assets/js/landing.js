// 🧼 Block access to landing if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    if (username) {
      window.location.href = 'index1.html#dashboard';
    }
  });
  
  // 🎯 Login Logic
  const form = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-message');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      const data = await res.json();
  
      if (res.ok && data.success) {
        localStorage.setItem('username', username); // 💾 Store username
        window.location.href = 'index1.html#dashboard';
      } else {
        errorMsg.textContent = data.message || 'Login failed. Try again.';
      }
  
    } catch (err) {
      errorMsg.textContent = '🚫 Server error. Try again later.';
      console.error('Login error:', err);
    }
  });
  