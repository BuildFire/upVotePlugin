
const commentInput = document.getElementById("comments")
const allowAllUsersStatusUpdate = document.getElementById("allUsers")
const allowNoUsersStatusUpdate = document.getElementById("noUsers")
const allowUsersWithStatusUpdate = document.getElementById("usersWith")
const userTagsContainer = document.getElementById("userTagsContainer")
var settings = {}
const init = () => {
    Settings.get((err, result)=>{
        settings = result;
        if(result.enableComments){
            commentInput.checked = true;
        }
        setCheckedInputAllowUsersStatus(result.statusUpdateUsersSegment)
        buildUserTagsFields(settings.statusUpdateTags);
        showUsersTagsContainer();
    })
}

const showUsersTagsContainer = () => {
    if(allowUsersWithStatusUpdate.checked){
        userTagsContainer.style.display = "block"
       
    } else {
        userTagsContainer.style.display = "none"
    }
}

const buildUserTagsFields = (statusUpdateTags) => {
    const userTagsFieldsContainer = document.getElementById("user-tags-fields")
    userTagsFieldsContainer.innerHTML = "";
    for(let i=0;i<statusUpdateTags.length;i++){
        let div = document.createElement("div");
        div.classList.add("col-md-4")
        let innerDiv = document.createElement("div");
        innerDiv.classList.add("user-tag-field")

        let label = document.createElement("label")
        label.innerHTML = settings.statusUpdateTags[i].tagName;

        let btnIcon = document.createElement("span")
        btnIcon.classList.add("icon-cross2")
        btnIcon.addEventListener("click", function(){
            settings.statusUpdateTags = settings.statusUpdateTags.filter(statusUpdateTag => statusUpdateTag.id != settings.statusUpdateTags[i].id )
            userTagsFieldsContainer.removeChild(div);
            save();
        })
        innerDiv.appendChild(label)
        innerDiv.appendChild(btnIcon)

        div.append(innerDiv)
        userTagsFieldsContainer.append(div);

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
    settings.statusUpdateUsersSegment = status;
    showUsersTagsContainer();


}

const updateCommentsProperty = () => {
    settings.enableComments = commentInput.checked;
    save();
}

const changeStatus = (status) => {
    setCheckedInputAllowUsersStatus(status)
    save();
}

const openUserTagsDialog = () => {
    buildfire.auth.showTagsSearchDialog(null, (err, result) => {
        if (err) return console.error(err);
        if (result && result != null) {
            buildUserTagsFields(result.data)
            settings.statusUpdateTags = result.data;
            save();
        }
    });
}

const save = () => {
    Settings.save(settings,()=>{})
}

init();