function sortArray(inputArray) {
    const completedItems = [];
    const uncompletedItems = [];

    inputArray.forEach(item => {
        if (item.status === 3) {
            completedItems.push(item);
        } else {
            uncompletedItems.push(item);
        }
    });

    return uncompletedItems.concat(completedItems);
}
function getStartDate(selectedDuration) {
    if (selectedDuration === -1) {
        return null; // Return null for "NEVER" case to indicate no date range filtering
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - selectedDuration);
    return startDate;
}

/**
 * 
 * @param {string} credit 
 * @param {string} key 
 * @returns Base64 encoding value
 */
function encryptCredit(credit, key) {
    if(typeof credit !== 'string') credit = `${credit}`;

    let encryptedCredit = '';
    for (let i = 0; i < credit.length; i++) {
        const charCode = credit.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encryptedCredit += String.fromCharCode(charCode);
    }
    return btoa(encryptedCredit);
}

/**
 * 
 * @param {string} encryptedCredit 
 * @param {string} key 
 * @returns Base64 decoding value
 */
function decryptCredit(encryptedCredit, key) {
    encryptedCredit = atob(encryptedCredit);
    let decryptedCredit = '';
    for (let i = 0; i < encryptedCredit.length; i++) {
        const charCode =
            encryptedCredit.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decryptedCredit += String.fromCharCode(charCode);
    }
    return decryptedCredit;
}
