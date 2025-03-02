const suggestionDetailsPage = {
  selectors: {},
  initSelectors() {
    this.selectors = {
      detailsContainer: document.getElementById('suggestionPage'),
      suggestionCardTemplate: document.getElementById('suggestionCard'),
      emptyStateTemplate: document.getElementById('emptyStateTemplate'),
    };
  },

  renderSuggestionDetails() {
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

    userImage.src = buildfire.auth.getUserPictureUrl({ userId: state.activeSuggestion.createdBy._id });
    userName.textContent = widgetUtils.getUserName(state.activeSuggestion.createdBy);
    suggestionCreatedOn.textContent = widgetUtils.formatDate(state.activeSuggestion.createdOn);

    const suggestionStatusData = widgetUtils.getSuggestionStatusData(state.activeSuggestion);
    suggestionStatus.innerHTML = `<span class="margin--0 bodyTextTheme" >${suggestionStatusData.statusText}</span>`;
    suggestionStatus.className = `pill shrink--0 ${suggestionStatusData.statusContainerClass}`;

    suggestionTitle.innerHTML = state.activeSuggestion.title;
    suggestionBodyText.innerHTML = state.activeSuggestion.suggestion;
    suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(state.activeSuggestion.upVotedBy).length}</span>`;

    if (!state.settings.enableComments) {
      suggestionCommentContainer.classList.add('hidden');
    }

    if (state.activeSuggestion && state.activeSuggestion[authManager.currentUser.userId]) {
      upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons';
    }

    suggestionCommentContainer.onclick = () => widgetSharedController.navigateToSuggestionComments(state.activeSuggestion);
    upvote_icon.onclick = () => widgetSharedController.voteToSuggestion(state.activeSuggestion);
    suggestionStatus.onclick = () => widgetSharedController.updateSuggestionStatus(state.activeSuggestion);
    suggestionVotesCount.onclick = () => widgetSharedController.openVotersDrawer(state.activeSuggestion);

    suggestionCard.id = `suggestion-${state.activeSuggestion.id}`;
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

    Suggestions.getById(suggestion.id).then((updatedSuggestion) => {
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
    })
  },
}
