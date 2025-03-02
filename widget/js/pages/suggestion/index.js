const suggestionDetailsPage = {
  selectors: {},
  initSelectors() {
    this.selectors = {
      detailsContainer: document.getElementById('suggestionPage'),
      suggestionCardTemplate: document.getElementById('suggestionCard'),
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
    userName.textContent = state.activeSuggestion.createdBy.displayName;
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

  init(suggestion) {
    this.initSelectors();
    this.initSkeleton();

    this.selectors.detailsContainer.classList.remove('hidden');

    Suggestions.getById(suggestion.id).then((updatedSuggestion) => {
      setTimeout(() => {
        this.destroySkeleton();

        state.activeSuggestion = updatedSuggestion;
        this.renderSuggestionDetails();
      }, 500);
    }).catch((err) => {
      console.error(err);
    })
  },
}
