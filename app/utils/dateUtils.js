export const formatHijri = (dateInput, type = 'long') => {
    if (!dateInput) return '';
    const date = new Date(dateInput);

    const options = {
        calendar: 'islamic-umalqura',
        numberingSystem: 'latn' // Ensure numbers are 123 not Arabic indic if preferred, but user might want Arabic. 
        // Let's stick to default for 'ar-SA' which usually uses Arabic-Indic digits (١٢٣) or Western (123) depending on locale.
        // User reports showed "Tuesday 5" etc. 
        // Let's use 'ar-SA' locale.
    };

    if (type === 'long') {
        // e.g. "الثلاثاء 2 رجب 1447"
        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    if (type === 'short') {
        // e.g. "2 رجب"
        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long'
        }).format(date);
    }

    if (type === 'numeric') {
        // e.g. "1447/07/02"
        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    }

    return date.toLocaleDateString('ar-SA-u-ca-islamic-umalqura');
};

export const getHijriMonthName = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const getHijriMonthStart = (dateInput = new Date()) => {
    const date = new Date(dateInput);
    const dayFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });

    const tempDate = new Date(date);
    for (let i = 0; i < 35; i++) {
        const hijriDay = parseInt(dayFormatter.format(tempDate));
        if (hijriDay === 1) {
            tempDate.setHours(0, 0, 0, 0);
            return tempDate;
        }
        tempDate.setDate(tempDate.getDate() - 1);
    }
    return tempDate;
};

export const getArabicLabel = (count, type) => {
    const num = Math.floor(Math.abs(count));
    if (type === 'juz') {
        if (num === 0) return 'جزء';
        if (num === 1) return 'جزء';
        if (num === 2) return 'جزآن';
        if (num >= 3 && num <= 10) return 'أجزاء';
        return 'جزءاً';
    }
    if (type === 'day') {
        if (num === 0) return 'يوم';
        if (num === 1) return 'يوم';
        if (num === 2) return 'يومان';
        if (num >= 3 && num <= 10) return 'أيام';
        return 'يوماً';
    }
    if (type === 'page') {
        if (num === 0) return 'صفحة';
        if (num === 1) return 'صفحة';
        if (num === 2) return 'صفحتان';
        if (num >= 3 && num <= 10) return 'صفحات';
        return 'صفحةً';
    }
    return '';
};
