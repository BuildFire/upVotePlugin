const authManager = {
  _currentUser: null,
  get currentUser() {
    return authManager._currentUser;
  },

  set currentUser(user) {
    authManager._currentUser = user;
  },

  enforceLogin() {
    return new Promise((resolve, reject) => {
      buildfire.auth.getCurrentUser((err, currentUser) => {
        if (!currentUser) {
          buildfire.auth.login({ allowCancel: true }, (err, user) => {
            if (user) {
              authManager.currentUser = user;
              resolve();
            }
          });
        } else {
          authManager.currentUser = currentUser;
          resolve();
        }
      });
    });
  },

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      buildfire.auth.getCurrentUser((err, currentUser) => {
        if (currentUser) {
          authManager.currentUser = currentUser;
        }
        resolve();
      });
    });
  },

  getUpdatedUsersProfilesBatch(userIds) {
    return new Promise((resolve, reject) => {
      buildfire.auth.getUserProfiles({ userIds }, (err, users) => {
        if (err) return reject(err);

        resolve(users);
      });
    })
  },
  getUpdatedUsersBatches(userIds, formattedUsers = []) {
    return new Promise((resolve, reject) => {
      const usersBatch = userIds.splice(0, 50);
      if (!usersBatch || !usersBatch.length) return resolve(formattedUsers);
      authManager.getUpdatedUsersProfilesBatch(usersBatch).then((users) => {
        formattedUsers = formattedUsers.concat(users);
        authManager.getUpdatedUsersBatches(userIds, formattedUsers).then(resolve).catch(reject);
      }).catch(reject);
    })
  }
};

buildfire.auth.onLogin((user) => {
  authManager.currentUser = user;
  widgetPagesShared.checkVotedPosts();
  homePage.initSuggestionsFab();
}, false);
buildfire.auth.onLogout((user) => {
  window.location.reload();
}, false);
