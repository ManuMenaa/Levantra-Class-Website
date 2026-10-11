/**
 * LEVANTRA - Unified Schedule JS
 * Features:
 * - Admin schedule management
 * - Real-time Firebase sync
 * - Schedule image upload and preview
 * - Schedule download
 */

import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { showToast, openModal, closeModal, ADMIN_EMAILS, IMGBB_API_KEY } from './app.js';

// State
let currentUser = null;
let isAdmin = false;
let schedules = [];
let selectedScheduleId = null;

// DOM Elements
const scheduleSelect = document.getElementById('scheduleSelect');
const addScheduleBtn = document.getElementById('addScheduleBtn');
const scheduleCard = document.getElementById('scheduleCard');
const scheduleImg = document.getElementById('scheduleImg');
const scheduleTitle = document.getElementById('scheduleTitle');
const scheduleEmptyState = document.getElementById('scheduleEmptyState');
const scheduleLoadingState = document.getElementById('scheduleLoadingState');
const emptyAddScheduleBtn = document.getElementById('emptyAddScheduleBtn');

// Action Buttons
const zoomScheduleBtn = document.getElementById('zoomScheduleBtn');
const downloadScheduleBtn = document.getElementById('downloadScheduleBtn');
const editScheduleBtn = document.getElementById('editScheduleBtn');
const deleteScheduleBtn = document.getElementById('deleteScheduleBtn');

// Modals & Inputs
const uploadModal = document.getElementById('scheduleUploadModal');
const editModal = document.getElementById('scheduleEditModal');
const lightboxModal = document.getElementById('scheduleLightboxModal');

const newScheduleTitle = document.getElementById('newScheduleTitle');
const newScheduleFile = document.getElementById('newScheduleFile');
const uploadScheduleSubmitBtn = document.getElementById('uploadScheduleSubmitBtn');

const editScheduleId = document.getElementById('editScheduleId');
const editScheduleTitle = document.getElementById('editScheduleTitle');
const editScheduleFile = document.getElementById('editScheduleFile');
const saveScheduleSubmitBtn = document.getElementById('saveScheduleSubmitBtn');

const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    initScheduleApp();
});

function initScheduleApp() {
    // Auth Listener
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
        updateAdminControls();
    });

    // Event Listeners for Controls
    if (scheduleSelect) {
        scheduleSelect.addEventListener('change', (e) => {
            selectSchedule(e.target.value);
        });
    }

    const openUploadModal = () => {
        if (!isAdmin) {
            showToast('Hanya admin yang dapat menambah jadwal.', 'error');
            return;
        }
        openScheduleUploadModal();
    };

    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', openUploadModal);
    }

    if (emptyAddScheduleBtn) {
        emptyAddScheduleBtn.addEventListener('click', openUploadModal);
    }

    if (zoomScheduleBtn) {
        zoomScheduleBtn.addEventListener('click', openLightbox);
    }

    if (downloadScheduleBtn) {
        downloadScheduleBtn.addEventListener('click', downloadCurrentSchedule);
    }

    if (editScheduleBtn) {
        editScheduleBtn.addEventListener('click', () => {
            if (!isAdmin) {
                showToast('Hanya admin yang dapat mengedit jadwal.', 'error');
                return;
            }
            openScheduleEditModal();
        });
    }

    if (deleteScheduleBtn) {
        deleteScheduleBtn.addEventListener('click', () => {
            if (!isAdmin) {
                showToast('Hanya admin yang dapat menghapus jadwal.', 'error');
                return;
            }
            deleteCurrentSchedule();
        });
    }

    if (uploadScheduleSubmitBtn) {
        uploadScheduleSubmitBtn.addEventListener('click', handleUploadSchedule);
    }

    if (saveScheduleSubmitBtn) {
        saveScheduleSubmitBtn.addEventListener('click', handleSaveEditSchedule);
    }

    // Load Schedules from RTDB
    listenSchedules();
}

// =============================================
// ADMIN CONTROLS VISIBILITY
// =============================================

function updateAdminControls() {
    const adminElements = [addScheduleBtn, editScheduleBtn, deleteScheduleBtn];
    adminElements.forEach((el) => {
        if (!el) return;
        if (isAdmin) {
            el.hidden = false;
            el.style.display = '';
        } else {
            el.hidden = true;
            el.style.display = 'none';
        }
    });
}

// =============================================
// DATABASE REALTIME SYNC
// =============================================

function listenSchedules() {
    if (!db) {
        console.error('Database is not initialized.');
        if (scheduleLoadingState) scheduleLoadingState.style.display = 'none';
        if (scheduleEmptyState) {
            scheduleEmptyState.hidden = false;
            scheduleEmptyState.style.display = 'flex';
        }
        return;
    }

    const schedulesRef = ref(db, 'schedules');
    onValue(schedulesRef, (snapshot) => {
        const data = snapshot.val();
        schedules = [];

        if (data) {
            Object.keys(data).forEach((key) => {
                schedules.push({
                    id: key,
                    ...data[key]
                });
            });
            schedules.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }

        renderScheduleDropdown();
    }, (error) => {
        console.error('Error fetching schedules:', error);
        showToast('Gagal memuat data jadwal: ' + error.message, 'error');
        if (scheduleLoadingState) scheduleLoadingState.style.display = 'none';
    });
}

