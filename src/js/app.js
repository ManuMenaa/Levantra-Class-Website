/**
 * LEVANTRA - Unified App JS
 * Features:
 * - Firebase Authentication & Database
 * - CRUD Moments Gallery (Integrated with ImgBB & RTDB)
 * - Comments System (Using RTDB)
 * - Class Cash System (Integrated with Google Sheets)
 */

// =============================================
// CONFIGURATION & CONSTANTS
// =============================================

// Global state
let currentUser = null;
let currentDetailImages = [];
let currentDetailImageIndex = 0;
let currentDetailMomentId = null;
let activeModal = null;
let modalTrigger = null;

// Admin email
const ADMIN_EMAILS = ['sudanamanumain1@gmail.com', 'levantra.tsk@gmail.com'];

// ImgBB API Key
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// Import student data
import { renderStudents } from './student-data.js';

// Import Firebase & Firebase SDK
import { app, db, auth } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, push, update, remove, onValue, serverTimestamp } from 'firebase/database';

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Levantra App initializing...');
    initApp();
});

function initApp() {
    console.log('Levantra App initialized')

    // Authentication state listener
    onAuthStateChanged(auth, function(user) {
        currentUser = user;
        updateAuthMenu(user);
    });

    // Render student data
    if (renderStudents) {
        renderStudents();
    }

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
        console.log('loadMoments: Gallery element not found or db not available');
    } else {
        console.log('loadMoments: Gallery loaded successful');
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

        if (momentsArray.length === 0) {
            gallery.innerHTML = `
                <div class="empty-moment-state">
                    <div class="empty-icon">
                        <i class="fa-solid fa-camera-retro"></i>
                    </div>
                    <h3>Belum Ada Momen</h3>
                    <p>Galeri kelas masih kosong. Yuk, jadilah yang pertama membagikan keseruan kelas kita!</p>
                    <button class="btn-empty-upload" onclick="openUploadModal()">
                        <i class="fa-solid fa-plus"></i> Tambahkan Momen
                    </button>
                </div>
            `;
        } else {
            momentsArray.reverse().forEach((moment) => {
                renderMomentToGrid(moment);
            });
        }
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
    
    if (!title) {
        showToast('Judul tidak boleh kosong!', 'error');
        return;
    }

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
    let visibleCount = 0;

    for (let i = 0; i < cards.length; i++) {
        const title = cards[i].getAttribute('data-title');
        if (title.includes(input)) {
            cards[i].style.display = "";
            visibleCount++;
        } else {
            cards[i].style.display = "none";
        }
    }

    let searchEmpty = document.getElementById('searchEmptyState');
    
    if (visibleCount === 0 && cards.length > 0) {
        if (!searchEmpty) {
            searchEmpty = document.createElement('div');
            searchEmpty.id = 'searchEmptyState';
            searchEmpty.className = 'empty-moment-state';
            searchEmpty.innerHTML = `
                <div class="empty-icon"><i class="fa-solid fa-magnifying-glass-minus"></i></div>
                <h3>Tidak Ditemukan</h3>
                <p>Momen yang Anda cari tidak ada atau belum diunggah.</p>
            `;
            document.getElementById('momentGallery').appendChild(searchEmpty);
        }
        searchEmpty.style.display = "flex";
    } else if (searchEmpty) {
        searchEmpty.style.display = "none";
    }
}

// =============================================
// MODAL SYSTEM Functions
// =============================================

function openUploadModal() {
    if (!currentUser) return openLoginPromptModal();
    openModal(document.getElementById('uploadModal'));
}

function openLoginPromptModal() {
    openModal(document.getElementById('loginPromptModal'));
}

function openEditModal(id, title, desc) {
    document.getElementById('editMomentId').value = id;
    document.getElementById('editMomentTitle').value = title;
    document.getElementById('editMomentDesc').value = desc !== 'undefined' ? desc : '';
    
    openModal(document.getElementById('editModal'));
}

