document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = event.target.username.value;
    const password = event.target.password.value;
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Use a relative URL for the redirect to work on both localhost and production
            window.location.href = '/admin.html';
        } else {
            errorMessageElement.textContent = result.message || 'Login failed. Please try again.';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessageElement.textContent = 'An error occurred. Please check the console.';
    }
});