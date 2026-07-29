/**
 * LEVANTRA - Unified App JS
 * Features:
 * - Firebase Authentication
 * - Slider Implementation
 * - Global Menu Handling
 * - Settings Management
 */

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('LEVANTRA App initializing...');
});

function initApp() {
    // Initialize Firebase
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not found. auth will not be available.');
        return;
    }

    try {
        if (!window.firebase.apps || !window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
        }
        window.auth = window.firebase.auth();
        window.auth.onAuthStateChanged((user) => {
            persistFirebaseUser(user);
        });
    } catch (err) {
        console.error('Firebase init error', err);
    }
}

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
    // close account menu if open
    if (typeof closeAccountMenu === 'function') closeAccountMenu();

    if (!window.auth || typeof window.auth.signInWithPopup !== 'function') {
        alert('Firebase Authentication belum siap. Coba refresh halaman lalu klik Masuk lagi.');
        return;
    }

    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

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
    if (!window.auth || typeof window.auth.signOut !== 'function') {
        console.warn('Firebase auth is not available for logout.');
        localStorage.removeItem('firebaseUser');
        updateAccountUI(null);
        return;
    }

    window.auth.signOut()
        .then(() => {
            localStorage.removeItem('firebaseUser');
            updateAccountUI(null);
            console.log('Logout successful');
        })
        .catch((error) => {
            console.error('Logout failed:', error);
            alert('Logout failed: ' + (error.message || error.code || 'Unknown error'));
        });
}

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

    if (navLinks) navLinks.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    if (blackOverlay) blackOverlay.classList.remove('active');
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

// Backwards-compatible account menu helpers (used by settings.html and older templates)
function toggleAccountMenu(event) {
    const accountMenu = document.getElementById('accountMenu');
    if (!accountMenu) return;
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
    }
    accountMenu.classList.toggle('active');
}

function closeAccountMenu() {
    const accountMenu = document.getElementById('accountMenu');
    if (!accountMenu) return;
    accountMenu.classList.remove('active');
}

window.toggleAccountMenu = toggleAccountMenu;
window.closeAccountMenu = closeAccountMenu;
