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

    // Check Firebase availability
    const CheckFirebase = () => {
        if (window.firebaseAvailable && window.auth) {
            console.log('LEVANTRA App initialized');
        }
    }
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

function buildFirebaseUser(user) {
    if (!user) return null;
    return {
        name: user.displayName || user.email?.split('@')[0] || 'Pengguna',
        email: user.email || '',
        picture: user.photoURL || '',
        uid: user.uid || ''
    };
}

function persistFirebaseUser(user) {
    if (!user) {
        localStorage.removeItem('firebaseUser');
        updateAccountUI(null);
        return;
    }
    const u = buildFirebaseUser(user);
    localStorage.setItem('firebaseUser', JSON.stringify(u));
    updateAccountUI(u);
}

function updateAccountUI(user) {
    const accountToggle = document.querySelector('.account-menu-toggle');
    if (!accountToggle) return;

    const label = accountToggle.querySelector('span');
    let avatar = accountToggle.querySelector('.account-avatar');

    if (user && user.name) {
        if (label) label.textContent = user.name.split(' ')[0];
        if (user.picture) {
            if (!avatar) {
                avatar = document.createElement('img');
                avatar.className = 'account-avatar';
                avatar.width = 28;
                avatar.height = 28;
                accountToggle.insertBefore(avatar, label);
            }
            avatar.src = user.picture;
            avatar.alt = user.name;
        } else if (avatar) {
            avatar.remove();
        }
    } else {
        if (label) label.textContent = 'Akun';
        if (avatar) avatar.remove();
    }
}

function login() {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    window.auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Login successful:', result.user?.email);
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

