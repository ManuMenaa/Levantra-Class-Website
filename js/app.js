/**
 * LEVANTRA - Unified App JS
 * Features:
 * - Firebase Authentication & Database
 * - CRUD Moments Gallery (Integrated with ImgBB & RTDB)
 * - Comments System (Using RTDB)
 */

// =============================================
// CONFIGURATION & CONSTANTS
// =============================================

// Global state
let currentUser = null;
let currentDetailImages = [];
let currentDetailImageIndex = 0;

// ImgBB API Key
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// Admin email
const ADMIN_EMAILS = ['sudanamanumain1@gmail.com']; 

// Current modal moment ID
let currentDetailMomentId = null;

// Import Firebase & Firebase SDK
import { app, db, auth } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, push, update, remove, onValue, serverTimestamp } from 'firebase/database';

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('LEVANTRA App initializing...');
    initApp();
});

function initApp() {
    console.log('LEVANTRA App initialized')

    // Authentication state listener
    onAuthStateChanged(auth, function(user) {
        currentUser = user;
        updateAuthMenu(user);
    });
    // Load moments
    if (window.loadMoments) {
        window.loadMoments();
    }
}

// =============================================
// AUTHENTICATION
// =============================================

function login() {
    if (!auth) {
        console.error('Firebase auth is not ready.');
        showToast('Login Google belum siap. Silakan refresh halaman dan coba lagi.', 'error');
        return;
    }

    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
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
    if (!auth) {
        showToast('Logout belum siap. Silakan refresh halaman dan coba lagi.', 'error');
        return;
    }

    signOut(auth)
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
    if (!gallery || !db) {
        console.log('loadMoments: Gallery element not found or Firebase not available');
        return;
    }

    const momentsRef = ref(db, 'moments');
    
    onValue(momentsRef, (snapshot) => {
        gallery.innerHTML = '';
        const momentsArray = [];
        
        snapshot.forEach((childSnapshot) => {
            momentsArray.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        momentsArray.reverse().forEach((moment) => {
            renderMomentToGrid(moment);
        });
    });
}
function renderMomentToGrid(moment) {
    const gallery = document.getElementById('momentGallery');

    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);
    const isOwner = currentUser && currentUser.email === moment.authorEmail;
    const canEditDelete = isOwner || isAdmin;

    const imagesArray = moment.images || (moment.image ? [moment.image] : []);
    const thumbUrl = imagesArray.length > 0 ? imagesArray[0] : '';

    const multiIndicator = imagesArray.length > 1 ? 
        `<div class="multi-image-indicator" title="Momen ini berisi banyak gambar"><i class="fa-solid fa-images"></i></div>` : '';

    const actionButtons = canEditDelete ? `
        <div class="moment-actions">
            <button class="moment-action-btn edit" onclick="event.stopPropagation(); openEditModal('${moment.id}', '${moment.title.replace(/'/g, "\\'")}', '${(moment.description || '').replace(/'/g, "\\'")}')" title="Edit">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="moment-action-btn delete" onclick="event.stopPropagation(); deleteMoment('${moment.id}')" title="Hapus">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    ` : '';

    const momentCard = document.createElement('div');
    momentCard.className = 'moment-card';
    momentCard.id = `moment-${moment.id}`;
    momentCard.setAttribute('data-title', moment.title.toLowerCase());
    momentCard.onclick = () => openDetailModal(moment);

    momentCard.innerHTML = `
        ${multiIndicator}
        <img src="${thumbUrl}" alt="${moment.title}" class="moment-img">
        ${actionButtons}
        <div class="moment-info">
            <h4>${moment.title}</h4>
        </div>
    `;
    gallery.appendChild(momentCard); 
}

async function uploadMoment() {
    if (!currentUser) return openLoginPromptModal();
    
    const titleInput = document.getElementById('momentTitle');
    const descInput = document.getElementById('momentDesc');
    const fileInput = document.getElementById('momentImage');
    const uploadBtn = document.querySelector('#uploadModal button');
    
    const files = fileInput.files;
    const title = titleInput.value;
    const desc = descInput.value;
    
    if (files.length === 0 || !title) {
        showToast('Judul dan gambar tidak boleh kosong!', 'error');
        return;
    }

    const originalBtnText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload...';
    uploadBtn.disabled = true;

    try {
        const imageUrls = [];

        for (let i = 0; i < files.length; i++) {
            showToast(`Mengupload gambar ${i + 1} dari ${files.length}...`, 'info');
            
            const file = files[i];
            
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST', 
                body: formData
            });
            const data = await response.json();
            
            if (data.success) {
                imageUrls.push(data.data.url);
            } else {
                throw new Error("Gagal mengupload gambar ke-" + (i + 1));
            }
        }

        const momentData = {
            title: title,
            description: desc,
            authorEmail: currentUser.email,
            images: imageUrls, 
            timestamp: serverTimestamp() 
        };

        const momentsRef = ref(db, 'moments');
        await push(momentsRef, momentData);
            
        fileInput.value = ''; 
        titleInput.value = ''; 
        descInput.value = '';
        closeModal('uploadModal');
        showToast('Momen berhasil ditambahkan!', 'success');
    } catch (error) {
        showToast('Gagal: ' + error.message, 'error');
    } finally {
        uploadBtn.innerHTML = originalBtnText; 
        uploadBtn.disabled = false;
    }
}

