/**
 * LEVANTRA - Google Authentication
 */

const googleClientIdMeta = document.querySelector('meta[name="google-client-id"]');
const googleClientId = window.LEVANTRA_GOOGLE_CLIENT_ID || (googleClientIdMeta ? googleClientIdMeta.getAttribute('content') : '459223542825-pj8gsh9kve5lngr8bq3j1jjcku7v7894.apps.googleusercontent.com');
let googleAuthReady = false;

function getAccountMenu() {
    return document.getElementById('accountMenu');
}

function getAccountToggle() {
    return document.querySelector('.account-menu-toggle');
}

function getAuthStatusElement() {
    return document.getElementById('authStatus');
}

function getGoogleSignInButtonContainer() {
    return document.getElementById('googleSignInButton');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isGoogleConfigured() {
    return Boolean(googleClientId && !googleClientId.includes('YOUR_GOOGLE_CLIENT_ID') && !googleClientId.includes('your-google-client-id'));
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((char) => {
            return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'account-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2200);
}

function updateAuthButton(user) {
    const accountToggle = getAccountToggle();
    if (!accountToggle) return;

    const label = accountToggle.querySelector('span');
    let icon = accountToggle.querySelector('.account-avatar');

    if (!label) return;

    if (user && user.name) {
        label.textContent = user.name.split(' ')[0];
        if (user.picture) {
            if (!icon) {
                const avatar = document.createElement('img');
                avatar.className = 'account-avatar';
                avatar.alt = user.name;
                avatar.src = user.picture;
                accountToggle.insertBefore(avatar, label);
            } else {
                icon.src = user.picture;
                icon.alt = user.name;
            }
        } else if (icon) {
            icon.remove();
        }
    } else {
        label.textContent = 'Akun';
        if (icon) {
            icon.remove();
        }
    }
}

function updateAuthStatus(user) {
    const statusElement = getAuthStatusElement();
    if (!statusElement) return;

    if (user && user.name) {
        statusElement.innerHTML = `<strong>Sudah masuk.</strong> Halo, ${escapeHtml(user.name)}!`;
        statusElement.classList.add('active');
    } else {
        statusElement.innerHTML = 'Belum masuk. Klik tombol di bawah untuk lanjut.';
        statusElement.classList.remove('active');
    }
}

function renderGoogleSignInButton() {
    const buttonContainer = getGoogleSignInButtonContainer();
    if (!buttonContainer) return;

    if (!ensureGoogleClientInitialized()) {
        return;
    }

    buttonContainer.innerHTML = '';
    window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left'
    });
}

function getCurrentGoogleUser() {
    const savedUser = localStorage.getItem('googleUser');
    if (!savedUser) return null;

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        localStorage.removeItem('googleUser');
        return null;
    }
}

function getUploadButton() {
    return document.getElementById('uploadMediaButton');
}

function getUploadInput() {
    return document.getElementById('mediaUpload');
}

function getUploadStatusElement() {
    return document.getElementById('uploadStatus');
}

function getUploadPreviewElement() {
    return document.getElementById('uploadPreview');
}

function getMomenGalleryElement() {
    return document.getElementById('momenGallery');
}

function getStoredUploads() {
    const stored = localStorage.getItem('levantraUploads');
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch (error) {
        localStorage.removeItem('levantraUploads');
        return [];
    }
}

function saveStoredUploads(items) {
    localStorage.setItem('levantraUploads', JSON.stringify(items));
}

