/**
 * LEVANTRA - Settings
 */

const themeSelect = document.getElementById('themeSelect');
const langSelect = document.getElementById('langSelect');
const overlay = document.getElementById('loadingOverlay');

function applyTheme(theme) {
    const resolvedTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    document.body.classList.toggle('dark-mode', resolvedTheme === 'dark');
    document.body.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
}

function initializeThemeControls() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme);

    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            localStorage.setItem('theme', theme);
            applyTheme(theme);
        });
    }

    if (langSelect) {
        const savedLang = localStorage.getItem('lang') || 'id';
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => {
            localStorage.setItem('lang', e.target.value);
            if (overlay) {
                overlay.classList.add('show');
            }
            setTimeout(() => {
                window.location.reload();
            }, 600);
        });
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const resolvedTheme = savedTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : savedTheme;

    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (document.body) {
        document.body.classList.toggle('dark-mode', resolvedTheme === 'dark');
    }
}

function setupSettings() {
    initTheme();
    initializeThemeControls();
}

document.addEventListener('DOMContentLoaded', setupSettings);
