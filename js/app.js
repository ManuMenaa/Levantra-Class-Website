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
let authListenerAttached = false;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('LEVANTRA App initializing...');
    initApp();
    initializeAuthUI();
    window.setTimeout(initializeAuthUI, 200);
});

document.addEventListener('firebaseReady', initializeAuthUI);

function initApp () {
    console.log('LEVANTRA App initialized')
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
    const accountIcon = document.getElementById('accountIcon');
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
            accountButton.innerHTML = `<img src="${user.photoURL}" alt="Foto profil" class="account-avatar">`;
        } else {
            accountButton.innerHTML = '<i id="accountIcon" class="fa-regular fa-circle-user"></i>';
        }

        accountButton.querySelector('i')?.classList.remove('fa-regular', 'fa-circle-user');
        if (!accountButton.querySelector('img')) {
            const icon = accountButton.querySelector('i');
            if (icon) {
                icon.className = 'fa-regular fa-circle-user';
            }
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
        showToast('Login Google belum siap. Silakan refresh halaman dan coba lagi.', 'eror');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    window.auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Login successful:', result.user?.email);
            updateAuthMenu(result.user || null);
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

    updateAuthMenu(null);
    window.auth.signOut()
        .then(() => {
            console.log('Logout successful');
            updateAuthMenu(null);
            const accountButton = document.getElementById('accountButton');
            if (accountButton) {
                accountButton.innerHTML = '<i id="accountIcon" class="fa-regular fa-circle-user"></i>';
            }
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
    slideInterval = setInterval(nextSlide, 5000);
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

// =============================================
// EXPORT FUNCTIONS TO WINDOW
// =============================================

// Authentication functions
window.login = login;
window.logout = logout;

// Global menu functions
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
