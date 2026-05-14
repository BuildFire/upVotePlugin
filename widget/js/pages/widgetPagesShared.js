const widgetPagesShared = {
  updateSuggestionStatus(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => widgetPagesShared.updateSuggestionStatus(suggestion));
    }
    if (hasPermission('updateStatus')) {
      updateStatusDrawer.init(suggestion, (err, res) => {
        const detailsPageContainer = document.getElementById('suggestionPage');
        const detailsStatus = detailsPageContainer?.querySelector('#suggestionStatus');
        const detailsVoteIcon = detailsPageContainer?.querySelector('#upvote_icon');

        const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
        const suggestionStatus = suggestionContainer?.querySelector('#suggestionStatus');
        const upvote_icon = suggestionContainer?.querySelector('#upvote_icon');

        if (detailsStatus) detailsStatus.classList.add('disabled');
        if (suggestionStatus) suggestionStatus.classList.add('disabled');
        widgetController.updateSuggestionStatus(suggestion.id, res.id).then((updatedSuggestion) => {
          if (suggestionStatus) suggestionStatus.classList.remove('disabled');
          if (updatedSuggestion.status === SUGGESTION_STATUS.COMPLETED) {
            if (upvote_icon) upvote_icon.classList.add('disabled');
            if (detailsVoteIcon) detailsVoteIcon.classList.add('disabled');
          } else {
            if (upvote_icon) upvote_icon.classList.remove('disabled');
            if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
          }

          const suggestionStatusData = widgetUtils.getSuggestionStatusData(updatedSuggestion);

          if (suggestionStatus) {
            suggestionStatus.innerHTML = `<span class="margin--0 ${suggestionStatusData.textColorClass}" >${suggestionStatusData.statusText}</span>`;
            suggestionStatus.className = `pill shrink--0 ${suggestionStatusData.statusContainerClass}`;
          }
          if (detailsStatus) {
            detailsStatus.innerHTML = `<span class="margin--0 ${suggestionStatusData.textColorClass}" >${suggestionStatusData.statusText}</span>`;
            detailsStatus.className = `pill shrink--0 ${suggestionStatusData.statusContainerClass}`;
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
              if (upvote_icon) upvote_icon.classList.remove('disabled');
              if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');

              PushNotification.sendToCustomUsers(state.strings['notifications.backlogItemTitle'], backlogItemBody, updatedSuggestion.id, voterIds);
            } else if (updatedSuggestion.status === SUGGESTION_STATUS.INPROGRESS) {
              if (upvote_icon) upvote_icon.classList.remove('disabled');
              if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');

              PushNotification.sendToCustomUsers(state.strings['notifications.inProgressItemTitle'], inProgressItemBody, updatedSuggestion.id, voterIds);
            } else {
              if (upvote_icon) upvote_icon.classList.add('disabled');
              if (detailsVoteIcon) detailsVoteIcon.classList.add('disabled');

              buildfire.input.showTextDialog({
                placeholder: completedItemMessageInputPlaceholder,
                saveText: state.strings['notifications.completedItemMessageSendText'],
                defaultValue: completedItemMessageInputPlaceholder,
                required: true,
                cancelText: state.strings['notifications.completedItemMessageCancelText'],
              }, (err, response) => {
                if (err) console.error(err);
                if (response && response.results && response.results[0]) {
                  PushNotification.sendToCustomUsers(state.strings['notifications.completedItemBody'], response.results[0].textValue, updatedSuggestion.id, voterIds);
                }
              });
            }
          });
        }).catch((err) => {
          console.error(err);
          if (suggestionStatus) suggestionStatus.classList.remove('disabled');
          if (detailsStatus) detailsStatus.classList.remove('disabled');
        });
      });
    }
  },
  _confirmUserAction(options) {
    return new Promise((resolve, reject) => {
      if (!options.requireConfirm) {
        resolve(true);
      } else {
        buildfire.dialog.confirm(options, (err, isConfirmed) => {
          if (isConfirmed) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }
    });
  },
  _validateCurrentUserCredit() {
    return new Promise((resolve, reject) => {
      if (!state.settings.inAppPurchase.enabled || !state.settings.inAppPurchase.planId) {
        resolve(true);
      } else {
        widgetController.getUserCredits(authManager.currentUser._id).then((result) => {
          state.userCredits = result;
          const credits = Number(widgetUtils.decryptCredit(result.credits, ENUMS.SECRET_KEY));
          if (credits > 0) {
            resolve(true);
          } else {
            let confirmTitle; let confirmMessage; let confirmButtonText; let
              cancelButtonText;

            if (state.userCredits && state.userCredits.firstTimePurchase) {
              confirmTitle = state.strings['votesDepletedMessage.title'] || 'Get More Votes';
              confirmMessage = state.strings['votesDepletedMessage.body'] || "You don't have enough credit to cast a vote. Please consider purchasing additional voting credit.$";
              confirmButtonText = state.strings['votesDepletedMessage.buyMore'] || 'Buy More';
              cancelButtonText = state.strings['votesDepletedMessage.cancel'] || 'Cancel';
            } else {
              confirmTitle = state.strings['firstTimePurchaseMessage.title'] || 'Buy Credit';
              confirmMessage = state.strings['firstTimePurchaseMessage.body'] || 'Upvoting items is a premium feature. To upvote items, you need to purchase voting credits.';
              confirmButtonText = state.strings['firstTimePurchaseMessage.buy'] || 'Buy';
              cancelButtonText = state.strings['firstTimePurchaseMessage.cancel'] || 'Cancel';
            }

            const needPurchase = state.settings.inAppPurchase.enabled && state.settings.inAppPurchase.planId;

            this._confirmUserAction({
              title: confirmTitle,
              message: confirmMessage,
              confirmButton: { text: confirmButtonText },
              cancelButtonText,
              requireConfirm: needPurchase,
            }).then((isConfirmed) => {
              if (isConfirmed) {
                if (needPurchase) {
                  const platform = buildfire.getContext().device.platform;
                  if (platform === 'web') {
                    buildfire.dialog.toast({
                      message: state.strings['mainScreen.purchaseNotAvailable'],
                      type: 'danger',
                    });
                    resolve(false);
                  } else {
                    buildfire.dialog.toast({
                      message: state.strings['mainScreen.preparingPurchaseMessage'] || 'Getting your purchase ready, please wait...',
                      duration: 5000,
                      type: 'info',
                    });
                    widgetController.handleUserPurchase().then((purchaseResult) => {
                      if (purchaseResult.purchaseStatus === 'approved') {
                        resolve(true);
                      } else {
                        buildfire.dialog.toast({
                          message: state.strings['mainScreen.purchaseWasCancelled'],
                          type: 'warning',
                        });
                        resolve(false);
                      }
                    }).catch((err) => {
                      console.error(err);

                      buildfire.dialog.toast({
                        message: state.strings['mainScreen.somethingWentWrong'],
                        type: 'danger',
                      });
                      resolve(false);
                    });
                  }
                } else {
                  resolve(true);
                }
              } else {
                resolve(false);
              }
            }).catch(reject);
          }
        }).catch(reject);
      }
    });
  },
  _handleVote(suggestion) {
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer?.querySelector('#upvote_icon');
    const detailsVotesCount = detailsPageContainer?.querySelector('#suggestionVotesCount');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer?.querySelector('#upvote_icon');
    const suggestionVotesCount = suggestionContainer?.querySelector('#suggestionVotesCount');

    this._validateCurrentUserCredit().then((hasCredits) => {
      if (hasCredits) {
        widgetController.handleSuggestionVote(suggestion).then((updatedSuggestion) => {
          if (upvote_icon) upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons';
          if (suggestionVotesCount) suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero margin--zero iconsTheme material-icons';
          if (detailsVotesCount) detailsVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          let remainingVotes = 0;
          if (state.userCredits) {
            remainingVotes = Number(widgetUtils.decryptCredit(state.userCredits.credits, ENUMS.SECRET_KEY)) - 1;
          }

          const expressionData = {
            itemTitle: updatedSuggestion.title,
            userName: widgetUtils.getUserName(authManager.currentUser),
            remainingVotes,
          };
          widgetUtils.setDynamicExpressionContext(expressionData);
          getLanguage('notifications.youGotAnUpVoteBody').then((youGotAnUpVoteBody) => {
            PushNotification.sendToCustomUsers(state.strings['notifications.youGotAnUpVoteTitle'], youGotAnUpVoteBody, updatedSuggestion.id, [updatedSuggestion.createdBy._id]);
          });

          if (state.settings.inAppPurchase.enabled && state.settings.inAppPurchase.planId) {
            getLanguage('mainScreen.voteConfirmed').then((youGotAnUpVoteBodyMessage) => {
              buildfire.dialog.toast({ message: youGotAnUpVoteBodyMessage, type: 'info' });
            });
            widgetController.decreaseUserCredits();
          }
        }).catch((err) => {
          console.error(err);
          if (upvote_icon) upvote_icon.classList.remove('disabled');
          if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
        });
      } else {
        if (upvote_icon) upvote_icon.classList.remove('disabled');
        if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
      }
    }).catch((err) => {
      console.error(err);
      if (upvote_icon) upvote_icon.classList.remove('disabled');
      if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
    });
  },
  _handleUnVote(suggestion) {
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer?.querySelector('#upvote_icon');
    const detailsVotesCount = detailsPageContainer?.querySelector('#suggestionVotesCount');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer?.querySelector('#upvote_icon');
    const suggestionVotesCount = suggestionContainer?.querySelector('#suggestionVotesCount');

    this._confirmUserAction({
      title: state.strings['unvoteMessage.title'] || 'Remove Vote',
      message: state.strings['unvoteMessage.body'] || 'Removing your vote will not refund your voting credit. Voting again will deduct anther credit.',
      confirmButton: {
        text: state.strings['unvoteMessage.remove'] || 'Remove',
      },
      cancelButtonText: state.strings['unvoteMessage.cancel'] || 'Cancel',
      requireConfirm: state.settings.inAppPurchase.enabled && state.settings.inAppPurchase.planId,
    }).then((isConfirmed) => {
      if (isConfirmed) {
        widgetController.handleSuggestionUnVote(suggestion).then((updatedSuggestion) => {
          if (upvote_icon) upvote_icon.className = 'padding-zero margin--zero bodyTextTheme material-icons';
          if (suggestionVotesCount) suggestionVotesCount.innerHTML = `<span class="margin--0 bodyTextTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero margin--zero bodyTextTheme material-icons';
          if (detailsVotesCount) detailsVotesCount.innerHTML = `<span class="margin--0 bodyTextTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;
        }).catch((err) => {
          console.error(err);
          if (upvote_icon) upvote_icon.classList.remove('disabled');
          if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
        });
      } else {
        if (upvote_icon) upvote_icon.classList.remove('disabled');
        if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
      }
    });
  },
  voteToSuggestion(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => {
        if (authManager.currentUser && suggestion.upVotedBy[authManager.currentUser.userId]) return;
        widgetPagesShared.voteToSuggestion(suggestion)
      });
    }
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer?.querySelector('#upvote_icon');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer?.querySelector('#upvote_icon');

    if (upvote_icon) upvote_icon.classList.add('disabled');
    if (detailsVoteIcon) detailsVoteIcon.classList.add('disabled');
    widgetController.isSuggestionVoted(suggestion).then((isVoted) => {
      if (isVoted) {
        this._handleUnVote(suggestion);
      } else {
        this._handleVote(suggestion);
      }
    });
  },
  openVotersDrawer(suggestion) {
    votersDrawer.init(suggestion, (err, selectedUser) => {
      if (state.settings.enableUserProfile) {
        buildfire.components.drawer.closeDrawer();
        if (state.settings.messagingFeatureInstance && state.settings.messagingFeatureInstance.instanceId && authManager.currentUser && selectedUser.userId !== authManager.currentUser.userId) {
          // show new drawer
          UserDirectory.getUserDirectoryRecord(selectedUser.userId).then((userDirectoryData) => {
            UserModal.init(userDirectoryData || suggestion.upVotedBy[selectedUser.userId].user);
          });
        } else {
          buildfire.auth.openProfile(selectedUser.userId);
        }
      }
    });
  },
  navigateToSuggestionComments(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => widgetPagesShared.navigateToSuggestionComments(suggestion));
    }

    const wid = encodeURIComponent(`${widgetUtils.getUserName(suggestion.createdBy)}-${suggestion.createdOn}`);
    const wTitle = encodeURIComponent(suggestion.title);
    const queryString = `wid=${wid}&wTitle=${wTitle}`;

    buildfire.navigation.navigateToSocialWall({
      title: suggestion.title,
      queryString,
      headerContentHtml: widgetUtils.buildHeaderContentHtml(suggestion.title, suggestion.suggestion),
      pluginTypeOrder: state.settings.navigateToCwByDefault ? ['community', 'premium_social', 'social'] : ['premium_social', 'social', 'community'],
    }, () => { });
  },
  checkVotedPosts() {
    if (!authManager.currentUser) return;

    state.suggestionsList.forEach(suggestion => {
      if (authManager.currentUser && suggestion.upVotedBy && suggestion.upVotedBy[authManager.currentUser.userId]) {
        const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
        const upvote_icon = suggestionContainer?.querySelector('#upvote_icon');

        if (upvote_icon) upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons';
      }
    });

    if (state.activeSuggestion && state.activeSuggestion.upVotedBy && state.activeSuggestion.upVotedBy[authManager.currentUser.userId]) {
      const detailsPageContainer = document.getElementById('suggestionPage');
      const detailsVoteIcon = detailsPageContainer?.querySelector('#upvote_icon');
      if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero margin--zero iconsTheme material-icons';
    }
  },
  validateSuggestionImage(suggestionDetailsContainer) {
    const image = suggestionDetailsContainer.querySelector('img');
    if (image) {
      image.onload = () => {
        image.classList.add('img-loaded');
      };
      image.onerror = () => {
        image.classList.add('hidden');
      };
    }
  },
};