// =============================================
// DROPDOWN & DISPLAY RENDERING
// =============================================

function renderScheduleDropdown() {
    if (scheduleLoadingState) scheduleLoadingState.style.display = 'none';

    if (!scheduleSelect) return;

    scheduleSelect.innerHTML = '';

    if (schedules.length === 0) {
        // Empty
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Belum Ada Jadwal --';
        scheduleSelect.appendChild(emptyOption);
        scheduleSelect.disabled = true;

        if (scheduleCard) {
            scheduleCard.hidden = true;
            scheduleCard.style.display = 'none';
        }
        if (scheduleEmptyState) {
            scheduleEmptyState.hidden = false;
            scheduleEmptyState.style.display = 'flex';
        }
        if (emptyAddScheduleBtn) {
            emptyAddScheduleBtn.hidden = !isAdmin;
            emptyAddScheduleBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        }

        disableActionButtons(true);
        selectedScheduleId = null;
        return;
    }

    // Has Schedule
    scheduleSelect.disabled = false;
    if (scheduleEmptyState) {
        scheduleEmptyState.hidden = true;
        scheduleEmptyState.style.display = 'none';
    }
    if (emptyAddScheduleBtn) {
        emptyAddScheduleBtn.hidden = true;
        emptyAddScheduleBtn.style.display = 'none';
    }

    schedules.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.title;
        scheduleSelect.appendChild(option);
    });

    // Retain the previous selection if it still exists, or choose the first one
    const itemExists = schedules.some((s) => s.id === selectedScheduleId);
    if (!itemExists) {
        selectedScheduleId = schedules[0].id;
    }

    scheduleSelect.value = selectedScheduleId;
    selectSchedule(selectedScheduleId);
}

function selectSchedule(id) {
    selectedScheduleId = id;
    const current = schedules.find((s) => s.id === id);

    if (!current) {
        if (scheduleCard) {
            scheduleCard.hidden = true;
            scheduleCard.style.display = 'none';
        }
        disableActionButtons(true);
        return;
    }

    if (scheduleCard) {
        scheduleCard.hidden = false;
        scheduleCard.style.display = 'flex';
    }

    if (scheduleTitle) {
        scheduleTitle.textContent = current.title;
    }

    if (scheduleImg) {
        scheduleImg.style.opacity = '0.4';
        scheduleImg.src = current.imageUrl;
        scheduleImg.alt = current.title;
        scheduleImg.onload = () => {
            scheduleImg.style.opacity = '1';
        };
        scheduleImg.onerror = () => {
            scheduleImg.style.opacity = '1';
            showToast('Gagal memuat gambar jadwal.', 'error');
        };
    }

    disableActionButtons(false);
}

function disableActionButtons(disabled) {
    if (zoomScheduleBtn) zoomScheduleBtn.disabled = disabled;
    if (downloadScheduleBtn) downloadScheduleBtn.disabled = disabled;
    if (editScheduleBtn) editScheduleBtn.disabled = disabled;
    if (deleteScheduleBtn) deleteScheduleBtn.disabled = disabled;
}

// =============================================
// MODAL CONTROLS
// =============================================

function openScheduleUploadModal() {
    if (newScheduleTitle) newScheduleTitle.value = '';
    if (newScheduleFile) newScheduleFile.value = '';
    openModal(uploadModal);
}

function openScheduleEditModal() {
    const current = schedules.find((s) => s.id === selectedScheduleId);
    if (!current) return;

    if (editScheduleId) editScheduleId.value = current.id;
    if (editScheduleTitle) editScheduleTitle.value = current.title;
    if (editScheduleFile) editScheduleFile.value = '';

    openModal(editModal);
}

function openLightbox() {
    const current = schedules.find((s) => s.id === selectedScheduleId);
    if (!current) return;

    if (lightboxImg) {
        lightboxImg.src = current.imageUrl;
        lightboxImg.alt = current.title;
    }
    if (lightboxCaption) {
        lightboxCaption.textContent = current.title;
    }

    openModal(lightboxModal);
}

// =============================================
// IMGBB UPLOAD & CRUD HANDLERS
// =============================================

const ALLOWED_SCHEDULE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SCHEDULE_IMAGE_SIZE = 5 * 1024 * 1024;

function validateScheduleImage(file) {
    if (!file) {
        throw new Error('Silakan pilih file gambar jadwal terlebih dahulu!');
    }
    if (!ALLOWED_SCHEDULE_IMAGE_TYPES.has(file.type)) {
        throw new Error('Gambar harus berbentuk JPG, PNG, atau WebP.');
    }
    if (file.size > MAX_SCHEDULE_IMAGE_SIZE) {
        throw new Error('Gambar jadwal tidak boleh lebih dari 5 MB.');
    }
}

