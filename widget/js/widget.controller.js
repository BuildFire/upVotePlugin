const widgetController = {
	getSettings() {
		return new Promise((resolve) => {
			Settings.get().then((result) => {
				state.settings = new Setting(result);
				resolve();
			}).catch((err) => { // don't blok the ui, just print the error and resolve
				console.error(err);
				resolve();
			});
		});
	},

	getSuggestions() {
		return new Promise((resolve) => {
			const { page, pageSize, settings } = state;
			const searchOptions = { page, pageSize };

			switch (settings.defaultItemSorting) {
				case ENUMS.SUGGESTIONS_SORTING.NEWEST:
					searchOptions.sort = {
						createdOn: -1
					};
					break;
				case ENUMS.SUGGESTIONS_SORTING.OLDEST:
					searchOptions.sort = {
						createdOn: 1
					};
					break;
				case ENUMS.SUGGESTIONS_SORTING.MOST_VOTES:
				default:
					searchOptions.sort = {
						upVoteCount: -1,
					};
					break;
			}

			if (settings.hideCompletedItems === 0) {
				searchOptions.filter = {
					status: { $ne: SUGGESTION_STATUS.COMPLETED }
				}
			} else if (settings.hideCompletedItems > 0) {
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - settings.hideCompletedItems);
				searchOptions.filter = {
					$or: [
						{ status: { $ne: SUGGESTION_STATUS.COMPLETED } },
						{ status: SUGGESTION_STATUS.COMPLETED, modifiedOn: { $gte: startDate } }
					]
				}
			}

			Suggestions.search(searchOptions).then((result) => {
				state.page += 1;
				resolve(result);
			});
		})
	},

	isSuggestionVoted(suggestion) {
		return new Promise((resolve, reject) => {
			Suggestions.getById(suggestion.id).then((updatedSuggestion) => {
				if (updatedSuggestion.upVotedBy && updatedSuggestion.upVotedBy[authManager.currentUser.userId]) {
					resolve(true);
				} else {
					resolve(false);
				}
			}).catch(reject)
		})
	},

	handleSuggestionVote(suggestion) {
		return new Promise((resolve, reject) => {
			Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: 1, _buildfire: { aggregationValue: 1 } });

			Suggestions.update(suggestion.id, {
				$set: {
					['upVotedBy.' + authManager.currentUser.userId]: {
						user: authManager.currentUser,
						votedOn: new Date()
					},
					upVoteCount: suggestion.upVoteCount + 1
				}
			}).then(resolve).catch(reject);
		});
	},

	handleSuggestionUnVote(suggestion) {
		return new Promise((resolve, reject) => {
			Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: -1, _buildfire: { aggregationValue: -1 } });

			Suggestions.update(suggestion.id, {
				$unset: { ['upVotedBy.' + authManager.currentUser.userId]: "" },
				$set: { upVoteCount: suggestion.upVoteCount - 1 }
			}).then(resolve).catch(reject);
		});
	},

	updateSuggestionStatus(suggestionId, updatedStatus) {
		return new Promise((resolve, reject) => {
			Suggestions.update(suggestionId, {
				$set: { status: updatedStatus, modifiedOn: new Date() }
			}).then(resolve).catch(reject);
		})
	},

	createNewSuggestion(suggestionTitle, suggestionDescription) {
		return new Promise((resolve, reject) => {
			const newSuggestion = new Suggestion({
				title: suggestionTitle,
				suggestion: suggestionDescription,
				createdBy: authManager.currentUser,
				createdOn: new Date(),
			})
			Suggestions.insert(newSuggestion).then(resolve).catch(reject);
		})
	},

	getUserCredits() {
		return new Promise((resolve, reject) => {
			UserCredits.get(authManager.currentUser._id).then(resolve).catch(reject);
		});
	},

	decreaseUserCredits() {
		return new Promise((resolve, reject) => {
			this.getUserCredits().then((result) => {
				const credits = Number(widgetUtils.decryptCredit(result.credits, ENUMS.SECRET_KEY));
				const updatedUserCredits = credits - 1;
				const encryptedCredits = widgetUtils.encryptCredit(updatedUserCredits, ENUMS.SECRET_KEY);

				let payload = {
					$set: {
						credits: encryptedCredits,
					}
				}
				return UserCredits.update(authManager.currentUser._id, payload).then(() => {
					if (updatedUserCredits === 0) {
						Analytics.trackAction(analyticKeys.CONSUMING_CREDITS.key);
					}

					resolve(true);
				}).catch(reject);
			})
		})
	},

	addUserCredits() {
		return new Promise((resolve, reject) => {
			let encryptedCredits = widgetUtils.encryptCredit(state.settings.inAppPurchase.votesPerPurchase, ENUMS.SECRET_KEY);
			let payload = {
				$set: {
					createdBy: authManager.currentUser._id,
					credits: encryptedCredits,
					firstTimePurchase: true
				}
			}
			return UserCredits.update(authManager.currentUser._id, payload).then(() => {
				Analytics.trackAction(analyticKeys.CHARGING_CREDITS.key);

				resolve(true);
			}).catch(reject);
		})
	},

	handleUserPurchase() {
		return new Promise((resolve, reject) => {
			buildfire.services.commerce.inAppPurchase.purchase(state.settings.inAppPurchase.planId, (err, res) => {
				if (err || !res || res.hasErrors) {
					return reject(err);
				}

				if (res.isApproved) {
					this.addUserCredits().then(() => {
						resolve({ purchaseStatus: 'approved' });
					}).catch(reject);
				} else {
					resolve({ purchaseStatus: 'cancelled' });
				}
			}
			);
		})
	}
};
