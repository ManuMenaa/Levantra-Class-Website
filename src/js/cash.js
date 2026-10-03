/**
 * LEVANTRA - Unified Cash JS
 * Features:
 * - Class Cash System (Integrated with Google Sheets)
 */

// =============================================
// CONFIGURATION & CONSTANTS
// =============================================

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config.js';
import { STUDENT_DATA } from './student-data.js';
import { periodsFromStart, monthSheetName, sheetColumn } from './cash-calendar.js';
import { calculatePaidTotal, isCountedPaid, isPaid } from './cash-total.js';

const FEE = 5000;
const POLL_MS = 30000;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const ADMIN_EMAILS = ['sudanamanumain1@gmail.com', 'levantra.tsk@gmail.com'];
const head = document.getElementById('cashTableHead');
const body = document.getElementById('cashTableBody');
const foot = document.getElementById('cashTableFoot');
const monthSelect = document.getElementById('cashMonth');
const status = document.getElementById('cashStatus');
const access = document.getElementById('cashAccess');
const tokenButton = document.getElementById('cashGoogleConnect');
let allPeriods = [];
let selectedMonth;
let records = new Map();
let allTimeTotal = null;
let missingMonths = [];
let canEdit = false;
let accessToken = '';
let refreshTimer;
let refreshInProgress = false;
let pendingRefresh = false;
let localEditRevision = 0;

// =============================================
// CLASS CASH SYSTEM
// =============================================

function fillMonths() {
    const months = [...new Set(allPeriods.filter(item => item.start <= new Date()).map(item => item.key))];
    monthSelect.innerHTML = months.map(key => `<option value="${key}">${monthName(key)}</option>`).join('');
    selectedMonth = months.at(-1);
    monthSelect.value = selectedMonth || '';
}

