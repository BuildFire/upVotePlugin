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
  _confirmUserAction(options) {
    return new Promise((resolve, reject) => {
      if (!options.requireConfirm) return resolve(true);

      buildfire.dialog.confirm(options, (err, isConfirmed) => {
        if (isConfirmed) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    })
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
            let confirmTitle, confirmMessage, confirmButtonText, cancelButtonText;

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

            const needPurchase = state.settings.inAppPurchase.enabled && state.settings.inAppPurchase.planId

            this._confirmUserAction({
              title: confirmTitle,
              message: confirmMessage,
              confirmButton: { text: confirmButtonText },
              cancelButtonText: cancelButtonText,
              requireConfirm: needPurchase
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
    })
  },
  _handleVote(suggestion) {
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer.querySelector('#upvote_icon');
    const detailsVotesCount = detailsPageContainer.querySelector('#suggestionVotesCount');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer.querySelector('#upvote_icon');
    const suggestionVotesCount = suggestionContainer.querySelector('#suggestionVotesCount');

    this._validateCurrentUserCredit().then((hasCredits) => {
      if (hasCredits) {
        widgetController.handleSuggestionVote(suggestion).then((updatedSuggestion) => {
          upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons';
          suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero margin--zero iconsTheme material-icons';
          if (detailsVotesCount) detailsVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          const expressionData = {
            itemTitle: updatedSuggestion.title,
            userName: widgetUtils.getUserName(authManager.currentUser),
          };
          widgetUtils.setDynamicExpressionContext(expressionData);
          getLanguage('notifications.youGotAnUpVoteBody').then((youGotAnUpVoteBody) => {
            PushNotification.sendToCustomUsers(state.strings['notifications.youGotAnUpVoteTitle'], youGotAnUpVoteBody, updatedSuggestion.id, [updatedSuggestion.createdBy._id]);
          });

          buildfire.dialog.toast({message: state.strings['mainScreen.voteConfirmed'], type: 'info',});
          if (state.settings.inAppPurchase.enabled && state.settings.inAppPurchase.planId) {
            widgetController.decreaseUserCredits();
          }
        }).catch((err) => {
          console.error(err);
          upvote_icon.classList.remove('disabled');
          if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
        });
      } else {
        upvote_icon.classList.remove('disabled');
        if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
      }
    }).catch((err) => {
      console.error(err);
      upvote_icon.classList.remove('disabled');
      if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
    });
  },
  _handleUnVote(suggestion) {
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer.querySelector('#upvote_icon');
    const detailsVotesCount = detailsPageContainer.querySelector('#suggestionVotesCount');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer.querySelector('#upvote_icon');
    const suggestionVotesCount = suggestionContainer.querySelector('#suggestionVotesCount');

    this._confirmUserAction({
      title: state.strings['unvoteMessage.title'] || 'Remove Vote',
      message: state.strings['unvoteMessage.body'] || 'Removing your vote will not refund your voting credit. Voting again will deduct anther credit.',
      confirmButton: {
        text: state.strings['unvoteMessage.remove'] || 'Remove'
      },
      cancelButtonText: state.strings['unvoteMessage.cancel'] || 'Cancel',
      requireConfirm: state.settings.inAppPurchase.enabled && state.settings.inAppPurchase.planId
    }).then((isConfirmed) => {
      if (isConfirmed) {
        widgetController.handleSuggestionUnVote(suggestion).then((updatedSuggestion) => {
          upvote_icon.className = 'padding-zero margin--zero iconsTheme material-icons-outlined';
          suggestionVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;

          if (detailsVoteIcon) detailsVoteIcon.className = 'padding-zero margin--zero iconsTheme material-icons-outlined';
          if (detailsVotesCount) detailsVotesCount.innerHTML = `<span class="margin--0 iconsTheme">${Object.keys(updatedSuggestion.upVotedBy).length}</span>`;
        }).catch((err) => {
          console.error(err);
          upvote_icon.classList.remove('disabled');
          if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
        });
      } else {
        upvote_icon.classList.remove('disabled');
        if (detailsVoteIcon) detailsVoteIcon.classList.remove('disabled');
      }
    });
  },
  voteToSuggestion(suggestion) {
    if (!authManager.currentUser) {
      return authManager.enforceLogin().then(() => widgetSharedController.voteToSuggestion(suggestion));
    }
    const detailsPageContainer = document.getElementById('suggestionPage');
    const detailsVoteIcon = detailsPageContainer.querySelector('#upvote_icon');

    const suggestionContainer = document.getElementById(`suggestion-${suggestion.id}`);
    const upvote_icon = suggestionContainer.querySelector('#upvote_icon');

    upvote_icon.classList.add('disabled');
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

    const wid = encodeURIComponent(widgetUtils.getUserName(suggestion.createdBy) + "-" + suggestion.createdOn)
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
