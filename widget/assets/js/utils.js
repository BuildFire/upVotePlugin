function sortArray(status, array) {
    function sortByStatusAndDate(a, b) {
        if (a.status === 3 && b.status !== 3) {
            return -1;
        } else if (a.status !== 3 && b.status === 3) {
            return 1;
        } else {
            return new Date(b.createdOn) - new Date(a.createdOn);
        }
    }

    function moveCompletedToBottom(arr) {
        const status3Objects = arr.filter((obj) => obj.status === 3);
        const nonStatus3Objects = arr.filter((obj) => obj.status !== 3);
        return [...nonStatus3Objects, ...status3Objects];
    }

    let sortedArray = [];

    switch (status) {
        case DEFAULT_ITEM_SORTING_SEGMENT.NEWEST:
            sortedArray = array.sort(sortByStatusAndDate);
            sortedArray = moveCompletedToBottom(sortedArray);
            break;
        case DEFAULT_ITEM_SORTING_SEGMENT.OLDEST:
            sortedArray = array.sort((a, b) => -sortByStatusAndDate(a, b));
            sortedArray = moveCompletedToBottom(sortedArray);
            break;
        case DEFAULT_ITEM_SORTING_SEGMENT.MOST_VOTES:
            sortedArray = array.sort((a, b) => {
                if (a.status === 3 && b.status !== 3) {
                    return -1;
                } else if (a.status !== 3 && b.status === 3) {
                    return 1;
                } else {
                    return b.upVoteCount - a.upVoteCount;
                }
            });
            sortedArray = moveCompletedToBottom(sortedArray);
            break;
        default:
            break;
    }

    return sortedArray;
}

function getStartDate(selectedDuration) {
    if (selectedDuration === HIDE_COMPLETED_ITEMS_SEGMENT.NEVER) {
        return null; // Return null for "NEVER" case to indicate no date range filtering
    }

    const startDate = new Date();
    switch (selectedDuration) {
        case HIDE_COMPLETED_ITEMS_SEGMENT.ONE_DAY:
            startDate.setDate(startDate.getDate() - 1);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.THREE_DAYS:
            startDate.setDate(startDate.getDate() - 3);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.FIVE_DAYS:
            startDate.setDate(startDate.getDate() - 5);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.SEVEN_DAYS:
            startDate.setDate(startDate.getDate() - 7);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.TEN_DAYS:
            startDate.setDate(startDate.getDate() - 10);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.FIFTEEN_DAYS:
            startDate.setDate(startDate.getDate() - 15);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.THIRTY_DAYS:
            startDate.setDate(startDate.getDate() - 30);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.SIXTY_DAYS:
            startDate.setDate(startDate.getDate() - 60);
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.NINETY_DAYS:
            startDate.setDate(startDate.getDate() - 90);
            break;
        default:
            // For IMMEDIATELY , no need to modify the start date
            break;
    }
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
