
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

const openDropdown = (e,dropdownFor) => {
    e.stopPropagation();
    let dropdown;
    if(dropdownFor === 'inAppPurchaseDropdown'){
        dropdown = document.querySelector('#inAppPurchaseDropdown');
    }else{
        dropdown = document.querySelector('#hideCompletedDropdown');
    }
    toggleDropdown(dropdown);
    document.body.onclick = () => {
        toggleDropdown(dropdown, true);
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
        showVotesPerPurchaseInput(result.productId);
        setVotesNumberInput(result.votesPerPurchase);
        if(settings.statusUpdateTags && settings.statusUpdateTags.length){
            statusUpdatetagsInputContainer.set(settings.statusUpdateTags);
        }
        if(settings.pushNotificationTags && settings.pushNotificationTags.length){
            pushNotificationtagsInputContainer.set(settings.pushNotificationTags);
        }
        showUsersTagsContainer();
        showItemPushNotificationTagsContainer();
    }).then(()=>{
        Settings.getProducts().then(products =>{
            let currentProduct = (products.find(product => product.id === settings.productId));
            if(currentProduct && currentProduct.name && currentProduct.id !== null){
                setDropdownInAppPurchase(currentProduct.name);
            }else{
                setDropdownInAppPurchase('Disabled');
            }
            buildInAppPurchaseDropdown(products)
        }).catch(err => console.error(err));
    });
}

const buildInAppPurchaseDropdown = (products) => {
    const productsList = document.getElementById('productsList');

    products.forEach((product) => {
        const productElement = document.createElement('li');
        const productContent = document.createElement('a');

        productContent.textContent = product.name;
        productContent.addEventListener('click', () =>
            changeInAppPurchase(product)
        );

        productElement.appendChild(productContent);
        productsList.appendChild(productElement);
    });
};  

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
const setDropdownInAppPurchase = (status) => {
    const inAppPurchaseTextElem = document.querySelector(
        '#inAppPurchaseDefaultDropdownTxt'
    );
    inAppPurchaseTextElem.innerText = status;
};

const setVotesNumberInput = (number) => {
    const votesNumberInput = document.getElementById('votesNumberInput');
    votesNumberInput.value = number;
};

const showVotesPerPurchaseInput = (productId) => {
    const votesNumberContainer = document.getElementById(
        'votesNumberContainer'
    );
    if (productId) {
        votesNumberContainer.classList.remove('hidden');
    } else {
        votesNumberContainer.classList.add('hidden');
    }
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

const changeInAppPurchase = (product) => {
    if(product.disabled){
        handelIAPChange(product);
    }else if (!product.name.startsWith('c_')) {
        buildfire.dialog.toast({
            message:
                'The product you have selected does not appear to be a consumable product. Please refer to the help article for more information.',
            type: 'warning',
        });
        return;
    }else{
        handelIAPChange(product);
    }
};

const handelIAPChange = (product) =>{
    showVotesPerPurchaseInput(product.id);
    setDropdownInAppPurchase(product.name);
    settings.productId = product.id;
    save();
};

const changeVotesPerPurchase = () => {
    const votesNumberInput = document.getElementById('votesNumberInput');
    const errMessage = document.getElementById('errMessage');
    const votesNumber = Number(votesNumberInput.value);

    if (votesNumberInput.value.trim() === '') {
        errMessage.innerText = 'This field is required';
        errMessage.classList.remove('hidden');
        return;
    } else if (votesNumber <= 0) {
        votesNumberInput.value = 1;
        errMessage.classList.add('hidden');
    } else if (`${votesNumberInput.value}`.includes('.')) {
        votesNumberInput.value = parseInt(votesNumberInput.value);
        errMessage.classList.add('hidden');
    } else {
        errMessage.classList.add('hidden');
    }

    settings.votesPerPurchase = Number(votesNumberInput.value);
    save();
};

const save = () => {
    Settings.save(settings,()=>{})

    buildfire.messaging.sendMessageToWidget({
        type: 'UpdateSettings',
        data: settings
    });
}

init();
