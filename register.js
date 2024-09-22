document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Clear previous messages
    const successMsg = document.getElementById('success-msg');
    const errorMsg = document.getElementById('error-msg');
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password
            }),
        });

        const data = await response.json();

        if (response.status === 201) {
            // Show success message and redirect to the home page
            successMsg.style.display = 'block';
            successMsg.textContent = `Welcome, ${username}! Redirecting to your homepage...`;

            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/index';
            }, 2000);
        } else if (response.status === 409) {
            // Handle user already exists error
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'User already exists. Please try logging in.';
        } else {
            // Display any other errors
            errorMsg.style.display = 'block';
            errorMsg.textContent = data.errors ? data.errors[0].msg : 'Something went wrong. Please try again.';
        }
    } catch (error) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'An error occurred. Please try again later.';
    }
});
