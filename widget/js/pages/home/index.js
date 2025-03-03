const homePage = {
  selectors: {},
  initSelectors() {
    this.selectors = {
      wysiwygContainer: document.getElementById('wysiwygContainer'),
      homePageContainer: document.getElementById('homePage'),
      suggestionCardTemplate: document.getElementById('suggestionCard'),
      fabSpeedDialContainer: document.getElementById('fabSpeedDialContainer'),
      emptyStateTemplate: document.getElementById('emptyStateTemplate'),
    };
  },

  initListeners() {
    this.selectors.homePageContainer.onscroll = () => {
      if (this.selectors.homePageContainer.scrollTop / (this.selectors.homePageContainer.scrollHeight - this.selectors.homePageContainer.offsetHeight) > 0.8) {
        if (state.fetching || state.isAllSuggestionFetched) return;

        state.fetching = true;
        widgetController.getSuggestions().then((suggestions) => {
          if (suggestions.length < state.pageSize) state.isAllSuggestionFetched = true;

          this.renderSuggestionsCards(suggestions);
          state.fetching = false;
        }).catch((err) => {
          console.error(err);
        });
      }
    };
  },

  printSuggestionCard(suggestion) {
    const cloneCard = this.selectors.suggestionCardTemplate.content.cloneNode(true);

    const suggestionDetails = cloneCard.querySelector('.suggestion-details');
    const suggestionCard = cloneCard.querySelector('.suggestionCard');
    const userImageContainer = cloneCard.querySelector('.user-image-container');
    const userImage = cloneCard.querySelector('#userImage');
    const userName = cloneCard.querySelector('#userName');
    const suggestionCreatedOn = cloneCard.querySelector('#suggestionCreatedOn');
    const suggestionStatus = cloneCard.querySelector('#suggestionStatus');
    const suggestionTitle = cloneCard.querySelector('#suggestionTitle');
    const suggestionBodyText = cloneCard.querySelector('#suggestionBodyText');
    const suggestionVotesCount = cloneCard.querySelector('#suggestionVotesCount');

    const upvote_icon = cloneCard.querySelector('#upvote_icon');
    const suggestionCommentContainer = cloneCard.querySelector('#suggestionCommentContainer');

    const userImageSrc = buildfire.auth.getUserPictureUrl({ userId: suggestion.createdBy._id });
    if (state.validUserImages[suggestion.createdBy._id]) {
      userImageContainer.classList.remove('loading-image');
      userImage.src = buildfire.imageLib.cropImage(state.validUserImages[suggestion.createdBy._id], { size: 'm', aspect: '1:1' });
    } else {
      userImage.src = buildfire.imageLib.cropImage('https://app.buildfire.com/app/media/avatar.png', { size: 'm', aspect: '1:1' });
      widgetUtils.validateImage(userImageSrc).then((isValid) => {
        userImageContainer.classList.remove('loading-image');
        if (isValid) {
          state.validUserImages[suggestion.createdBy._id] = userImageSrc;
          const croppedImage = buildfire.imageLib.cropImage(userImageSrc, { size: 'm', aspect: '1:1' });
          userImage.src = croppedImage;
        }
      });
    }

    userName.textContent = widgetUtils.getUserName(suggestion.createdBy);
    suggestionCreatedOn.textContent = widgetUtils.getSuggestionDisplayTime(suggestion.createdOn);

    const suggestionStatusData = widgetUtils.getSuggestionStatusData(suggestion);
    suggestionStatus.innerHTML = `<span class="margin--0 ${suggestionStatusData.textColorClass}" >${suggestionStatusData.statusText}</span>`;
    suggestionStatus.className = `pill shrink--0 ${suggestionStatusData.statusContainerClass}`;

    suggestionTitle.innerHTML = suggestion.title;
    suggestionBodyText.innerHTML = suggestion.suggestion;
    suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(suggestion.upVotedBy).length}</span>`;

    if (!state.settings.enableComments) {
      suggestionCommentContainer.classList.add('hidden');
    }

    if (suggestion.upVotedBy && suggestion.upVotedBy[authManager.currentUser.userId]) {
      upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons';
    }

    suggestionCommentContainer.onclick = () => widgetPagesShared.navigateToSuggestionComments(suggestion);
    upvote_icon.onclick = () => widgetPagesShared.voteToSuggestion(suggestion);
    suggestionStatus.onclick = () => widgetPagesShared.updateSuggestionStatus(suggestion);
    suggestionVotesCount.onclick = () => widgetPagesShared.openVotersDrawer(suggestion);
    suggestionDetails.onclick = () => {
      buildfire.history.push('Suggestion Details');
      suggestionDetailsPage.init(suggestion);
    };

    suggestionCard.id = `suggestion-${suggestion.id}`;
    this.selectors.homePageContainer.appendChild(cloneCard);
  },

  renderSuggestionsCards(suggestionList) {
    suggestionList.forEach((suggestion) => {
      this.printSuggestionCard(suggestion);
    });
  },

  handleCreateNewSuggestion() {
    if (authManager.currentUser) {
      const step1 = {
        placeholder: state.strings['addNewItem.title'] || 'Enter short title*',
        saveText: state.strings['addNewItem.next'] || 'Next',
        defaultValue: '',
        cancelText: state.strings['addNewItem.cancel'] || 'Cancel',
        required: true,
        maxLength: 500,
      };
      const step2 = {
        placeholder: state.strings['addNewItem.description'] || 'Add more details*',
        saveText: state.strings['addNewItem.submit'] || 'Submit',
        defaultValue: '',
        cancelText: state.strings['addNewItem.cancel'] || 'Cancel',
        attachments: {
          images: { enable: true, multiple: false },
        },
        required: true,
      };

      buildfire.input.showTextDialog([step1, step2], (err, response) => {
        if (response.results.length === 2) {
          const paragraph = document.createElement('p');
          paragraph.innerHTML = response.results[1].textValue;
          const images = response.results[1].images;
          if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
              const imgEl = document.createElement('img');
              const imgUrl = buildfire.imageLib.cropImage(images[i], { size: 'full_width', aspect: '16:9' });
              imgEl.src = imgUrl;
              paragraph.append(imgEl);
            }
          }

          const title = response.results[0].textValue;
          const description = paragraph.innerHTML;
          widgetController.createNewSuggestion(title, description).then((newSuggestion) => {
            buildfire.dialog.toast({
              message: state.strings['mainScreen.suggestionSuccessfullyAdded'],
              type: 'info',
            });

            this.destroyEmptyState();
            this.printSuggestionCard(newSuggestion);
            Analytics.trackAction(analyticKeys.SUGGESTIONS_NUMBER.key, { _buildfire: { aggregationValue: 1 } });

            if (state.settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.NO_USERS) return;

            const expressionData = { itemTitle: title };
            widgetUtils.setDynamicExpressionContext(expressionData);
            getLanguage('notifications.newItemBody').then((notificationBody) => {
              if (state.settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.ALL_USERS) {
                PushNotification.sendToAll(state.strings['notifications.newItemTitle'], notificationBody, newSuggestion.id);
              } else if (state.settings.permissions.receiveNotifications.value === ENUMS.USERS_PERMISSIONS.USERS_WITH) {
                const userTags = state.settings.permissions.receiveNotifications.tags.map((tag) => (tag.tagName ? tag.tagName : tag.value));
                if (userTags.length > 0) {
                  PushNotification.sendToUserSegment(state.strings['notifications.newItemTitle'], notificationBody, newSuggestion.id, userTags);
                }
              }
            });
          }).catch((err) => {
            console.error(err);

            buildfire.dialog.toast({
              message: state.strings['mainScreen.somethingWentWrong'],
              type: 'danger',
            });
          });
        }
      });
    } else {
      authManager.enforceLogin().then(this.handleCreateNewSuggestion.bind(this));
    }
  },

  initSuggestionsFab() {
    this.selectors.fabSpeedDialContainer.innerHTML = '';
    if (!hasPermission('createPosts')) {
      return;
    }
    const suggestionFab = new buildfire.components.fabSpeedDial('#fabSpeedDialContainer', {
      mainButton: {
        content: `<i class="icon fab-icon-btn">
              <svg width="14" height="14" viewBox="0 0 14 14"  xmlns="http://www.w3.org/2000/svg" fill="#ffffff">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z"/>
              </svg>
             </i>`,
        type: 'success',
      },
    });
    suggestionFab.onMainButtonClick = () => this.handleCreateNewSuggestion();
  },

  initSkeleton() {
    const skeletonType = [...Array(5)].map((i) => 'list-item-avatar-two-line, list-item-three-line, actions'); // let's print a skeleton of 5 suggestion cards
    this.skeleton = new buildfire.components.skeleton('#homePage', { type: skeletonType.join(',') });
    this.skeleton.start();
  },

  destroySkeleton() {
    this.skeleton.stop();
    this.skeleton = null;
  },

  printEmptyState() {
    const cloneCard = this.selectors.emptyStateTemplate.content.cloneNode(true);
    this.selectors.homePageContainer.appendChild(cloneCard);
  },

  destroyEmptyState() {
    const emptyStateHolder = this.selectors.homePageContainer.querySelector('.empty-state-holder');
    if (emptyStateHolder) {
      emptyStateHolder.remove();
    }
  },

  init() {
    this.initSelectors();

    widgetController.getSuggestions().then((suggestions) => {
      setTimeout(() => {
        this.destroySkeleton();

        if (suggestions.length === 0) {
          this.printEmptyState();
        } else {
          this.renderSuggestionsCards(suggestions);
        }
        this.initListeners();

        this.initSuggestionsFab();
        this.selectors.wysiwygContainer.innerHTML = state.settings.introduction;
      }, 500);
    }).catch((err) => {
      console.error(err);
    });
  },
};
