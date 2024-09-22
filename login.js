document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');

        try {
            const response = await fetch('http://127.0.0.1:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Check if the response is a redirect
            if (response.redirected) {
                // Redirect the user to the target URL (index.html)
                window.location.href = response.url;
            } else if (!response.ok) {
                // Handle errors by parsing the JSON
                const errorData = await response.json();
                authMsg.textContent = errorData.error || 'An unknown error occurred';
                authMsg.style.color = 'red';  // Set color to red for errors
            } else {
                // Optionally, handle other success scenarios
                const successData = await response.json();
                authMsg.textContent = successData.message || 'Login successful';
                authMsg.style.color = 'green';  // Set color to green for success
            }
        } catch (err) {
            authMsg.textContent = 'A network error occurred: ' + err.message;
            authMsg.style.color = 'red';  // Set color to red for network errors
        }
    });
});