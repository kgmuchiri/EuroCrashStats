function applyInitialTheme() {
    const theme = localStorage.getItem('theme');
    if (theme) {
        document.documentElement.classList.add(theme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('theme-light');
    } else {
        document.documentElement.classList.add('theme-dark');
    }
}

applyInitialTheme();

document.getElementById('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    if (html.classList.contains('theme-dark')) {
        html.classList.remove('theme-dark');
        html.classList.add('theme-light');
        localStorage.setItem('theme', 'theme-light');
    } else {
        html.classList.remove('theme-light');
        html.classList.add('theme-dark');
        localStorage.setItem('theme', 'theme-dark');
    }
    window.dispatchEvent(new Event('themeChange'));
});
