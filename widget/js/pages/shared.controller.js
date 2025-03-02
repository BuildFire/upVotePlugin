const widgetSharedController = {
  updateSuggestionStatus(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => widgetSharedController.updateSuggestionStatus(suggestion));
    }
    if (hasPermission('updateStatus')) {
      updateStatusDrawer.init(suggestion, (err, res) => {
        const detailsPageContainer = document.getElementById('suggestionPage');
        const detailsStatus = detailsPageContainer.querySelector('#suggestionStatus');

        const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
        const suggestionStatus = suggestionContainer.querySelector('#suggestionStatus');

        if (detailsStatus) detailsStatus.classList.add('disabled');
        suggestionStatus.classList.add('disabled');
        widgetController.updateSuggestionStatus(suggestion.id, res.id).then((updatedSuggestion) => {
          suggestionStatus.classList.remove('disabled');

          const suggestionData = widgetUtils.getSuggestionStatusData(updatedSuggestion);

          suggestionStatus.innerHTML = `<span class="margin--0 bodyTextTheme" >${suggestionData.statusText}</span>`;
          suggestionStatus.className = `pill shrink--0 ${suggestionData.statusContainerClass}`;
          if (detailsStatus) {
            detailsStatus.innerHTML = `<span class="margin--0 bodyTextTheme" >${suggestionData.statusText}</span>`;
            detailsStatus.className = `pill shrink--0 ${suggestionData.statusContainerClass}`;
          }

          const expressionData = { itemTitle: updatedSuggestion.title };
          widgetUtils.setDynamicExpressionContext(expressionData);

          Promise.all([
            getLanguage('notifications.backlogItemBody'),
            getLanguage('notifications.inProgressItemBody'),
            getLanguage('notifications.completedItemMessageInputPlaceholder'),
          ]).then(([backlogItemBody,
            inProgressItemBody,
            completedItemMessageInputPlaceholder]) => {
            const voterIds = Object.keys(updatedSuggestion.upVotedBy);
            if (!voterIds || !voterIds.length) return;

            if (updatedSuggestion.status === SUGGESTION_STATUS.BACKLOG) {
              PushNotification.sendToCustomUsers(state.strings['notifications.backlogItemTitle'], backlogItemBody, updatedSuggestion.id, voterIds);
            } else if (updatedSuggestion.status === SUGGESTION_STATUS.INPROGRESS) {
              PushNotification.sendToCustomUsers(state.strings['notifications.inProgressItemTitle'], inProgressItemBody, updatedSuggestion.id, voterIds);
            } else {
              buildfire.input.showTextDialog({
                placeholder: completedItemMessageInputPlaceholder,
                saveText: state.strings['notifications.completedItemMessageSendText'],
                defaultValue: completedItemMessageInputPlaceholder,
                required: true,
                cancelText: state.strings['notifications.completedItemMessageCancelText']
              }, (err, response) => {
                if (err) console.error(err);
                if (response && response.results && response.results[0]) {
                  PushNotification.sendToCustomUsers(state.strings['notifications.completedItemBody'], response.results[0].textValue, updatedSuggestion.id, voterIds);
                }
              })
            }
          });
        }).catch((err) => {
          console.error(err);
          suggestionStatus.classList.remove('disabled');
          if (detailsStatus) detailsStatus.classList.remove('disabled');
        });
      });
    }
  },
  voteToSuggestion(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => widgetSharedController.voteToSuggestion(suggestion));
    }
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer.querySelector('#upvote_icon');
    const detailsVotesCount = detailsPageContainer.querySelector('#suggestionVotesCount');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer.querySelector('#upvote_icon');
    const suggestionVotesCount = suggestionContainer.querySelector('#suggestionVotesCount');

    upvote_icon.classList.add('disabled');
    if (detailsVoteIcon) detailsVoteIcon.classList.add('disabled');
    widgetController.isSuggestionVoted(suggestion).then((isVoted) => {
      if (isVoted) {
        widgetController.handleSuggestionUnVote(suggestion).then((updatedSuggestion) => {
          upvote_icon.className = 'padding-zero iconsTheme material-icons-outlined';
          suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero iconsTheme material-icons-outlined';
          if (detailsVotesCount) detailsVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;
        }).catch((err) => {
          console.error(err);
          upvote_icon.classList.remove('disabled');
          if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
        });
      } else {
        widgetController.handleSuggestionVote(suggestion).then((updatedSuggestion) => {
          upvote_icon.className = 'padding-zero iconsTheme material-symbols-outlined';
          suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero iconsTheme material-symbols-outlined';
          if (detailsVotesCount) detailsVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          const expressionData = {
            itemTitle: updatedSuggestion.title,
            userName: authManager.currentUser.displayName
          };
          widgetUtils.setDynamicExpressionContext(expressionData);
          getLanguage('notifications.youGotAnUpVoteBody').then((youGotAnUpVoteBody) => {
            PushNotification.sendToCustomUsers(state.strings['notifications.youGotAnUpVoteTitle'], youGotAnUpVoteBody, updatedSuggestion.id, [updatedSuggestion.createdBy._id]);
          })
        }).catch((err) => {
          console.error(err);
          upvote_icon.classList.remove('disabled');
          if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
        });
      }
    });
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
  navigateToSuggestionComments(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => widgetSharedController.navigateToSuggestionComments(suggestion));
    }

    const wid = encodeURIComponent(suggestion.createdBy.displayName + "-" + suggestion.createdOn)
    const wTitle = encodeURIComponent(suggestion.title);
    const queryString = `wid=${wid}&wTitle=${wTitle}`;

    buildfire.navigation.navigateToSocialWall({
      title: suggestion.title,
      queryString,
      headerContentHtml: widgetUtils.buildHeaderContentHtml(suggestion.title, suggestion.suggestion),
      pluginTypeOrder: ['premium_social', 'social', 'community']
    }, () => { });
  },
}
