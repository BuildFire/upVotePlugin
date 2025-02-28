const votersDrawer = {
	appTheme: buildfire.getContext().appTheme,

	getUserName(user) {
		if (user) {
			if (user.displayName) {
				return user.displayName;
			} else if ((user.firstName || user.lastName) && (user.firstName.trim() !=='' || user.lastName.trim() !=='')) {
				return (
					(user.firstName ? user.firstName : '') +
					' ' +
					(user.lastName ? user.lastName : '')
				);
			} else {
				return state.string['mainScreen.unknownUser'] || 'Someone';
			}
		}
	},

	prepareOptions() {
		const listItems = [];
		for (const userRecord in this.activeSuggestion.upVotedBy) {
			const user = this.activeSuggestion.upVotedBy[userRecord].user;
			const userImage = buildfire.auth.getUserPictureUrl({ userId: user._id });
			const croppedUserImage = buildfire.imageLib.cropImage(userImage, { size: 'm', aspect: '1:1' });

			listItems.push({
				text: this.getUserName(user),
				imageUrl: croppedUserImage,
				userId: user._id,
			})
		}

		return listItems;
	},

	init(suggestion, callback) {
		this.activeSuggestion = suggestion;
		const listItems = this.prepareOptions();

		buildfire.components.drawer.open(
			{
				multiSelection: false,
				allowSelectAll: false,
				content: `<div style="color:${this.appTheme.colors.headerText};font-weight: bold;">${state.strings['mainScreen.upvotes']}</div>`,
				isHTML: true,
				triggerCallbackOnUIDismiss: false,
				listItems: listItems
			},
			(err, result) => {
				callback(err, result);
			});
	}
}
