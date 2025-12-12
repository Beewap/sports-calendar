export const getMonthDays = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];

    // Get first day of the month (0 = Sunday, 1 = Monday, ...)
    let firstDay = date.getDay();
    // Adjust to make Monday (1) the first day of the week for display, Sunday (0) becomes 7
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
        const d = new Date(year, month, 1);
        d.setDate(d.getDate() - (firstDay - i));
        days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    while (date.getMonth() === month) {
        days.push({ date: new Date(date), isCurrentMonth: true });
        date.setDate(date.getDate() + 1);
    }

    // Next month padding to fill 6 weeks (42 days) grid
    while (days.length < 42) {
        days.push({ date: new Date(date), isCurrentMonth: false });
        date.setDate(date.getDate() + 1);
    }

    return days;
};

export const isClassDay = (date) => {
    const day = date.getDay();
    // 1 = Monday, 4 = Thursday, 6 = Saturday
    return day === 1 || day === 4 || day === 6;
};

export const toIsoDate = (date) => {
    return date.toISOString().split('T')[0];
};

export const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
};
