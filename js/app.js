/**
 * LEVANTRA - Unified App JS
 * Features:
 * - Firebase Authentication
 * - Slider Implementation
 * - Global Menu Handling
 * - Settings Management
 */

// =============================================
// CONFIGURATION & GLOBAL STATE
// =============================================

// Global state
let indexSlide = 0;
let slideInterval;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('LEVANTRA App initializing...');

    const checkFirebase = () => {
        if (window.firebaseAvailable && window.auth) {
            console.log('LEVANTRA App initialized');
        }
    };

    checkFirebase();
    document.addEventListener('firebaseReady', checkFirebase, { once: true });
});

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
// AUTHENTICATION
// =============================================

function login() {
    if (!window.auth) {
        console.error('Firebase auth is not ready.');
        alert('Login Google belum siap. Silakan refresh halaman dan coba lagi.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    window.auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Login successful:', result.user?.email);
            alert('Login berhasil sebagai ' + result.user?.email);
        })
        .catch((error) => {
            console.error('Login failed:', error);
            alert('Login failed: ' + (error.message || error.code || 'Unknown error'));
        });
}

function logout() {
    window.auth.signOut()
        .then(() => {
            console.log('Logout successful');
        })
        .catch((error) => {
            console.error('Logout failed:', error);
            alert('Logout failed: ' + (error.message || error.code || 'Unknown error'));
        });
}

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

// =============================================
// GLOBAL MENU
// =============================================

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    const blackOverlay = document.querySelector('.black-overlay');
    const accountToggle = document.querySelector('.account-menu-toggle');
    const accountMenu = document.querySelector('.account-menu');

    if (navLinks) navLinks.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
    if (blackOverlay) blackOverlay.classList.toggle('active');
    if (accountToggle) accountToggle.classList.toggle('active');
    if (accountMenu) accountMenu.classList.toggle('active');
}

function closeMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    const blackOverlay = document.querySelector('.black-overlay');
    const accountToggle = document.querySelector('.account-menu-toggle');
    const accountMenu = document.querySelector('.account-menu');

    if (navLinks) navLinks.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    if (blackOverlay) blackOverlay.classList.remove('active');
    if (accountToggle) accountToggle.classList.remove('active');
    if (accountMenu) accountMenu.classList.remove('active');
}

// =============================================
// SETTINGS
// =============================================

// Settings logic is now separated into js/settings.js.

// =============================================
// EXPORT FUNCTIONS TO WINDOW
// =============================================

// Authentication functions
window.login = login;
window.logout = logout;

// Global menu functions
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;

