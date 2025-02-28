const state = {
  strings: {
    'mainScreen.commentButton': '',
    'mainScreen.updateStatus': '',
    'mainScreen.backlog': '',
    'mainScreen.inProgress': '',
    'mainScreen.completed': '',
    'mainScreen.preparingPurchaseMessage': '',
    'mainScreen.suggestionSuccessfullyAdded': '',
    'mainScreen.somethingWentWrong': '',
    'mainScreen.purchaseWasCancelled': '',
    'mainScreen.upvotes': '',
    'mainScreen.purchaseNotAvailable': '',
    'mainScreen.day': '',
    'mainScreen.hour': '',
    'mainScreen.hours': '',
    'mainScreen.min': '',
    'mainScreen.unknownUser': '',
    'mainScreen.noBadgesYet': '',
    'mainScreen.openProfile': '',
    'mainScreen.messageUser': '',
    'mainScreen.viewProfile': '',
    'mainScreen.somethingWentWrong': '',

    'addNewItem.title': '',
    'addNewItem.description': '',
    'addNewItem.cancel': '',
    'addNewItem.next': '',
    'addNewItem.submit': '',

    'firstTimePurchaseMessage.title': '',
    'firstTimePurchaseMessage.body': '',
    'firstTimePurchaseMessage.cancel': '',
    'firstTimePurchaseMessage.buy': '',

    'votesDepletedMessage.title': '',
    'votesDepletedMessage.body': '',
    'votesDepletedMessage.cancel': '',
    'votesDepletedMessage.buyMore': '',

    'unvoteMessage.title': '',
    'unvoteMessage.body': '',
    'unvoteMessage.cancel': '',
    'unvoteMessage.remove': '',

    'notifications.newItemTitle': '',
    'notifications.backlogItemTitle': '',
    'notifications.inProgressItemTitle': '',
    'notifications.completedItemBody': '',
    'notifications.completedItemMessageSendText': '',
    'notifications.completedItemMessageCancelText': '',
    'notifications.youGotAnUpVoteTitle': '',
  },
  settings: new Setting(),
  get hasAccessToAddSuggestions() {
    let userPermitted = false;
    if (state.settings.permissions.createPosts.value === ENUMS.USERS_PERMISSIONS.ALL_USERS) {
      userPermitted = true;
    } else if (state.settings.permissions.createPosts.value === ENUMS.USERS_PERMISSIONS.NO_USERS) {
      userPermitted = false;
    } else {
      const appId = buildfire.getContext().appId;
      if (authManager.currentUser && authManager.currentUser.tags && authManager.currentUser.tags[appId]) {
        const userTags = authManager.currentUser.tags[appId];
        const permissionTags = state.settings.permissions.createPosts.tags;

        for(let i = 0; i < permissionTags.length; i++) {
          if(userTags.some(_tag => _tag.tagName === permissionTags[i].tagName)) {
            userPermitted = true;
            break;
          }
        }
      }
    }

    return userPermitted;
  }
}
