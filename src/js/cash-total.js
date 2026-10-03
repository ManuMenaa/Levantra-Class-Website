export function isPaid(value) {
    return value === true || ['TRUE', 'SUDAH'].includes(String(value).trim().toUpperCase());
}

export function isCountedPaid(value) {
    return String(value).trim().toUpperCase() === 'SUDAH';
}

export function calculatePaidTotal(monthRows, periodsByMonth, studentAbsents, fee) {
    const validStudents = new Set(studentAbsents.map(String));
    let total = 0;

    for (const [month, rows] of monthRows) {
        const weekCount = periodsByMonth.get(month) || 0;
        const studentRows = new Map();
        rows.slice(2).forEach(row => {
            const absent = String(row[0] ?? '').trim();
            if (validStudents.has(absent) && !studentRows.has(absent)) studentRows.set(absent, row);
        });
        for (const row of studentRows.values()) {
            total += row.slice(2, weekCount + 2).filter(isCountedPaid).length * fee;
        }
    }

    return total;
}