async function saveEditMoment() {
    const id = document.getElementById('editMomentId').value;
    const title = document.getElementById('editMomentTitle').value;
    const desc = document.getElementById('editMomentDesc').value;
    const fileInput = document.getElementById('editMomentImage');
    const saveBtn = document.getElementById('saveEditBtn');
    
    if (!title) return showToast('Judul tidak boleh kosong!', 'error');

    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    saveBtn.disabled = true;

    try {
        let updateData = { title: title, description: desc };

        if (fileInput.files.length > 0) {
            showToast(`Mengupload ${fileInput.files.length} gambar baru...`, 'info');
            
            const imageUrls = [];
            
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { 
                    method: 'POST', 
                    body: formData 
                });
                const data = await response.json();
                
                if (data.success) {
                    imageUrls.push(data.data.url);
                } else {
                    throw new Error("Gagal upload gambar ke-" + (i + 1));
                }
            }

            updateData.images = imageUrls;
            updateData.image = null;
        }
        
        const momentRef = ref(db, 'moments/' + id);
        await update(momentRef, updateData);
        closeModal('editModal');
        fileInput.value = '';
        showToast('Momen berhasil diupdate!', 'success');
    } catch (error) {
        showToast('Gagal update: ' + error.message, 'error');
    } finally {
        saveBtn.innerHTML = 'Simpan Perubahan'; 
        saveBtn.disabled = false;
    }
}

async function deleteMoment(id) {
    if (confirm("Yakin ingin menghapus momen ini?")) {
        try {
            const momentRef = ref(db, 'moments/' + id);
            await remove(momentRef);
            showToast('Momen berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal menghapus: ' + error.message, 'error');
        }
    }
}

