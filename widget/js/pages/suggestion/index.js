const suggestionDetailsPage = {
  selectors: {},
  initSelectors() {
    this.selectors = {
      detailsContainer: document.getElementById('suggestionPage'),
      suggestionCardTemplate: document.getElementById('suggestionDetailsCard'),
      emptyStateTemplate: document.getElementById('emptyStateTemplate'),
    };
  },

  renderSuggestionDetails() {
    const cloneCard = this.selectors.suggestionCardTemplate.content.cloneNode(true);

    const suggestionCard = cloneCard.querySelector('.suggestionCard');
    const userImageContainer = cloneCard.querySelector('.user-image-container');
    const userImage = cloneCard.querySelector('#userImage');
    const userName = cloneCard.querySelector('#suggestionUserName');
    const suggestionCreatedOn = cloneCard.querySelector('#suggestionCreatedOn');
    const suggestionStatus = cloneCard.querySelector('#suggestionStatus');
    const suggestionTitle = cloneCard.querySelector('#suggestionTitle');
    const suggestionBodyText = cloneCard.querySelector('#suggestionBodyText');
    const suggestionVotesCount = cloneCard.querySelector('#suggestionVotesCount');

    const upvote_icon = cloneCard.querySelector('#upvote_icon');
    const suggestionCommentContainer = cloneCard.querySelector('#suggestionCommentContainer');

    const userImageSrc = buildfire.auth.getUserPictureUrl({ userId: state.activeSuggestion.createdBy._id });
    if (state.validUserImages[state.activeSuggestion.createdBy._id]) {
      userImageContainer.classList.remove('loading-image');
      userImage.src = buildfire.imageLib.cropImage(state.validUserImages[state.activeSuggestion.createdBy._id], { size: 'm', aspect: '1:1' });
    } else {
      userImage.src = buildfire.imageLib.cropImage('https://app.buildfire.com/app/media/avatar.png', { size: 'm', aspect: '1:1' });
      widgetUtils.validateImage(userImageSrc).then((isValid) => {
        userImageContainer.classList.remove('loading-image');
        if (isValid) {
          state.validUserImages[state.activeSuggestion.createdBy._id] = userImageSrc;
          const croppedImage = buildfire.imageLib.cropImage(userImageSrc, { size: 'm', aspect: '1:1' });
          userImage.src = croppedImage;
        }
      });
    }

    userName.textContent = widgetUtils.getUserName(state.activeSuggestion.createdBy);
    suggestionCreatedOn.textContent = widgetUtils.getSuggestionDisplayTime(state.activeSuggestion.createdOn);

    const suggestionStatusData = widgetUtils.getSuggestionStatusData(state.activeSuggestion);
    suggestionStatus.innerHTML = `<span class="margin--0 ${suggestionStatusData.textColorClass}" >${suggestionStatusData.statusText}</span>`;
    suggestionStatus.className = `pill shrink--0 ${suggestionStatusData.statusContainerClass}`;

    suggestionTitle.innerHTML = state.activeSuggestion.title;
    suggestionBodyText.innerHTML = state.activeSuggestion.suggestion;
    widgetPagesShared.validateSuggestionImage(suggestionBodyText);
    suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(state.activeSuggestion.upVotedBy).length}</span>`;

    if (!state.settings.enableComments) {
      suggestionCommentContainer.classList.add('hidden');
    }

    if (authManager.currentUser && state.activeSuggestion.upVotedBy && state.activeSuggestion.upVotedBy[authManager.currentUser.userId]) {
      upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons';
    }
    if (state.activeSuggestion.status === SUGGESTION_STATUS.COMPLETED) {
      upvote_icon.classList.add('disabled');
    }

    suggestionCommentContainer.onclick = () => widgetPagesShared.navigateToSuggestionComments(state.activeSuggestion);
    upvote_icon.onclick = () => widgetPagesShared.voteToSuggestion(state.activeSuggestion);
    suggestionStatus.onclick = () => widgetPagesShared.updateSuggestionStatus(state.activeSuggestion);
    suggestionVotesCount.onclick = () => widgetPagesShared.openVotersDrawer(state.activeSuggestion);

    this.selectors.detailsContainer.appendChild(cloneCard);
  },

  destroy() {
    this.selectors.detailsContainer.classList.add('hidden');
    this.selectors.detailsContainer.innerHTML = '';
  },

  initSkeleton() {
    this.skeleton = new buildfire.components.skeleton('#suggestionPage', { type: 'list-item-avatar-two-line, list-item-three-line, actions' });
    this.skeleton.start();
  },

  destroySkeleton() {
    this.skeleton.stop();
    this.skeleton = null;
  },

  printEmptyState() {
    const cloneCard = this.selectors.emptyStateTemplate.content.cloneNode(true);
    this.selectors.detailsContainer.appendChild(cloneCard);
  },

  destroyEmptyState() {
    const emptyStateHolder = this.selectors.homePageContainer.querySelector('.empty-state-holder');
    if (emptyStateHolder) {
      emptyStateHolder.remove();
    }
  },

  init(suggestion) {
    this.initSelectors();
    this.initSkeleton();

    this.selectors.detailsContainer.classList.remove('hidden');

    widgetController.getSuggestionById(suggestion.id).then((updatedSuggestion) => {
      setTimeout(() => {
        this.destroySkeleton();
        this.selectors.detailsContainer.innerHTML = '';

        if (updatedSuggestion && updatedSuggestion.id) {
          state.activeSuggestion = updatedSuggestion;
          this.renderSuggestionDetails();
        } else {
          this.printEmptyState();
        }
      }, 500);
    }).catch((err) => {
      this.destroySkeleton();
      this.selectors.detailsContainer.innerHTML = '';
      this.printEmptyState();
      console.error(err);
    });
  },
};
