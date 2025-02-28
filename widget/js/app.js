const hasPermission = (permissionType) => {
	let userPermitted = false;
	if (state.settings.permissions[permissionType].value === ENUMS.USERS_PERMISSIONS.ALL_USERS) {
		userPermitted = true;
	} else if (state.settings.permissions[permissionType].value === ENUMS.USERS_PERMISSIONS.NO_USERS) {
		userPermitted = false;
	} else {
		const appId = buildfire.getContext().appId;
		if (authManager.currentUser && authManager.currentUser.tags && authManager.currentUser.tags[appId]) {
			const userTags = authManager.currentUser.tags[appId];
			const permissionTags = state.settings.permissions[permissionType].tags;

			for (let i = 0; i < permissionTags.length; i++) {
				if (userTags.some(_tag => _tag.tagName === permissionTags[i].tagName)) {
					userPermitted = true;
					break;
				}
			}
		}
	}

	return userPermitted;
}

const getUserDirectoryRecord = userId => {
	return new Promise((resolve, reject) => {
		const filter = {
			'_buildfire.index.string1': userId
		}

		buildfire.appData.search({ filter }, '$$userDirectory', (err, res) => {
			if (err) reject(err);
			else {
				resolve(res[0] ? res[0].data : null);
			}
		});
	});
}

const getSettings = () => {
	return new Promise((resolve) => {
		Settings.get().then((result) => {
			state.settings = result;
			resolve();
		}).catch((err) => { // don't blok the ui, just print the error and resolve
			console.error(err);
			resolve();
		});
	});
};

const init = () => {
	const promises = [
		getSettings(),
		authManager.getCurrentUser(),
		initLanguageStrings()
	];
	Promise.all(promises).then(() => {
		homePage.init();
	}).catch((err) => {
		console.error(err);
	});
}

window.onload = () => {
	init();
};
