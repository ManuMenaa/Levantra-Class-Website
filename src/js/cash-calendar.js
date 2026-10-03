const START = new Date(2025, 6, 21);

export function periodsFromStart(now = new Date()) {
    const periods = [];
    for (let start = new Date(START); start <= now; start.setDate(start.getDate() + 7)) {
        const periodStart = new Date(start);
        const end = new Date(periodStart);
        end.setDate(end.getDate() + 6);
        const key = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
        periods.push({ start: periodStart, end, key, index: periods.filter(period => period.key === key).length });
    }
    return periods;
}

export function monthSheetName(key) {
    const [year, month] = key.split('-');
    return `Kas ${month}-${year}`;
}

export function sheetColumn(index) {
    let result = '';
    while (index > 0) {
        const remainder = (index - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        index = Math.floor((index - 1) / 26);
    }
    return result;
}