/**
 * LEVANTRA - Unified App JS
 */

// =============================================
// CONFIGURATION & GLOBAL STATE
// =============================================

// Global state
let indexSlide = 0;
let slideInterval;

// Store dark key
const DARK_KEY = 'levantra-dark-mode';

// =============================================
// SLIDER IMPLEMENTATION
// =============================================

function updateSlider() {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;

    slides.forEach((slide, i) => {
        slide.className = 'slide-item';
        if (i === indexSlide)
            slide.classList.add('active');
        else if (i === (indexSlide - 1 + slides.length) % slides.length)
            slide.classList.add('prev');
        else if (i === (indexSlide + 1) % slides.length)
            slide.classList.add('next');
    });
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;

    indexSlide = (indexSlide + 1) % slides.length;
    updateSlider();
}

function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 4000);
}

(function initSlider() {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length > 0) {
        slides.forEach((slide, i) => {
            slide.addEventListener('click', () => {
                indexSlide = i;
                updateSlider();
                resetInterval();
            });
        });

        updateSlider();
        resetInterval();
    }
})();

// =============================================
// MOBILE MENU
// =============================================

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    const blackOverlay = document.querySelector('.black-overlay');

    if (navLinks) navLinks.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
    if (blackOverlay) blackOverlay.classList.toggle('active');
}

function closeMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    const blackOverlay = document.querySelector('.black-overlay');

    if (navLinks) navLinks.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    if (blackOverlay) blackOverlay.classList.remove('active');
}

// =============================================
// SETTINGS
// =============================================

const themeSelect = document.getElementById('themeSelect');
const langSelect = document.getElementById('langSelect');
const overlay = document.getElementById('loadingOverlay');

function applyTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-mode', prefersDark);
    } else {
        document.body.classList.toggle('dark-mode', theme === 'dark');
    }
}

const savedTheme = localStorage.getItem('theme') || 'system';
const savedLang = localStorage.getItem('lang') || 'id';

themeSelect.value = savedTheme;
langSelect.value = savedLang;
applyTheme(savedTheme);

themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
});

langSelect.addEventListener('change', (e) => {
    localStorage.setItem('lang', e.target.value);
    overlay.classList.add('show');

    setTimeout(() => {
        window.location.reload();
    }, 600);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'system') applyTheme('system');
});

// =============================================
// EXPORT FUNCTIONS TO WINDOW
// =============================================

// Sidebar functions
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;

// Dark mode functions
window.toggleDarkMode = toggleDarkMode;
