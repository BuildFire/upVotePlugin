
const commentInput = document.getElementById("comments")
const allowAllUsersStatusUpdate = document.getElementById("statusUpdateAllUsers")
const allowNoUsersStatusUpdate = document.getElementById("statusUpdateNoUsers")
const allowUsersWithStatusUpdate = document.getElementById("statusUpdateUsersWith")

const itemPushNotificationAllUsers = document.getElementById("pushNotificationAllUsers")
const itemPushNotificationNoUsers = document.getElementById("pushNotificationNoUsers")
const itemPushNotificationUsersWith = document.getElementById("pushNotificationUsersWith")
const userTagsContainer = document.getElementById("userTagsContainer")
const itemPushNotificationTagsContainer = document.getElementById("itemPushNotificationTagsContainer")


const statusUpdatetagsInputContainer = new buildfire.components.control.tagsInput("#statusUpdatetagsInputContainer", {
    languageSettings:{
        placeholder: "Select Tags",
    },
    settings:{
        sourceType: 'custom',
        source: (options, callback) => { 
        buildfire.auth.showTagsSearchDialog(null, (err, result) => {
            if (err) return console.log(err);

            if (result && result.length) {
                let allTags = result.map(tag => ({value: tag.tagName}));
                settings.statusUpdateTags = result;
                save();
                callback(allTags);
            }
        });
        },
        allowAutoComplete: true,
        allowUserInput: true,
    }
});
const pushNotificationtagsInputContainer = new buildfire.components.control.tagsInput("#pushNotificationtagsInputContainer", {
    languageSettings:{
        placeholder: "Select Tags",
    },
    settings:{
        sourceType: 'custom',
        source: (options, callback) => { 
        buildfire.auth.showTagsSearchDialog(null, (err, result) => {
            if (err) return console.log(err);

            if (result && result.length) {
                let allTags = result.map(tag => ({value: tag.tagName}));
                settings.pushNotificationTags = result;
                save();
                callback(allTags);
            }
        });
        },
        allowAutoComplete: true,
        allowUserInput: true,
    }
});

const openDropdown = (e) => {
    e.stopPropagation();
    const sortDropdown = document.querySelector('#hideCompletedDropdown');
    toggleDropdown(sortDropdown);
    document.body.onclick = () => {
        toggleDropdown(sortDropdown, true);
    };
};

const toggleDropdown = (dropdownElement, forceClose) => {
    if (!dropdownElement) {
        return;
    }
    if (dropdownElement.classList.contains('open') || forceClose) {
        dropdownElement.classList.remove('open');
    } else {
        dropdownElement.classList.add('open');
    }
};

statusUpdatetagsInputContainer.onUpdate = (data) => {
    settings.statusUpdateTags = data.tags;

    save();
}

pushNotificationtagsInputContainer.onUpdate = (data) => {
    settings.pushNotificationTags = data.tags;
    save();
}

var settings = {}


const init = () => {
    Settings.get((err, result)=>{
        settings = result;
        if(result.enableComments){
            commentInput.checked = true;
        }
        setCheckedInputAllowUsersStatus(result.statusUpdateUsersSegment)
        setCheckedInputItemPushNotification(result.pushNotificationUsersSegment)
        setCheckedInputDefaultItemSorting(result.defaultItemSorting)
        setDropdownCompletedItems(result.hideCompletedItems);
        if(settings.statusUpdateTags && settings.statusUpdateTags.length){
            statusUpdatetagsInputContainer.set(settings.statusUpdateTags);
        }
        if(settings.pushNotificationTags && settings.pushNotificationTags.length){
            pushNotificationtagsInputContainer.set(settings.pushNotificationTags);
        }
        showUsersTagsContainer();
        showItemPushNotificationTagsContainer();
    })
}

const showUsersTagsContainer = () => {
    userTagsContainer.style.display = allowUsersWithStatusUpdate.checked ? "block" : "none"
}
const showItemPushNotificationTagsContainer = () => {
    itemPushNotificationTagsContainer.style.display = itemPushNotificationUsersWith.checked ? "block" : "none"
}

