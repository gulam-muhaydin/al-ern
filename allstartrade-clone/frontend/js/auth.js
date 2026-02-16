
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
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result));
                    window.location.href = 'dashboard.html';
                } else {
                    alert(result.message || 'Login failed');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Ensure the backend server is running on port 3000.');
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
                alert("Passwords do not match!");
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
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result));
                    
                    alert('Registration successful! Redirecting to dashboard...');
                    window.location.href = 'dashboard.html';
                } else {
                    alert(result.message || 'Registration failed');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Ensure the backend server is running on port 3000.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
