document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.querySelector('#password');
    const discordButton = document.querySelector('.discord-login');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });

    discordButton.addEventListener('click', () => {
        window.location.href = '/auth/discord';
    });

    const form = document.querySelector('.login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        
        console.log('Login attempt:', { email, password });
    });
}); 