function renderUploadedMedia() {
    const gallery = getMomenGalleryElement();
    if (!gallery) return;

    const uploads = getStoredUploads();
    if (!uploads.length) {
        gallery.innerHTML = '<p class="upload-empty">Belum ada foto atau video yang diunggah.</p>';
        return;
    }

    gallery.innerHTML = '';
    const fragment = document.createDocumentFragment();

    uploads.slice().reverse().forEach((item) => {
        const card = document.createElement('article');
        card.className = 'momen-item';

        if (item.type && item.type.startsWith('image/')) {
            const image = document.createElement('img');
            image.src = item.dataUrl;
            image.alt = item.name;
            card.appendChild(image);
        } else if (item.type && item.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = item.dataUrl;
            video.controls = true;
            video.preload = 'metadata';
            card.appendChild(video);
        }

        const meta = document.createElement('div');
        meta.className = 'momen-item-meta';
        meta.innerHTML = `
            <strong>${escapeHtml(item.name)}</strong>
            <p>Diunggah oleh ${escapeHtml(item.uploader || 'Pengguna')}</p>
            <p>${escapeHtml(new Date(item.uploadedAt).toLocaleString('id-ID'))}</p>
        `;
        card.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'momen-item-actions';

        const likeButton = document.createElement('button');
        likeButton.className = `momen-action-btn${item.liked ? ' active' : ''}`;
        likeButton.type = 'button';
        likeButton.innerHTML = `<i class="fa-solid fa-heart"></i> ${item.likes || 0}`;
        likeButton.addEventListener('click', () => {
            const uploads = getStoredUploads();
            const target = uploads.find((entry) => entry.id === item.id);
            if (target) {
                target.likes = (target.likes || 0) + (target.liked ? -1 : 1);
                target.liked = !target.liked;
                saveStoredUploads(uploads);
                renderUploadedMedia();
            }
        });
        actions.appendChild(likeButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'momen-delete-btn';
        deleteButton.type = 'button';
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i> Hapus';
        deleteButton.addEventListener('click', () => {
            const remaining = getStoredUploads().filter((entry) => entry.id !== item.id);
            saveStoredUploads(remaining);
            renderUploadedMedia();
            showToast('Postingan berhasil dihapus.');
        });
        actions.appendChild(deleteButton);

        card.appendChild(actions);

        const commentsSection = document.createElement('div');
        commentsSection.className = 'momen-comments';

        const commentList = document.createElement('div');
        commentList.className = 'momen-comment-list';
        (item.comments || []).forEach((comment) => {
            const commentItem = document.createElement('div');
            commentItem.className = 'momen-comment-item';
            commentItem.textContent = comment;
            commentList.appendChild(commentItem);
        });
        commentsSection.appendChild(commentList);

        const commentForm = document.createElement('form');
        commentForm.className = 'momen-comment-form';
        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.placeholder = 'Tulis komentar...';
        commentInput.maxLength = 120;
        const commentSubmit = document.createElement('button');
        commentSubmit.type = 'submit';
        commentSubmit.textContent = 'Kirim';
        commentForm.appendChild(commentInput);
        commentForm.appendChild(commentSubmit);
        commentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const value = commentInput.value.trim();
            if (!value) return;

            const uploads = getStoredUploads();
            const target = uploads.find((entry) => entry.id === item.id);
            if (target) {
                target.comments = target.comments || [];
                target.comments.push(`${getCurrentGoogleUser()?.name || 'Pengguna'}: ${value}`);
                saveStoredUploads(uploads);
                renderUploadedMedia();
            }
        });
        commentsSection.appendChild(commentForm);
        card.appendChild(commentsSection);

        fragment.appendChild(card);
    });

    gallery.appendChild(fragment);
}

function updateUploadAccess(user = getCurrentGoogleUser()) {
    const button = getUploadButton();
    const input = getUploadInput();
    const status = getUploadStatusElement();
    const preview = getUploadPreviewElement();

    if (!button || !input || !status) return;

    const canUpload = Boolean(user && user.name);
    button.disabled = !canUpload;
    input.disabled = !canUpload;

    if (preview) {
        preview.innerHTML = '';
    }

    if (canUpload) {
        status.textContent = 'Akun Anda siap. Pilih foto atau video untuk diunggah.';
        status.classList.add('active');
    } else {
        status.textContent = 'Login Google dulu untuk mengunggah foto atau video.';
        status.classList.remove('active');
    }
}

async function handleMediaUploadSelection(event) {
    const input = event.target;
    const preview = getUploadPreviewElement();
    const file = input.files && input.files[0];

    if (!file) return;

    const user = getCurrentGoogleUser();
    if (!user || !user.name) {
        showToast('Login Google dulu untuk mengunggah foto atau video.');
        input.value = '';
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran file terlalu besar. Maksimal 10 MB.');
        input.value = '';
        return;
    }

    const fileType = file.type.startsWith('video/') ? 'Video' : 'Foto';
    const previewMessage = `Mengunggah ${fileType.toLowerCase()}...`;

    if (preview) {
        preview.innerHTML = `<strong>${escapeHtml(previewMessage)}</strong>`;
    }

    try {
        const reader = new FileReader();
        reader.onload = () => {
            const uploads = getStoredUploads();
            uploads.push({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: file.name,
                type: file.type,
                dataUrl: reader.result,
                uploader: user.name,
                email: user.email || '',
                uploadedAt: new Date().toISOString(),
                likes: 0,
                liked: false,
                comments: []
            });

            saveStoredUploads(uploads);
            renderUploadedMedia();

            if (preview) {
                preview.innerHTML = `<strong>${escapeHtml(fileType)} berhasil ditambahkan.</strong> ${escapeHtml(file.name)}`;
            }

            showToast(`${fileType} "${file.name}" berhasil ditambahkan ke momen.`);
            input.value = '';
        };

        reader.onerror = () => {
            showToast('Gagal membaca file. Coba lagi.');
            input.value = '';
        };

        reader.readAsDataURL(file);
    } catch (error) {
        showToast('Gagal mengunggah file.');
    }
}

