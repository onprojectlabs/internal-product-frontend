export const getRelativeDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

export const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