const setCheckedInputAllowUsersStatus = (status) => {
    switch (status) {
        case STATUS_UPDATE_SEGMENT.ALL_USERS:
            allowAllUsersStatusUpdate.checked = true;
        break;
        case STATUS_UPDATE_SEGMENT.NO_USERS:
            allowNoUsersStatusUpdate.checked = true;
        break;
        case STATUS_UPDATE_SEGMENT.TAGS:
            allowUsersWithStatusUpdate.checked = true;
        break;
        default:
            allowNoUsersStatusUpdate.checked = true;
        break;
    } 
    
    showUsersTagsContainer();
}

const setCheckedInputItemPushNotification = (status) => {
    switch (status) {
        case PUSH_NOTIFICATIONS_SEGMENT.ALL_USERS:
            itemPushNotificationAllUsers.checked = true;
        break;
        case PUSH_NOTIFICATIONS_SEGMENT.NO_USERS:
            itemPushNotificationNoUsers.checked = true;
        break;
        case PUSH_NOTIFICATIONS_SEGMENT.TAGS:
            itemPushNotificationUsersWith.checked = true;
        break;
        default:
            itemPushNotificationNoUsers.checked = true;
        break;
    } 
    
    showItemPushNotificationTagsContainer();
}

const setCheckedInputDefaultItemSorting = (status) => {
    switch (status) {
        case DEFAULT_ITEM_SORTING_SEGMENT.NEWEST:
            newestSorting.checked = true;
        break;
        case DEFAULT_ITEM_SORTING_SEGMENT.OLDEST:
            oldestSorting.checked = true;
        break;
        case DEFAULT_ITEM_SORTING_SEGMENT.MOST_VOTES:
            mostVotesSorting.checked = true;
        break;
        default:
            newestSorting.checked = true;
        break;
    } 
    
}

const setDropdownCompletedItems = (status) => {
    const sortTextElem = document.querySelector('#defaultDropdownTxt');
    let dropdownText = '';
    switch (status) {
        case HIDE_COMPLETED_ITEMS_SEGMENT.IMMEDIATELY:
            dropdownText = 'Immediately';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.ONE_DAY:
            dropdownText = '1 day (24 hours)';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.THREE_DAYS:
            dropdownText = '3 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.FIVE_DAYS:
            dropdownText = '5 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.SEVEN_DAYS:
            dropdownText = '7 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.TEN_DAYS:
            dropdownText = '10 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.FIFTEEN_DAYS:
            dropdownText = '15 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.THIRTY_DAYS:
            dropdownText = '30 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.SIXTY_DAYS:
            dropdownText = '60 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.NINETY_DAYS:
            dropdownText = '90 days';
            break;
        case HIDE_COMPLETED_ITEMS_SEGMENT.NEVER:
            dropdownText = 'Never';
            break;
        default:
            dropdownText = 'Immediately';
            break;
    }

    sortTextElem.innerText = dropdownText;
};

const updateCommentsProperty = () => {
    settings.enableComments = commentInput.checked;
    save();
}

const changeStatusUpdate = (status) => {
    setCheckedInputAllowUsersStatus(status)
    settings.statusUpdateUsersSegment = status;
    save();
}

const changeItemPushNotification = (status) => {
    setCheckedInputItemPushNotification(status)
    settings.pushNotificationUsersSegment = status;
    save();
}

const changeDefaultItemSorting = (status) =>{
    setCheckedInputDefaultItemSorting(status);
    settings.defaultItemSorting = status;
    save();
}

const changeHideCompletedItems = (status) =>{
    setDropdownCompletedItems(status);
    settings.hideCompletedItems = status;
    save();
}

const save = () => {
    Settings.save(settings,()=>{})

    buildfire.messaging.sendMessageToWidget({
        type: 'UpdateSettings',
        data: settings
    });
}

init();
