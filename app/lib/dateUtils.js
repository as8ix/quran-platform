export const getHijriDate = (date = new Date()) => {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const getGregorianDate = (date = new Date()) => {
    return new Intl.DateTimeFormat('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const getDayName = (date = new Date()) => {
    return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
};

export const getWeekDays = () => {
    // Logic to get the current week's Sunday to Wednesday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Calculate start of week (Sunday)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    const week = [];
    // Only Sunday (0) to Wednesday (3)
    for (let i = 0; i <= 3; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        week.push({
            date: d,
            dayName: getDayName(d),
            hijri: getHijriDate(d),
            gregorian: getGregorianDate(d),
            isToday: d.toDateString() === today.toDateString()
        });
    }
    return week;
};
