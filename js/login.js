document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = event.target.username.value;
    const password = event.target.password.value;
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = '';

    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // FIX: Use the full, absolute URL for the redirect
            window.location.href = 'http://localhost:3001/admin.html';
        } else {
            errorMessageElement.textContent = result.message || 'Login failed. Please try again.';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessageElement.textContent = 'An error occurred. Please check the console.';
    }
});