/**
 * LEVANTRA - Google Authentication
 */

const googleClientIdMeta = document.querySelector('meta[name="google-client-id"]');
const googleClientId = window.LEVANTRA_GOOGLE_CLIENT_ID || (googleClientIdMeta ? googleClientIdMeta.getAttribute('content') : '');
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

function persistGoogleUser(user) {
    if (!user) {
        localStorage.removeItem('googleUser');
        updateAuthButton(null);
        return;
    }
    localStorage.setItem('googleUser', JSON.stringify(user));
    updateAuthButton(user);
    updateAuthStatus(user);
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

    if (!ensureGoogleClientInitialized()) {
        if (!window.google || !window.google.accounts) {
            showToast('Login Google belum siap, coba lagi sebentar.');
        } else {
            showToast('Tambahkan Client ID Google yang valid di meta tag untuk mengaktifkan login.');
        }
        return;
    }

    window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            showToast(`${action === 'signup' ? 'Daftar' : 'Masuk'} dibatalkan atau belum tersedia. Silakan coba lagi.`);
        }
    });
}

function handleGoogleSignOut() {
    localStorage.removeItem('googleUser');
    updateAuthButton(null);
    updateAuthStatus(null);
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
    const savedUser = localStorage.getItem('googleUser');
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            updateAuthButton(parsedUser);
            updateAuthStatus(parsedUser);
        } catch (error) {
            localStorage.removeItem('googleUser');
            updateAuthStatus(null);
        }
    } else {
        updateAuthStatus(null);
    }

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
    registerGoogleAuthHandlers();
});

window.toggleAccountMenu = toggleAccountMenu;
window.closeAccountMenu = closeAccountMenu;
window.startGoogleAuth = startGoogleAuth;
window.handleGoogleSignOut = handleGoogleSignOut;
window.showToast = showToast;
