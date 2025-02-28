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
	})
  },

  getCurrentUser() {
	return new Promise((resolve, reject) => {
		buildfire.auth.getCurrentUser((err, currentUser) => {
		  if (currentUser) {
			authManager.currentUser = currentUser;
		  }
		  resolve();
		});
	})
  },
};