function monthName(key) {
    const [year, month] = key.split('-').map(Number);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function periodLabel(period) {
    return `${formatDate(period.start)} - ${formatDate(period.end)}`;
}

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function render() {
    const now = new Date();
    const visiblePeriods = allPeriods.filter(item => item.key === selectedMonth && item.start <= now);
    head.innerHTML = `<tr><th class="cash-absent">Absen</th><th class="cash-name">Nama siswa</th>${visiblePeriods.map(period => `<th><small>Minggu ${period.index + 1}<br>${periodLabel(period)}</small></th>`).join('')}</tr>`;
    body.innerHTML = STUDENT_DATA.map(student => {
        const row = records.get(String(student.absent)) || [];
        return `<tr><th class="cash-absent" scope="row">${student.absent}</th><td class="cash-name">${student.name}</td>${visiblePeriods.map(period => {
            const paid = isPaid(row[period.index]);
            return `<td><label class="cash-check${canEdit ? ' is-editable' : ''}"><input type="checkbox" data-absent="${student.absent}" data-period="${period.index}"${paid ? ' checked' : ''}${canEdit ? '' : ' disabled'} aria-label="${periodLabel(period)}, ${student.name}, ${paid ? 'sudah bayar' : 'belum bayar'}"><span>${paid ? 'Sudah' : 'Belum'}</span></label></td>`;
        }).join('')}</tr>`;
    }).join('');

    const weekly = visiblePeriods.map(period => STUDENT_DATA.filter(student => {
        const value = (records.get(String(student.absent)) || [])[period.index];
        return isPaid(value);
    }).length * FEE);
    const monthTotal = weekly.reduce((sum, value) => sum + value, 0);
    const totalLabel = allTimeTotal === null ? 'Memuat...' : formatRupiah(allTimeTotal);
    const incompleteNote = missingMonths.length ? ` (belum lengkap: ${missingMonths.map(monthName).join(', ')})` : '';
    foot.innerHTML = `<tr><th class="cash-absent" colspan="2" scope="row"><span class="cash-total-label">Total per minggu</span></th>${weekly.map(total => `<td>${formatRupiah(total)}</td>`).join('')}</tr><tr><th class="cash-absent" colspan="2" scope="row"><span class="cash-total-label">Total bulan ${monthSelect.selectedOptions[0]?.textContent || ''}</span></th><td colspan="${visiblePeriods.length}">${formatRupiah(monthTotal)}</td></tr><tr class="cash-grand-total"><th class="cash-absent" colspan="2" scope="row"><span class="cash-total-label">Total kas keseluruhan${incompleteNote}</span></th><td colspan="${visiblePeriods.length}">${totalLabel}</td></tr>`;
    access.textContent = canEdit ? `Admin: ${auth.currentUser.email}` : 'Hanya lihat';
    access.dataset.editable = String(canEdit);
    tokenButton.hidden = !canEdit;
}

function fetchPublicSheet(monthPeriods, month) {
    if (!SHEET_ID) return Promise.reject(new Error('VITE_GOOGLE_SHEET_ID belum dikonfigurasi.'));
    const sheetName = monthSheetName(month);
    return new Promise((resolve, reject) => {
        const callback = `kasSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        const timeout = setTimeout(() => finish(new Error('Waktu membaca Google Sheets habis.')), 15000);
        function finish(error, data) {
            clearTimeout(timeout);
            delete window[callback];
            script.remove();
            error ? reject(error) : resolve(data);
        }
        window[callback] = response => {
            if (!response.table) return finish(new Error(`Tab ${sheetName} belum tersedia atau tidak dapat dibaca.`));
            finish(null, response.table.rows.map(row => (row.c || []).map(cell => cell?.v ?? '')));
        };
        script.onerror = () => finish(new Error(`Tab ${sheetName} belum tersedia atau spreadsheet belum dibagikan sebagai Viewer.`));
        const lastColumn = sheetColumn(monthPeriods.length + 2);
        script.src = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&range=A1:${lastColumn}${STUDENT_DATA.length + 2}&headers=0&tqx=${encodeURIComponent(`out:json;responseHandler:${callback}`)}&cache=${Date.now()}`;
        document.head.append(script);
    });
}

async function loadSheet(showLoading = true) {
    if (refreshInProgress) {
        pendingRefresh = true;
        return;
    }
    refreshInProgress = true;
    if (showLoading) setStatus('Membaca Google Sheets...', 'loading');
    const revision = localEditRevision;
    const month = selectedMonth;
    try {
        const months = [...new Set(allPeriods.map(item => item.key))];
        const monthRows = new Map();
        const missing = [];
        await Promise.all(months.map(async key => {
            const periods = allPeriods.filter(item => item.key === key);
            try {
                monthRows.set(key, await fetchPublicSheet(periods, key));
            } catch {
                missing.push(key);
            }
        }));
        if (revision !== localEditRevision || month !== selectedMonth) return;

        const nextRecords = new Map(STUDENT_DATA.map(student => [String(student.absent), []]));
        (monthRows.get(month) || []).slice(2).forEach(row => {
            const absent = String(row[0] ?? '').trim();
            if (absent) nextRecords.set(absent, row.slice(2));
        });
        const periodsByMonth = new Map(months.map(key => [key, allPeriods.filter(item => item.key === key).length]));
        allTimeTotal = calculatePaidTotal(monthRows, periodsByMonth, STUDENT_DATA.map(student => student.absent), FEE);
        missingMonths = missing;
        records = nextRecords;
        render();
        setStatus(missing.length
            ? `Data tersinkron sebagian; tab belum tersedia: ${missing.map(monthSheetName).join(', ')}`
            : `Tersinkron dari Google Sheets · diperbarui ${new Date().toLocaleTimeString('id-ID')}`, missing.length ? 'error' : 'success');
    } catch (error) {
        setStatus(error.message || 'Gagal membaca Google Sheets.', 'error');
    } finally {
        refreshInProgress = false;
        if (pendingRefresh) {
            pendingRefresh = false;
            loadSheet(false);
        }
    }
}

function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
}

async function connectGoogleSheets() {
    if (!auth.currentUser?.email) throw new Error('Masuk menggunakan akun Google admin terlebih dahulu.');
    if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID belum dikonfigurasi.');
    await new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) return resolve();
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Google Identity Services gagal dimuat.'));
        document.head.append(script);
    });
    const token = await new Promise((resolve, reject) => {
        window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: 'openid email https://www.googleapis.com/auth/spreadsheets',
            hint: auth.currentUser.email,
            prompt: 'select_account',
            callback: response => response.error ? reject(new Error(response.error_description || 'Akses Google ditolak.')) : resolve(response.access_token),
            error_callback: error => reject(new Error(error.message || 'Gagal meminta izin Google Sheets.'))
        }).requestAccessToken();
    });
    const identityResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
    const identity = await identityResponse.json();
    if (!identityResponse.ok || identity.email_verified !== true || !ADMIN_EMAILS.includes(String(identity.email).toLowerCase())) {
        throw new Error('Akun Google yang dipilih bukan admin kas.');
    }
    accessToken = token;
}

