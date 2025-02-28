const homeController = {
  getSettings() {
    return new Promise((resolve) => {
      Settings.get().then((result) => {
        state.settings = result;
        resolve();
      }).catch((err) => { // don't blok the ui, just print the error and resolve
        console.error(err);
        resolve();
      });
    });
  },

  getSuggestions() {
	return new Promise((resolve) => {
		Suggestions.search({}).then((result) => {
			resolve(result);
		});
	})
  },

  handleVoteToSuggestion(suggestion) {
	return new Promise((resolve, reject) => {
		Suggestions.getById(suggestion.id).then((updatedSuggestion) => {
			if (updatedSuggestion.upVotedBy && updatedSuggestion.upVotedBy[authManager.currentUser.userId]) {
				Suggestions.update(updatedSuggestion.id, {
					$unset: {['upVotedBy.' + authManager.currentUser.userId]: ""}
				}).then(resolve).catch(reject);
			} else {
				Suggestions.update(updatedSuggestion.id, {
					$set: {['upVotedBy.' + authManager.currentUser.userId]: {
						user: authManager.currentUser,
						votedOn: new Date()
					}}
				}).then(resolve).catch(reject);
			}
		}).catch(reject)
	})
  },

  addSuggestion() {

  },

  updateSuggestionStatus(suggestionId, updatedStatus) {
	return new Promise((resolve, reject) => {
		Suggestions.update(suggestionId, {
			$set: {status: updatedStatus}
		}).then(resolve).catch(reject);
	})
  },
};
