
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form[action="/login"]');
    const registerForm = document.querySelector('form[action="/register"]');

    // Determine API Base URL
    // If running on localhost:5500 (Live Server), point to localhost:3000
    // Otherwise (Vercel or localhost:3000), use relative path
    const getApiUrl = (endpoint) => {
        if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
            if (window.location.port === '5500' || window.location.port === '5501') {
                return `http://localhost:3000${endpoint}`;
            }
        }
        return endpoint;
    };

    const showPopup = (message, type = 'info') => {
        const existing = document.getElementById('ast-popup');
        if (existing) existing.remove();
        const popup = document.createElement('div');
        popup.id = 'ast-popup';
        popup.textContent = message;
        const colors = {
            success: '#1ECBA1',
            error: '#E63946',
            info: '#FFA000'
        };
        const border = colors[type] || colors.info;
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.right = '20px';
        popup.style.zIndex = '99999';
        popup.style.background = 'rgba(2,6,23,0.95)';
        popup.style.color = '#fff';
        popup.style.border = `1px solid ${border}`;
        popup.style.padding = '12px 16px';
        popup.style.borderRadius = '10px';
        popup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
        popup.style.fontWeight = '700';
        popup.style.maxWidth = '320px';
        popup.style.fontSize = '14px';
        popup.style.lineHeight = '1.4';
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(-6px)';
        popup.style.transition = 'opacity .2s ease, transform .2s ease';
        document.body.appendChild(popup);
        requestAnimationFrame(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-6px)';
            setTimeout(() => popup.remove(), 220);
        }, 2600);
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerText = 'Please wait...';

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            // The backend expects 'email' but form might have 'username'
            if (data.username && !data.email) {
                data.email = data.username; 
            }

            try {
                const response = await fetch(getApiUrl('/api/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('token', result.token);
                    sessionStorage.setItem('user', JSON.stringify(result));
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'dashboard.html';
                } else {
                    showPopup(result.message || 'Login failed', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (error) {
                console.error('Login error:', error);
                showPopup('An error occurred during login. Ensure the backend server is running on port 3000.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    if (registerForm) {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get('ref') || params.get('referrer') || '';
        const refInput = registerForm.querySelector('input[name="referrer"]');
        if (refInput && refParam) {
            refInput.value = refParam;
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('registerBtn') || registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerText = 'Please wait...';

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password_confirmation && data.password !== data.password_confirmation) {
                showPopup('Passwords do not match!', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            if (data.username && !data.name) {
                data.name = data.username;
            }

            if (!data.email) {
                if (data.phone) {
                    data.email = data.phone;
                } else if (data.username) {
                    data.email = data.username;
                }
            }
            if (!data.referrer && refParam) {
                data.referrer = refParam;
            }

            try {
                const response = await fetch(getApiUrl('/api/register'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('token', result.token);
                    sessionStorage.setItem('user', JSON.stringify(result));
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    showPopup('Registration successful! Redirecting to dashboard...', 'success');
                    window.location.href = 'dashboard.html';
                } else {
                    showPopup(result.message || 'Registration failed', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (error) {
                console.error('Registration error:', error);
                showPopup('An error occurred during registration. Ensure the backend server is running on port 3000.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