async function ensureMonthSheet(monthPeriods) {
    const spreadsheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}`;
    const metadataResponse = await fetch(`${spreadsheetUrl}?fields=sheets.properties(sheetId,title,gridProperties(columnCount))`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!metadataResponse.ok) throw new Error(await metadataResponse.text() || 'Gagal memeriksa ukuran Google Sheet.');
    const spreadsheet = await metadataResponse.json();
    const title = monthSheetName(monthPeriods[0]?.key || selectedMonth);
    let sheet = spreadsheet.sheets?.find(item => item.properties.title === title);
    if (!sheet) {
        const columnCount = monthPeriods.length + 2;
        const createResponse = await fetch(`${spreadsheetUrl}:batchUpdate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: STUDENT_DATA.length + 2, columnCount } } } }] })
        });
        if (!createResponse.ok) throw new Error(await createResponse.text() || `Gagal membuat tab ${title}.`);
        sheet = (await createResponse.json()).replies?.[0]?.addSheet;
        const values = [
            ['Absen', 'Nama siswa', ...monthPeriods.map((_, index) => `Minggu ${index + 1}`)],
            ['', '', ...monthPeriods.map(periodLabel)],
            ...STUDENT_DATA.map(student => [student.absent, student.name, ...monthPeriods.map(() => 'Belum')])
        ];
        const initRange = encodeURIComponent(`'${title}'!A1:${sheetColumn(columnCount)}${STUDENT_DATA.length + 2}`);
        const initResponse = await fetch(`${spreadsheetUrl}/values/${initRange}?valueInputOption=RAW`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values })
        });
        if (!initResponse.ok) throw new Error(await initResponse.text() || `Gagal menginisialisasi tab ${title}.`);
        return sheet;
    }

    return sheet;
}

async function writeCell(absent, periodIndex, paid) {
    if (!accessToken) await connectGoogleSheets();
    localEditRevision++;
    const student = STUDENT_DATA.find(item => String(item.absent) === String(absent));
    if (!student) throw new Error(`Nomor absen ${absent} tidak dikenal.`);
    const item = allPeriods.find(period => period.key === selectedMonth && period.index === periodIndex);
    if (!item) throw new Error('Minggu kas tidak dikenal.');
    const previousValue = (records.get(String(absent)) || [])[periodIndex];
    const sheetRow = Number(absent) + 2;
    const monthPeriods = allPeriods.filter(period => period.key === item.key && period.start <= new Date());
    await ensureMonthSheet(monthPeriods);
    const sheetCol = sheetColumn(item.index + 3);
    const range = encodeURIComponent(`'${monthSheetName(item.key)}'!${sheetCol}${sheetRow}`);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[paid ? 'Sudah' : 'Belum']] })
    });
    if (response.status === 401) accessToken = '';
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Gagal menyimpan perubahan ke Google Sheets.');
    }
    const row = records.get(String(absent)) || [];
    row[periodIndex] = paid ? 'Sudah' : 'Belum';
    records.set(String(absent), row);
    if (allTimeTotal !== null) allTimeTotal += (Number(paid) - Number(isCountedPaid(previousValue))) * FEE;
    render();
    setStatus('Perubahan tersimpan di Google Sheets.', 'success');
}

body.addEventListener('change', async event => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox || !canEdit) return;
    const paid = checkbox.checked;
    checkbox.disabled = true;
    setStatus('Menyimpan perubahan...', 'loading');
    try {
        await writeCell(checkbox.dataset.absent, Number(checkbox.dataset.period), paid);
    } catch (error) {
        checkbox.checked = !paid;
        checkbox.disabled = false;
        setStatus(`Tidak tersimpan: ${error.message}`, 'error');
    }
});

document.getElementById('cashRefresh').addEventListener('click', () => loadSheet());
tokenButton.addEventListener('click', async () => {
    try {
        await connectGoogleSheets();
        const monthPeriods = allPeriods.filter(item => item.key === selectedMonth);
        await ensureMonthSheet(monthPeriods);
        await loadSheet();
        setStatus(`Akses edit terhubung · ${monthSheetName(selectedMonth)} siap.`, 'success');
    } catch (error) {
        setStatus(error.message, 'error');
    }
});

const now = new Date();
allPeriods = periodsFromStart(new Date(now.getFullYear(), now.getMonth() + 1, 0));
fillMonths();
render();
loadSheet();
refreshTimer = setInterval(() => loadSheet(false), POLL_MS);
window.addEventListener('beforeunload', () => clearInterval(refreshTimer));
onAuthStateChanged(auth, user => {
    canEdit = Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
    accessToken = '';
    render();
});
monthSelect.addEventListener('change', () => {
    selectedMonth = monthSelect.value;
    records = new Map();
    render();
    loadSheet();
});