function openDetailModal(moment) {
    try {
        openModal(document.getElementById('detailModal'));
        
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

function openStructureModal(name, position, absent, imgUrl, informationLink) {
    const modal = document.getElementById('structureModal');
    if (!modal) {
        console.log('openStructureModal: Modal element not found');
        return;
    }

    document.getElementById('modalStructureName').textContent = name;
    document.getElementById('modalStructurePosition').textContent = position;
    document.getElementById('modalStructureAbsent').textContent = absent;
    document.getElementById('modalStructureImg').src = imgUrl;

    const linkBtn = document.getElementById('modalStructureLink');
    if (linkBtn) {
        linkBtn.href = informationLink || 'siswa.html';
    }

    openModal(modal);
}

function openStudentModal(studentOrName, absent) {
    const modal = document.getElementById('studentModal');
    if (!modal) {
        console.log('openStudentModal: Modal element not found');
        return;
    }

    if (typeof studentOrName === 'object' && studentOrName !== null) {
        const student = studentOrName;
        document.getElementById('modalStudentAvatar').src = student.avatar || '/img/LevantraLogo.jpg';
        document.getElementById('modalStudentName').textContent = student.name;
        document.getElementById('modalStudentNickname').textContent = 'Nama Panggilan: ' + (student.nickname || student.name.split(' ')[0]);
        document.getElementById('modalStudentAbsentStrong').textContent = student.absent;
    } else {
        document.getElementById('modalStudentAvatar').src = '/img/LevantraLogo.jpg';
        document.getElementById('modalStudentName').textContent = studentOrName;
        document.getElementById('modalStudentNickname').textContent = 'Nama Panggilan: -';
        document.getElementById('modalStudentAbsentStrong').textContent = absent || '-';
    }

    openModal(modal);
}

function openModal(modal) {
    if (!modal) return;
    activeModal = modal;
    modalTrigger = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'false');
    const focusTarget = [...modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
        .find((element) => element.getClientRects().length > 0) || modal;
    focusTarget.focus();
}

function closeModal(modalId, event) {
    const modal = document.getElementById(modalId);
    if (!modal || (event && event.target !== modal)) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (activeModal === modal) {
        activeModal = null;
        if (modalTrigger instanceof HTMLElement) modalTrigger.focus();
        modalTrigger = null;
    }
}

document.addEventListener('keydown', (event) => {
    if (!activeModal) return;
    if (event.key === 'Escape') {
        closeModal(activeModal.id);
        return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...activeModal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length > 0);
    if (focusable.length === 0) {
        event.preventDefault();
        activeModal.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

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
    if (!container) {
        console.log('showToast: Toast container not found');
        return;
    }

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
    }, 5000);
}

// =============================================
// HERO SLIDER IMPLEMENTATION
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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) resetInterval();
})();

document.addEventListener('keydown', (event) => {
    const card = event.target.closest('.structure-card[role="button"]');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        card.click();
    }
});

// =============================================
// SETTINGS SYSTEM
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('themeSelect');

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

});

// =============================================
// GLOBAL MENU
// =============================================

function toggleHamburgerMenu() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        const isOpen = hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(isOpen));
        hamburger.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
    }
    if (navLinks) navLinks.classList.toggle('active');

    toggleBlackOverlay();
}

function closeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Buka menu');
    }
    if (navLinks) navLinks.classList.remove('active');
}

function toggleAccountMenu() {
    const accountMenu = document.querySelector('.account-menu');

    if (accountMenu) accountMenu.classList.toggle('active');

    toggleBlackOverlay();
}

function closeAccountMenu() {
    const accountMenu = document.querySelector('.account-menu');

    if (accountMenu) accountMenu.classList.remove('active');
}

function toggleBlackOverlay() {
    const blackOverlay = document.querySelector('.black-overlay');

    if (blackOverlay) blackOverlay.classList.toggle('active');
}

function closeBlackOverlay() {
    const blackOverlay = document.querySelector('.black-overlay');

    if (blackOverlay) blackOverlay.classList.remove('active');

    closeHamburgerMenu();
    closeAccountMenu();
    if (activeModal) closeModal(activeModal.id);
}


// =============================================
// EXPORT FUNCTIONS
// =============================================

// Authentication functions
window.login = login;
window.logout = logout;

// Moments functions
window.loadMoments = loadMoments;
window.uploadMoment = uploadMoment;
window.saveEditMoment = saveEditMoment;
window.deleteMoment = deleteMoment;

// Comments functions
window.loadComments = loadComments;
window.searchMoments = searchMoments;
window.postComment = postComment;

// Modal functions
window.openUploadModal = openUploadModal;
window.openEditModal = openEditModal;
window.openDetailModal = openDetailModal;
window.changeDetailSlide = changeDetailSlide;
window.closeModal = closeModal;
window.openStructureModal = openStructureModal;
window.openStudentModal = openStudentModal;

// Global menu functions
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.toggleAccountMenu = toggleAccountMenu;
window.closeAccountMenu = closeAccountMenu;
window.toggleBlackOverlay = toggleBlackOverlay;
window.closeBlackOverlay = closeBlackOverlay;