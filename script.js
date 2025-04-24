const toggleBtn = document.getElementById('theme-toggle');

toggleBtn.addEventListener('click', () => {
    const root = document.documentElement;
    root.classList.toggle('dark-mode');

    if (root.classList.contains('dark-mode')) {
        toggleBtn.textContent = '☀️ Modo Claro';
        localStorage.setItem('theme', 'dark');
    } else {
        toggleBtn.textContent = '🌙 Modo Escuro';
        localStorage.setItem('theme', 'light');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
        toggleBtn.textContent = '☀️ Modo Claro';
    } else {
        toggleBtn.textContent = '🌙 Modo Escuro';
    }
});
