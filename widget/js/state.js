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
    'mainScreen.messageUser': '',
    'mainScreen.viewProfile': '',

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
  page: 0,
  pageSize: 50,
  currentStatusSearch: SUGGESTION_STATUS.BACKLOG,
  fetching: false,
  isAllSuggestionFetched: false,
  validUserImages: {},
  suggestionsList: [],
  updatedUsersData: [],
};
