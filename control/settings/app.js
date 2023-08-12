
const commentInput = document.getElementById("comments")
const allowAllUsersStatusUpdate = document.getElementById("statusUpdateAllUsers")
const allowNoUsersStatusUpdate = document.getElementById("statusUpdateNoUsers")
const allowUsersWithStatusUpdate = document.getElementById("statusUpdateUsersWith")

const itemPushNotificationAllUsers = document.getElementById("pushNotificationAllUsers")
const itemPushNotificationNoUsers = document.getElementById("pushNotificationNoUsers")
const itemPushNotificationUsersWith = document.getElementById("pushNotificationUsersWith")
const userTagsContainer = document.getElementById("userTagsContainer")
const itemPushNotificationTagsContainer = document.getElementById("itemPushNotificationTagsContainer")
const votesNumberInput = document.getElementById('votesNumberInput');
let activeDropdown = {dropdownElement: null, isOpen: false};

const debounce = (func, delay) => {
    let timerId;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => func.apply(this, args), delay);
    };
};

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

const openHideCompletedItemsDropdown = (e) => {
    e.stopPropagation();
    toggleDropdown(e.target.parentElement);
};

const openIAPDropdown = (e) => {
    e.stopPropagation();
    toggleDropdown(e.target.parentElement);
};

const toggleDropdown = (dropdownElement, forceClose) => {
    if (!dropdownElement) {
        return;
    }
    if (dropdownElement.classList.contains('open') || forceClose) {
        dropdownElement.classList.remove('open');
    } else {
        document.querySelectorAll('.open').forEach((dropdown) => {
            dropdown.classList.remove('open');
        });
        dropdownElement.classList.add('open');
        activeDropdown = {
            dropdownElement: dropdownElement,
            isOpen: true,
        };
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
    Settings.getProducts().then((products) => {
        handelIAPproducts(products);
    });
    
    Settings.get((err, result)=>{
        settings = result;
        if(result.enableComments){
            commentInput.checked = true;
        }
        setCheckedInputAllowUsersStatus(result.statusUpdateUsersSegment)
        setCheckedInputItemPushNotification(result.pushNotificationUsersSegment)
        setCheckedInputDefaultItemSorting(result.defaultItemSorting)
        setDropdownCompletedItems(result.hideCompletedItems);
        showVotesPerPurchaseInput(result.selectedPurchaseProductId);
        setVotesNumberInput(result.votesCountPerPurchase);
        if(settings.statusUpdateTags && settings.statusUpdateTags.length){
            statusUpdatetagsInputContainer.set(settings.statusUpdateTags);
        }
        if(settings.pushNotificationTags && settings.pushNotificationTags.length){
            pushNotificationtagsInputContainer.set(settings.pushNotificationTags);
        }
        showUsersTagsContainer();
        showItemPushNotificationTagsContainer();
    });

    document.body.onclick = () => {
        if (activeDropdown.isOpen) {
            toggleDropdown(activeDropdown.dropdownElement, true);
        }
    };
}

const handelIAPproducts = (products) => {
    let currentProduct = (products.find(product => product.id === settings.selectedPurchaseProductId));
    if(currentProduct && currentProduct.name){
        setDropdownInAppPurchase(currentProduct.name);
    }else{
        setDropdownInAppPurchase('Disabled');
    }
    buildInAppPurchaseDropdown(products)
};

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
    const activeCompletedItemElem = document.querySelector('#activeCompletedItem');
    let dropdownText = '';
    switch (status) {
        case 0:
            dropdownText = 'Immediately';
            break;
        case 1:
            dropdownText = '1 day (24 hours)';
            break;
        case 3:
            dropdownText = '3 days';
            break;
        case 5:
            dropdownText = '5 days';
            break;
        case 7:
            dropdownText = '7 days';
            break;
        case 10:
            dropdownText = '10 days';
            break;
        case 15:
            dropdownText = '15 days';
            break;
        case 30:
            dropdownText = '30 days';
            break;
        case 60:
            dropdownText = '60 days';
            break;
        case 90:
            dropdownText = '90 days';
            break;
        case -1:
            dropdownText = 'Never';
            break;
        default:
            dropdownText = 'Immediately';
            break;
    }

    activeCompletedItemElem.innerText = dropdownText;
};
const setDropdownInAppPurchase = (status) => {
    const activeIAPItemEle = document.querySelector(
        '#activeIAPItem'
    );
    activeIAPItemEle.innerText = status;
};

const setVotesNumberInput = (number) => {
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
                'The selected product does not appear to be consumable.',
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
    settings.selectedPurchaseProductId = product.id;
    save();
};

const changeVotesPerPurchase = () => {
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

    settings.votesCountPerPurchase = Number(votesNumberInput.value);
    save();
};

const save = debounce(() => {
    Settings.save(settings, () => {});

    buildfire.messaging.sendMessageToWidget({
        type: 'UpdateSettings',
        data: settings,
    });
}, 400); 

init();
