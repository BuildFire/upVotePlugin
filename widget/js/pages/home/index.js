const homePage = {
	selectors: {},
	initSelectors() {
		this.selectors = {
			homePageContainer: document.getElementById('homePage'),
			suggestionCardTemplate: document.getElementById('suggestionCard'),
		}
	},

	getSuggestionStatusData(suggestion) {
		const suggestionStatus = {};
		switch (suggestion.status) {
			case 3:
				suggestionStatus.statusText = state.strings['mainScreen.completed'];
				suggestionStatus.statusContainerClass = 'successBackgroundTheme';
				break;
			case 2:
				suggestionStatus.statusText = state.strings['mainScreen.inProgress'];
				suggestionStatus.statusContainerClass = 'warningBackgroundTheme';
				break;
			case 1:
			default:
				suggestionStatus.statusText = state.strings['mainScreen.backlog'];
				suggestionStatus.statusContainerClass = 'defaultBackgroundStatus';
				break;
		}
		return suggestionStatus;
	},

	openVotersDrawer(suggestion) {
		votersDrawer.init(suggestion, (err, selectedUser) => {
			if (state.settings.enableUserProfile) {
				buildfire.components.drawer.closeDrawer();
				if (state.settings.enableDirectoryBadges || (state.settings.messagingFeatureInstance && state.settings.messagingFeatureInstance.instanceId)) {
					// show new drawer
					UserDirectory.getUserDirectoryRecord(selectedUser.userId).then((userDirectoryData) => {
						UserModal.init(userDirectoryData || suggestion.upVotedBy[selectedUser.userId].user)
					})
				} else {
					buildfire.auth.openProfile(selectedUser.userId);
				}
			}
		})
	},

	updateSuggestionStatus(suggestion) {
		updateStatusDrawer.init(suggestion, (err, res) => {
			const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
			const suggestionStatus = suggestionContainer.querySelector('#suggestionStatus');

			suggestionStatus.classList.add('disabled');
			homeController.updateSuggestionStatus(suggestion.id, res.id).then(() => {
				suggestionStatus.classList.remove('disabled');

				suggestion.status = res.id;
				const suggestionData = this.getSuggestionStatusData(suggestion);

				suggestionStatus.innerHTML = `<span class="margin--0 bodyTextTheme" >${suggestionData.statusText}</span>`;
				suggestionStatus.className = `pill shrink--0 ${suggestionData.statusContainerClass}`;
			}).catch((err) => {
				console.error(err);
				suggestionStatus.classList.remove('disabled');
			});
		});
	},

	voteToSuggestion(suggestion) {
		const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
		const upvote_icon = suggestionContainer.querySelector('#upvote_icon');
		const suggestionVotesCount = suggestionContainer.querySelector('#suggestionVotesCount');

		upvote_icon.classList.add('disabled');
		homeController.handleVoteToSuggestion(suggestion).then((updatedSuggestion) => {
			upvote_icon.classList.remove('disabled');
			suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.data.upVotedBy).length}</span>`;
		}).catch((err) => {
			console.error(err);
			upvote_icon.classList.remove('disabled');
		});
	},

	buildHeaderContentHtml(title, description) {
		const div = document.createElement("div")
		const titleParagraph = document.createElement("p")
		titleParagraph.style.color = appThemeColors.bodyText;
		titleParagraph.style.fontSize = "16px"
		titleParagraph.style.fontWeight = 500;
		titleParagraph.innerHTML = title;

		const descriptionParagraph = document.createElement("p")
		descriptionParagraph.style.color = appThemeColors.bodyText;
		descriptionParagraph.style.fontWeight = 400;
		descriptionParagraph.style.fontSize = "14px"

		descriptionParagraph.innerHTML = description;

		div.appendChild(titleParagraph)
		div.appendChild(descriptionParagraph)

		return div.innerHTML;
	},

	navigateToSuggestionComments(suggestion) {
		const wid = encodeURIComponent(suggestion.createdBy.displayName + "-" + suggestion.createdOn)
		const wTitle = encodeURIComponent(suggestion.title);
		const queryString = `wid=${wid}&wTitle=${wTitle}`;

		buildfire.navigation.navigateToSocialWall({
			title: suggestion.title,
			queryString,
			headerContentHtml: this.buildHeaderContentHtml(suggestion.title, suggestion.suggestion),
			pluginTypeOrder: ['premium_social', 'social', 'community']
		}, () => { });
	},

	printSuggestionCard(suggestion) {
		const cloneCard = this.selectors.suggestionCardTemplate.content.cloneNode(true);

		const suggestionCard = cloneCard.querySelector('.suggestionCard');
		const userImage = cloneCard.querySelector('#userImage');
		const userName = cloneCard.querySelector('#userName');
		const suggestionCreatedOn = cloneCard.querySelector('#suggestionCreatedOn');
		const suggestionStatus = cloneCard.querySelector('#suggestionStatus');
		const suggestionTitle = cloneCard.querySelector('#suggestionTitle');
		const suggestionBodyText = cloneCard.querySelector('#suggestionBodyText');
		const suggestionVotesCount = cloneCard.querySelector('#suggestionVotesCount');

		const upvote_icon = cloneCard.querySelector('#upvote_icon');
		const suggestionCommentContainer = cloneCard.querySelector('#suggestionCommentContainer');

		userImage.src = buildfire.auth.getUserPictureUrl({ userId: suggestion.createdBy._id });
		userName.textContent = suggestion.createdBy.displayName;
		suggestionCreatedOn.textContent = widgetUtils.formatDate(suggestion.createdOn);

		const suggestionStatusData = this.getSuggestionStatusData(suggestion);
		suggestionStatus.innerHTML = `<span class="margin--0 bodyTextTheme" >${suggestionStatusData.statusText}</span>`;
		suggestionStatus.className = `pill shrink--0 ${suggestionStatusData.statusContainerClass}`;

		suggestionTitle.innerHTML = suggestion.title;
		suggestionBodyText.innerHTML = suggestion.suggestion;
		suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(suggestion.upVotedBy).length}</span>`;

		if (!state.settings.enableComments) {
			suggestionCommentContainer.classList.add('hidden');
		}

		suggestionCommentContainer.onclick = () => this.navigateToSuggestionComments(suggestion);
		upvote_icon.onclick = () => this.voteToSuggestion(suggestion);
		suggestionStatus.onclick = () => this.updateSuggestionStatus(suggestion);
		suggestionVotesCount.onclick = () => this.openVotersDrawer(suggestion);

		suggestionCard.id = `suggestion-${suggestion.id}`;
		this.selectors.homePageContainer.appendChild(cloneCard);
	},

	renderSuggestionsCards(suggestionList) {
		suggestionList.forEach((suggestion) => {
			this.printSuggestionCard(suggestion);
		});
	},

	init() {
		this.initSelectors();

		homeController.getSuggestions().then((suggestions) => {
			this.renderSuggestionsCards(suggestions);
		}).catch(err => {
			console.error(err);
		});
	}
};
