/**
 * LEVANTRA - Unified App JS
 */

// =============================================
// CONFIGURATION & GLOBAL STATE
// =============================================

// Global state
let indexSlide = 0;
let slideInterval;

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
// HAMBURGER MENU
// =============================================

function toggleHamburgerMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    const blackOverlay = document.querySelector('.black-overlay');

    if (navLinks) navLinks.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
    if (blackOverlay) blackOverlay.classList.toggle('active');
}

function closeHamburgerMenu() {
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

// Settings logic is now separated into js/settings.js.

// =============================================
// GOOGLE
// =============================================

// Google auth logic is now separated into js/google-auth.js.

// =============================================
// EXPORT FUNCTIONS TO WINDOW
// =============================================

window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
