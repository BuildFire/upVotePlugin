class Settings {
  static get TAG() {
    return 'settings';
  }

  static get() {
    return new Promise((resolve, reject) => {
      buildfire.datastore.get(this.TAG, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.data);
        }
      });
    });
  }

  static save(settings) {
    return new Promise((resolve, reject) => {
      settings.lastUpdatedOn = new Date();
      settings.lastUpdatedBy = authManager.currentUser.userId;
      buildfire.datastore.save(new Setting(settings), this.TAG, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Setting(res.data));
        }
      });
    });
  }

  static unifyOldSettingsData() {
    return new Promise((resolve, reject) => {
      this.get().then((result) => {
        buildfire.datastore.get('', (err, res) => {
          if (err) {
            reject(err);
          } else if (res && res.data) {
            const introduction = res.text
            const navigateToCwByDefault = !Object.keys(res.data).length || res.navigateToCwByDefault;

            let pushNotificationValue, statusUpdateValue, defaultItemSorting;
            if (result.statusUpdateUsersSegment === 1) {
              statusUpdateValue = ENUMS.USERS_PERMISSIONS.ALL_USERS
            } else if (result.statusUpdateUsersSegment === 2) {
              statusUpdateValue = ENUMS.USERS_PERMISSIONS.NO_USERS
            } else {
              statusUpdateValue = ENUMS.USERS_PERMISSIONS.USERS_WITH
            }

            if (result.pushNotificationUsersSegment === 1) {
              pushNotificationValue = ENUMS.USERS_PERMISSIONS.ALL_USERS
            } else if (result.pushNotificationUsersSegment === 2) {
              pushNotificationValue = ENUMS.USERS_PERMISSIONS.NO_USERS
            } else {
              pushNotificationValue = ENUMS.USERS_PERMISSIONS.USERS_WITH
            }

            if (result.defaultItemSorting === 1) {
              defaultItemSorting = ENUMS.SUGGESTIONS_SORTING.NEWEST;
            } else if (result.defaultItemSorting === 2) {
              defaultItemSorting = ENUMS.SUGGESTIONS_SORTING.OLDEST;
            } else {
              defaultItemSorting = ENUMS.SUGGESTIONS_SORTING.MOST_VOTES;
            }

            const updatedSettings = {
              ...result, introduction, navigateToCwByDefault, defaultItemSorting,
              inAppPurchase: {
                enabled: !!(result.selectedPurchaseProductId && result.votesCountPerPurchase),
                planId: result.selectedPurchaseProductId,
                votesPerPurchase: result.votesCountPerPurchase,
              },
              permissions: {
                createPosts: { tags: [], value: ENUMS.USERS_PERMISSIONS.ALL_USERS },
                updateStatus: { tags: result.statusUpdateTags, value: statusUpdateValue },
                receiveNotifications: { tags: result.pushNotificationTags, value: pushNotificationValue },
              }

            }

            resolve(new Setting(updatedSettings))
          }
        })
      }).catch(reject);
    })
  }
}
