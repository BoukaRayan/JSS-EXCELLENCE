export const formatDate = (date) => {
    return date.split("-").reverse().join("/");
}

export const calculerAge = (dateNaiss) => {
    const today = new Date();
    const anNaiss = dateNaiss.getFullYear();
    const moisNaiss = dateNaiss.getMonth();
    const jourNaiss = dateNaiss.getDate();

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    let age = todayYear - anNaiss;

    if (todayMonth < moisNaiss || (todayMonth === moisNaiss && todayDay < jourNaiss)) {
        age--;
    }

    return age;
};