function searchMoments() {
    const input = document.getElementById('searchMoment').value.toLowerCase();
    const cards = document.getElementsByClassName('moment-card');

    for (let i = 0; i < cards.length; i++) {
        const title = cards[i].getAttribute('data-title');
        if (title.includes(input)) {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}

// =============================================
// MODAL Functions
// =============================================

function openUploadModal() {
    if (!currentUser) return openLoginPromptModal();
    document.getElementById('uploadModal').classList.add('active');
}

function openLoginPromptModal() {
    document.getElementById('loginPromptModal').classList.add('active');
}

function openEditModal(id, title, desc) {
    document.getElementById('editMomentId').value = id;
    document.getElementById('editMomentTitle').value = title;
    document.getElementById('editMomentDesc').value = desc !== 'undefined' ? desc : '';
    
    const modal = document.getElementById('editModal');
    modal.classList.add('active');
}

function openDetailModal(moment) {
    try {
        document.getElementById('detailModal').classList.add('active');
        
        document.getElementById('detailTitle').textContent = moment.title;
        document.getElementById('detailDesc').textContent = moment.description;
        
        let imagesData = moment.images || (moment.image ? [moment.image] : []);
        currentDetailImages = Array.isArray(imagesData) ? imagesData : Object.values(imagesData);
        currentDetailImages = currentDetailImages.filter(url => url);
        currentDetailImageIndex = 0;
        
        if (currentDetailImages.length > 1) {
            currentDetailImages.forEach(url => {
                const preloadImg = new Image();
                preloadImg.src = url; 
            });
        }

        currentDetailMomentId = moment.id;
        
        updateDetailSlider();
        loadComments(moment.id);
    } catch (error) {
        console.error("Error saat membuka modal detail:", error);
        showToast("Terjadi kesalahan saat memuat momen ini.", "error");
    }
}

function updateDetailSlider() {
    try {
        const imgEl = document.getElementById('detailImage');
        const prevBtn = document.querySelector('.slider-btn.prev');
        const nextBtn = document.querySelector('.slider-btn.next');
        const dotsContainer = document.getElementById('detailSliderDots');
        const sliderContainer = document.querySelector('.detail-slider');

        if (!imgEl || !sliderContainer) return; 

        if (currentDetailImages.length > 0) {
            let spinner = document.getElementById('imageLoader');
            if (!spinner) {
                spinner = document.createElement('div');
                spinner.id = 'imageLoader';
                spinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--primary-gold);"></i>';
                spinner.style.position = 'absolute';
                spinner.style.top = '50%';
                spinner.style.left = '50%';
                spinner.style.transform = 'translate(-50%, -50%)';
                spinner.style.zIndex = '20';
                sliderContainer.appendChild(spinner);
            }
            
            spinner.style.display = 'block';
            imgEl.style.opacity = '0.3'; 
            
            const tempImg = new Image();
            
            tempImg.onload = function() {
                imgEl.src = tempImg.src;
                imgEl.style.opacity = '1';       
                spinner.style.display = 'none';  
            };

            tempImg.onerror = function() {
                console.warn("Gagal meload gambar dari server");
                imgEl.src = currentDetailImages[currentDetailImageIndex]; 
                imgEl.style.opacity = '1';
                spinner.style.display = 'none';
            };
            
            tempImg.src = currentDetailImages[currentDetailImageIndex];
        }

        const hasMultiple = currentDetailImages.length > 1;
        if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';

        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            if (hasMultiple) {
                currentDetailImages.forEach((_, index) => {
                    const dot = document.createElement('div');
                    dot.className = `slider-dot ${index === currentDetailImageIndex ? 'active' : ''}`;
                    dot.onclick = () => {
                        currentDetailImageIndex = index;
                        updateDetailSlider();
                    };
                    dotsContainer.appendChild(dot);
                });
            }
        }
    } catch (err) {
        console.error("Error pada proses slider:", err);
    }
}

function changeDetailSlide(direction) {
    currentDetailImageIndex += direction;
    if (currentDetailImageIndex < 0) {
        currentDetailImageIndex = currentDetailImages.length - 1;
    } else if (currentDetailImageIndex >= currentDetailImages.length) {
        currentDetailImageIndex = 0;
    }
    updateDetailSlider();
}

function closeModal(modalId, event) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// =============================================
// COMMENTS (RTDB)
// =============================================

function loadComments(momentId) {
    const commentsList = document.getElementById('commentsList');

    const commentsRef = ref(db, `moments/${momentId}/comments`);
    
    onValue(commentsRef, (snapshot) => {
        
        if (!snapshot.exists()) {
            commentsList.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">Belum ada komentar. Jadilah yang pertama!</p>';
            return;
        }

        snapshot.forEach((child) => {
            const comment = child.val();
            const photoUrl = comment.authorPhoto;
            
            commentsList.innerHTML += `
                <div class="comment-item">
                    <img src="${photoUrl}" class="comment-avatar">
                    <div class="comment-text">
                        <strong>${comment.authorName}</strong>
                        ${comment.text}
                    </div>
                </div>
            `;
        });
        
        commentsList.scrollTop = commentsList.scrollHeight;
    });
}

async function postComment() {
    if (!currentUser) return openLoginPromptModal();
    if (!currentDetailMomentId) return;

    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    
    if (!text) return;

    const commentData = {
        text: text,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email.split('@')[0],
        authorPhoto: currentUser.photoURL,
        timestamp: serverTimestamp()
    };

    try {
        const commentsRef = ref(db, `moments/${currentDetailMomentId}/comments`);
        await push(commentsRef, commentData);
        input.value = '';
    } catch (error) {
        showToast('Gagal mengirim komentar', 'error');
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
window.saveEditMoment = saveEditMoment;
window.deleteMoment = deleteMoment;

// Modal functions
window.openUploadModal = openUploadModal;
window.openEditModal = openEditModal;
window.openDetailModal = openDetailModal;
window.changeDetailSlide = changeDetailSlide;
window.closeModal = closeModal;

// Comments functions
window.loadComments = loadComments;
window.searchMoments = searchMoments;
window.postComment = postComment;

// Global menu functions
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
