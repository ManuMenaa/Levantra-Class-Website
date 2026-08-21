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
let currentUser = null;
let authListenerAttached = false;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('LEVANTRA App initializing...');

    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
        if (window.firebaseAvailable) {
            clearInterval(checkFirebase);
            initApp();
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkFirebase);
    }, 5000);
});

function initApp() {
    console.log('LEVANTRA App initialized')

    // Initialize authentication UI
    window.auth.onAuthStateChanged(function(user) {
        currentUser = user;
        updateAuthMenu(user);
    });
}

// =============================================
// AUTHENTICATION
// =============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function updateAuthMenu(user) {
    const loginItem = document.getElementById('loginMenuItem');
    const logoutItem = document.getElementById('logoutMenuItem');
    const accountButton = document.getElementById('accountButton');
    const hasUser = Boolean(user);

    if (loginItem) {
        loginItem.hidden = hasUser;
        loginItem.style.display = hasUser ? 'none' : 'flex';
    }

    if (logoutItem) {
        logoutItem.hidden = !hasUser;
        logoutItem.style.display = hasUser ? 'flex' : 'none';
    }

    if (accountButton) {
        if (hasUser && user?.photoURL) {
            accountButton.innerHTML = `<img src="${user.photoURL}" alt="Profile Photo" class="account-avatar">`;
        } else {
            accountButton.innerHTML = '<i id="accountIcon" class="fa-regular fa-circle-user"></i>';
        }
    }
}

function initializeAuthUI() {
    if (!window.auth) {
        updateAuthMenu(null);
        return;
    }

    if (authListenerAttached) {
        updateAuthMenu(window.auth.currentUser || null);
        return;
    }

    authListenerAttached = true;
    updateAuthMenu(window.auth.currentUser || null);

    window.auth.onAuthStateChanged((user) => {
        updateAuthMenu(user);
    });
}

function login() {
    if (!window.auth) {
        console.error('Firebase auth is not ready.');
        showToast('Login Google belum siap. Silakan refresh halaman dan coba lagi.', 'error');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    window.auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Login successful:', result.user?.email);
            showToast('Login berhasil sebagai ' + (result.user?.email || 'pengguna'), 'success');
        })
        .catch((error) => {
            console.error('Login failed:', error);
            showToast('Login gagal: ' + (error.message || error.code || 'Unknown error'), 'error');
        });
}

function logout() {
    if (!window.auth) {
        showToast('Logout belum siap. Silakan refresh halaman dan coba lagi.', 'error');
        return;
    }

    window.auth.signOut()
        .then(() => {
            console.log('Logout successful');
            showToast('Logout berhasil', 'success');
        })
        .catch((error) => {
            console.error('Logout failed:', error);
            showToast('Logout gagal: ' + (error.message || error.code || 'Unknown error'), 'error');
        });
}

// =============================================
// SLIDER IMPLEMENTATION
// =============================================

(function initSlider() {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;

    let indexSlide = 0;
    let slideInterval;
    const timeInterval = 5000;
    
    function updateSlider() {
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev', 'next');

            if (i === indexSlide) {
                slide.classList.add('active');
            } else if (i === (indexSlide - 1 + slides.length) % slides.length) {
                slide.classList.add('prev');
            } else if (i === (indexSlide + 1) % slides.length) {
                slide.classList.add('next');
            }
        });
    }

    function nextSlide() {
        indexSlide = (indexSlide + 1) % slides.length;
        updateSlider();
    }

    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, timeInterval);
    }

    slides.forEach((slide, i) => {
        slide.addEventListener('click', () => {
            indexSlide = i;
            updateSlider();
            resetInterval();
        });
    });

    updateSlider();
    resetInterval();
})();

// =============================================
// SETTINGS
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');
    const langSelect = document.getElementById('langSelect');
    const overlay = document.getElementById('loadingOverlay');

    const applyTheme = (theme) => {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);
        const resolvedTheme = isDark ? 'dark' : 'light';

        document.documentElement.setAttribute('theme', resolvedTheme);
        document.documentElement.classList.toggle('dark-mode', isDark);
    };

    const currentTheme = localStorage.getItem('theme') || 'system';
    
    applyTheme(currentTheme);

    if (themeSelect) {
        themeSelect.value = currentTheme;
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            localStorage.setItem('theme', selectedTheme);
            applyTheme(selectedTheme);
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('theme') || 'system') === 'system') {
            applyTheme('system');
        }
    });

    if (langSelect) {
        langSelect.value = localStorage.getItem('lang') || 'id';
        langSelect.addEventListener('change', (e) => {
            localStorage.setItem('lang', e.target.value);
            if (overlay) overlay.classList.add('show');
            setTimeout(() => window.location.reload(), 600);
        });
    }
});

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
// EXPORT FUNCTIONS TO WINDOW
// =============================================

// Authentication functions
window.login = login;
window.logout = logout;

// Global menu functions
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