async function uploadToImgBB(file) {
    validateScheduleImage(file);

    if (!IMGBB_API_KEY) {
        throw new Error('API Key ImgBB belum dikonfigurasi di file environment.');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error?.message || 'Gagal mengunggah gambar ke ImgBB.');
    }

    return data.data.url;
}

async function handleUploadSchedule() {
    if (!isAdmin) {
        showToast('Akses ditolak. Hanya admin yang diizinkan.', 'error');
        return;
    }

    const title = newScheduleTitle?.value?.trim();
    const file = newScheduleFile?.files?.[0];

    if (!title) {
        showToast('Judul jadwal tidak boleh kosong!', 'error');
        return;
    }
    if (title.length > 120) {
        showToast('Judul jadwal tidak boleh lebih dari 120 karakter!', 'error');
        return;
    }
    if (!file) {
        showToast('Silakan pilih file gambar jadwal terlebih dahulu!', 'error');
        return;
    }

    const originalBtnText = uploadScheduleSubmitBtn.innerHTML;
    uploadScheduleSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';
    uploadScheduleSubmitBtn.disabled = true;

    try {
        showToast('Mengunggah gambar ke ImgBB...', 'info');
        const imageUrl = await uploadToImgBB(file);

        showToast('Menyimpan ke database...', 'info');
        const schedulesRef = ref(db, 'schedules');
        const newRef = await push(schedulesRef, {
            title: title,
            imageUrl: imageUrl,
            authorEmail: currentUser.email,
            createdAt: Date.now()
        });

        // Set the newly added schedule as an active item
        selectedScheduleId = newRef.key;

        closeModal('scheduleUploadModal');
        showToast(`Jadwal "${title}" berhasil ditambahkan!`, 'success');
    } catch (error) {
        console.error('Error adding schedule:', error);
        showToast('Gagal menambahkan jadwal: ' + error.message, 'error');
    } finally {
        uploadScheduleSubmitBtn.innerHTML = originalBtnText;
        uploadScheduleSubmitBtn.disabled = false;
    }
}

async function handleSaveEditSchedule() {
    if (!isAdmin) {
        showToast('Akses ditolak. Hanya admin yang diizinkan.', 'error');
        return;
    }

    const id = editScheduleId?.value;
    const title = editScheduleTitle?.value?.trim();
    const file = editScheduleFile?.files?.[0];

    if (!id) return;
    if (!title) {
        showToast('Judul jadwal tidak boleh kosong!', 'error');
        return;
    }
    if (title.length > 120) {
        showToast('Judul jadwal tidak boleh lebih dari 120 karakter!', 'error');
        return;
    }
    if (file) {
        try {
            validateScheduleImage(file);
        } catch (error) {
            showToast(error.message, 'error');
            return;
        }
    }

    const originalBtnText = saveScheduleSubmitBtn.innerHTML;
    saveScheduleSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    saveScheduleSubmitBtn.disabled = true;

    try {
        const updateData = {
            title: title,
            updatedAt: Date.now()
        };

        if (file) {
            showToast('Mengunggah gambar baru ke ImgBB...', 'info');
            const imageUrl = await uploadToImgBB(file);
            updateData.imageUrl = imageUrl;
        }

        const scheduleItemRef = ref(db, `schedules/${id}`);
        await update(scheduleItemRef, updateData);

        closeModal('scheduleEditModal');
        showToast(`Jadwal "${title}" berhasil diperbarui!`, 'success');
    } catch (error) {
        console.error('Error updating schedule:', error);
        showToast('Gagal memperbarui jadwal: ' + error.message, 'error');
    } finally {
        saveScheduleSubmitBtn.innerHTML = originalBtnText;
        saveScheduleSubmitBtn.disabled = false;
    }
}

async function deleteCurrentSchedule() {
    if (!isAdmin) {
        showToast('Akses ditolak. Hanya admin yang diizinkan.', 'error');
        return;
    }

    const current = schedules.find((s) => s.id === selectedScheduleId);
    if (!current) return;

    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus jadwal "${current.title}"?`);
    if (!confirmDelete) return;

    try {
        showToast('Menghapus jadwal...', 'info');
        const scheduleItemRef = ref(db, `schedules/${current.id}`);
        await remove(scheduleItemRef);
        showToast(`Jadwal "${current.title}" berhasil dihapus.`, 'success');
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Gagal menghapus jadwal: ' + error.message, 'error');
    }
}

// =============================================
// DOWNLOAD HANDLER
// =============================================

async function downloadCurrentSchedule() {
    const current = schedules.find((s) => s.id === selectedScheduleId);
    if (!current || !current.imageUrl) return;

    showToast('Memulai pengunduhan gambar...', 'info');

    try {
        const response = await fetch(current.imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        const cleanName = current.title.replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `${cleanName || 'jadwal-levantra'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        showToast('Gambar jadwal berhasil diunduh!', 'success');
    } catch (err) {
        console.warn('Direct blob download failed, falling back to window.open:', err);
        window.open(current.imageUrl, '_blank');
        showToast('Gambar dibuka di tab baru untuk disimpan.', 'info');
    }
}
