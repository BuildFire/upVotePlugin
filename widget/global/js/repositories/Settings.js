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
      buildfire.datastore.save(new Setting(settings), this.TAG, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve();
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

            let pushNotificationValue, statusUpdateValue;
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

            const updatedSettings = {
              ...result, introduction, navigateToCwByDefault,
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
