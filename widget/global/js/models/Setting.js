class Setting {
  constructor(data = {}) {
    this.createdOn = data.createdOn || null;
    this.createdBy = data.createdBy || null;
    this.lastUpdatedOn = data.lastUpdatedOn || null;
    this.lastUpdatedBy = data.lastUpdatedBy || null;
    this.deletedOn = data.deletedOn || null;
    this.deletedBy = data.deletedBy || null;
    this.isActive = typeof data.isActive === 'boolean' ? data.isActive : true;

    this.introduction = data.introduction || ''; // wysiwyg content migrated from primary

    this.enableComments = typeof data.enableComments === 'boolean' ? data.enableComments : false;
    this.messagingFeatureInstance = data.messagingFeatureInstance || {};
    this.enableUserProfile = typeof data.enableUserProfile === 'boolean' ? data.enableUserProfile : false;
    this.enableDirectoryBadges = typeof data.enableDirectoryBadges === 'boolean' ? data.enableDirectoryBadges : false;

    this.defaultItemSorting = data.defaultItemSorting || ENUMS.SUGGESTIONS_SORTING.NEWEST;
    this.hideCompletedItems = data.hideCompletedItems || 0;

    this.inAppPurchase = data.inAppPurchase || {
      enabled: false,
      planId: null,
      votesPerPurchase: 1,
    };

    this.permissions = data.permissions || {
      createPosts: { tags: [], value: ENUMS.USERS_PERMISSIONS.ALL_USERS }, // value = 'usersWith' | 'all',
      updateStatus: { tags: [], value: ENUMS.USERS_PERMISSIONS.NO_USERS },
      receiveNotifications: { tags: [], value: ENUMS.USERS_PERMISSIONS.NO_USERS },
    };
  }
}
