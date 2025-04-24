const toggleBtn = document.getElementById('theme-toggle');

toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // Atualiza o texto do botão
    if (document.body.classList.contains('dark-mode')) {
        toggleBtn.textContent = '☀️ Modo Claro';
        localStorage.setItem('theme', 'dark'); // <-- salva tema escuro
    } else {
        toggleBtn.textContent = '🌙 Modo Escuro';
        localStorage.setItem('theme', 'light'); // <-- salva tema claro
    }
});

// Atualiza o botão com o texto correto ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀️ Modo Claro';
    } else {
        toggleBtn.textContent = '🌙 Modo Escuro';
    }
});
