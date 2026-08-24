/**
 * LEVANTRA - Unified App JS
 * Features:
 * - Firebase Authentication & Database
 * - CRUD Moments Gallery (Integrated with ImgBB & RTDB)
 */

// =============================================
// CONFIGURATION & CONSTANTS
// =============================================

// Global state
let currentUser = null;

// ImgBB API Key
const IMGBB_API_KEY = 'a0553f2c3123cf33b9c0aa1f1684b5be';

// Admin email
const ADMIN_EMAILS = ['sudanamanumain1@gmail.com']; 

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

    // Authentication state listener
    window.auth.onAuthStateChanged(function(user) {
        currentUser = user;
        updateAuthMenu(user);
    });
    // Load moments
    if (window.loadMoments) {
        window.loadMoments();
    }
}

// =============================================
// AUTHENTICATION HANDLING
// =============================================

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
            showToast('Login berhasil sebagai ' + result.user?.email, 'success');
        })
        .catch((error) => {
            console.error('Login failed:', error);
            showToast('Login gagal: ' + error.message, 'error');
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
            showToast('Logout gagal: ' + error.message, 'error');
        });
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

// =============================================
// MOMENTS - CRUD Operations (RTDB + ImgBB)
// =============================================

function loadMoments() {
    const gallery = document.getElementById('momentGallery');
    if (!gallery) return;

    firebase.database().ref('moments').orderByChild('timestamp').on('value', (snapshot) => {
        gallery.innerHTML = '';
        const momentsArray = [];
        
        snapshot.forEach((childSnapshot) => {
            momentsArray.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        momentsArray.reverse().forEach((moment) => {
            renderMomentToGrid(moment.id, moment.title, moment.image);
        });
    });
}

function renderMomentToGrid(id, title, imageUrl) {
    const gallery = document.getElementById('momentGallery');
    if (!gallery) {
        console.error("Error: div id 'momentGallery' tidak ditemukan di HTML!");
        return;
    }

    const momentCard = document.createElement('div');
    momentCard.className = 'momen-card';
    momentCard.id = `moment-${id}`;
    momentCard.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="momen-img">
        <div class="momen-info">
            <h4>${title}</h4>
        </div>
    `;
    gallery.appendChild(momentCard); 
}

async function uploadMoment() {
    if (!currentUser) {
        showToast('Kamu harus login Google dulu!', 'error');
        return;
    }
    
    const titleInput = document.getElementById('momentTitle');
    const fileInput = document.getElementById('momentImage');
    const uploadBtn = document.querySelector('.modal-content button');
    
    const file = fileInput.files[0];
    const title = titleInput.value;
    
    if (!file || !title) {
        showToast('Judul dan gambar tidak boleh kosong!', 'error');
        return;
    }

    const originalBtnText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload...';
    uploadBtn.disabled = true;

    showToast('Mengupload gambar ke server...', 'info');

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            const imageUrl = data.data.url; 
            
            const momentData = {
                title: title,
                image: imageUrl, 
                authorEmail: currentUser.email,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            await firebase.database().ref('moments').push(momentData);
            
            fileInput.value = '';
            titleInput.value = '';
            closeModal();
            showToast('Momen berhasil ditambahkan!', 'success');
        }
    } catch (error) {
        showToast('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        uploadBtn.innerHTML = originalBtnText;
        uploadBtn.disabled = false;
    }
}

// =============================================
// MOMENT GALLERY MODAL
// =============================================

function openUploadModal() {
    if (!currentUser) {
        showToast('Kamu harus login Google dulu untuk upload!', 'error');
        return;
    }
    
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(event) {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// =============================================
// TOAST NOTIFICATION SYSTEM
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

// Moments functions
window.loadMoments = loadMoments;
window.uploadMoment = uploadMoment;
window.openUploadModal = openUploadModal;
window.closeModal = closeModal;

// Global menu functions
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
