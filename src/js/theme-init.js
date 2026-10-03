/**
 * LEVANTRA - Unified Theme Init JS
 * Features:
 * - Theme Init Function
 */

(function() {
    try {
        var theme = localStorage.getItem('theme');
        var isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = theme === 'dark' || (theme === 'system' && isSystemDark) || (!theme && isSystemDark);

        document.documentElement.setAttribute('theme', isDark ? 'dark' : 'light');
        if (isDark) document.documentElement.classList.add('dark-mode');
    } catch (e) {}
})();