function bindUploadEvents() {
    const button = getUploadButton();
    const input = getUploadInput();

    if (!button || !input) return;

    button.addEventListener('click', () => {
        const user = getCurrentGoogleUser();
        if (!user || !user.name) {
            showToast('Login Google dulu untuk mengunggah foto atau video.');
            return;
        }
        input.click();
    });

    input.addEventListener('change', handleMediaUploadSelection);
}

function persistGoogleUser(user) {
    if (!user) {
        localStorage.removeItem('googleUser');
        updateAuthButton(null);
        updateUploadAccess(null);
        return;
    }
    localStorage.setItem('googleUser', JSON.stringify(user));
    updateAuthButton(user);
    updateAuthStatus(user);
    updateUploadAccess(user);
}

function ensureGoogleClientInitialized() {
    if (!window.google || !window.google.accounts) {
        return false;
    }

    if (googleAuthReady) {
        renderGoogleSignInButton();
        return true;
    }

    if (!isGoogleConfigured()) {
        return false;
    }

    window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        ux_mode: 'popup',
        auto_select: false
    });

    googleAuthReady = true;
    renderGoogleSignInButton();
    return true;
}

function handleCredentialResponse(response) {
    const profile = parseJwt(response.credential);
    if (!profile) {
        showToast('Gagal membaca data akun Google.');
        return;
    }

    const user = {
        name: profile.name || profile.given_name || 'Google User',
        email: profile.email || '',
        picture: profile.picture || '',
        credential: response.credential
    };

    persistGoogleUser(user);
    showToast(`Halo, ${user.name}!`);
}

function startGoogleAuth(action = 'login') {
    closeAccountMenu();

    const buttonContainer = getGoogleSignInButtonContainer();
    if (buttonContainer) {
        buttonContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (!window.google || !window.google.accounts) {
        showToast('Menghubungkan ke Google, silakan tunggu sebentar...');

        const googleScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (googleScript) {
            googleScript.addEventListener('load', () => {
                if (ensureGoogleClientInitialized()) {
                    try {
                        window.google.accounts.id.prompt();
                    } catch (error) {
                        showToast('Tidak bisa membuka popup login Google. Coba klik tombol Google di atas.');
                    }
                }
            }, { once: true });
        }
        return;
    }

    if (!ensureGoogleClientInitialized()) {
        showToast('Google login belum siap. Coba refresh halaman lalu klik lagi.');
        return;
    }

    try {
        window.google.accounts.id.prompt((notification) => {
            if (notification && (notification.isNotDisplayed?.() || notification.isSkippedMoment?.())) {
                showToast(`${action === 'signup' ? 'Daftar' : 'Masuk'} dibatalkan atau belum tersedia. Silakan coba lagi.`);
            }
        });
    } catch (error) {
        showToast('Tidak bisa membuka popup login Google. Coba klik tombol Google di atas.');
    }
}

function handleGoogleSignOut() {
    localStorage.removeItem('googleUser');
    updateAuthButton(null);
    updateAuthStatus(null);
    updateUploadAccess(null);
    showToast('Berhasil keluar dari akun Google.');
    closeAccountMenu();
}

function toggleAccountMenu(event) {
    const accountMenu = getAccountMenu();
    const accountToggle = getAccountToggle();
    if (!accountMenu || !accountToggle) return;

    event.preventDefault();
    event.stopPropagation();

    accountMenu.classList.toggle('active');
}

function closeAccountMenu() {
    const accountMenu = getAccountMenu();
    if (!accountMenu) return;
    accountMenu.classList.remove('active');
}

function initializeGoogleAuth() {
    const savedUser = getCurrentGoogleUser();
    if (savedUser) {
        updateAuthButton(savedUser);
        updateAuthStatus(savedUser);
        updateUploadAccess(savedUser);
    } else {
        updateAuthStatus(null);
        updateUploadAccess(null);
    }

    renderUploadedMedia();

    if (window.google && window.google.accounts) {
        ensureGoogleClientInitialized();
        return;
    }

    const googleScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (googleScript) {
        googleScript.addEventListener('load', ensureGoogleClientInitialized);
    } else {
        window.addEventListener('load', ensureGoogleClientInitialized);
    }
}

function registerGoogleAuthHandlers() {
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.account-menu-wrapper')) {
            closeAccountMenu();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGoogleAuth();
    bindUploadEvents();
    registerGoogleAuthHandlers();
});

window.toggleAccountMenu = toggleAccountMenu;
window.closeAccountMenu = closeAccountMenu;
window.startGoogleAuth = startGoogleAuth;
window.handleGoogleSignOut = handleGoogleSignOut;
window.showToast = showToast;
