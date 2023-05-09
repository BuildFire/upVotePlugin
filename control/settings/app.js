
const commentInput = document.getElementById("comments")
const allowAllUsersStatusUpdate = document.getElementById("statusUpdateAllUsers")
const allowNoUsersStatusUpdate = document.getElementById("statusUpdateNoUsers")
const allowUsersWithStatusUpdate = document.getElementById("statusUpdateUsersWith")

const itemPushNotificationAllUsers = document.getElementById("pushNotificationAllUsers")
const itemPushNotificationNoUsers = document.getElementById("pushNotificationNoUsers")
const itemPushNotificationUsersWith = document.getElementById("pushNotificationUsersWith")
const userTagsContainer = document.getElementById("userTagsContainer")
const itemPushNotificationTagsContainer = document.getElementById("itemPushNotificationTagsContainer")
var settings = {}
const init = () => {
    Settings.get((err, result)=>{
        settings = result;
        if(result.enableComments){
            commentInput.checked = true;
        }
        setCheckedInputAllowUsersStatus(result.statusUpdateUsersSegment)
        setCheckedInputItemPushNotification(result.pushNotificationUsersSegment)
        buildUserTagsFields(settings.statusUpdateTags,"status_update_tags");
        buildUserTagsFields(settings.pushNotificationTags, "push_notification_tags");
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

const buildUserTagsFields = (tags, containerId) => {
    const container = document.getElementById(containerId)
    container.innerHTML = "";
    for(let i=0;i<tags.length;i++){
        let div = document.createElement("div");
        div.classList.add("col-md-4")
        let innerDiv = document.createElement("div");
        innerDiv.classList.add("user-tag-field")

        let label = document.createElement("label")
        label.innerHTML = tags[i].tagName;

        let btnIcon = document.createElement("span")
        btnIcon.classList.add("icon-cross2")
        btnIcon.addEventListener("click", function(){
            if(container == "status_update_tags"){
                settings.statusUpdateTags = settings.statusUpdateTags.filter(statusUpdateTag => statusUpdateTag.id != tags[i].id )
            } else if(container == "push_notification_tags"){
                settings.pushNotificationTags = settings.pushNotificationTags.filter(pushNotificationTag => pushNotificationTag.id != tags[i].id )
            }
            container.removeChild(div);
            save();
        })
        innerDiv.appendChild(label)
        innerDiv.appendChild(btnIcon)

        div.append(innerDiv)
        container.append(div);

    }
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

const openItemPushNotificationUserTags = () => {
    buildfire.auth.showTagsSearchDialog(null, (err, result) => {
        if (err) return console.error(err);
        if (result && result != null) {
            buildUserTagsFields(result.data, "push_notification_tags")
            settings.statusUpdateTags = result.data;
            save();
        }
    });
}

const openStatusUpdateUserTagsDialog = () => {
    buildfire.auth.showTagsSearchDialog(null, (err, result) => {
        if (err) return console.error(err);
        if (result && result != null) {
            buildUserTagsFields(result.data, "status_update_tagss")
            settings.statusUpdateTags = result.data;
            save();
        }
    });
}

const save = () => {
    Settings.save(settings,()=>{})
}

init();