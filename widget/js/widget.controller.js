const widgetController = {
  extractUpdatedUsersData(suggestions) {
    return new Promise((resolve, reject) => {
      const usersIds = [];
      suggestions.forEach((suggestion) => {
        if (usersIds.indexOf(suggestion.createdBy.userId) === -1 && !state.updatedUsersData.some(updatedUser => updatedUser.userId === suggestion.createdBy.userId)) {
          usersIds.push(suggestion.createdBy.userId);
        }
        for (const voterId in suggestion.upVotedBy) {
          if (usersIds.indexOf(voterId) === -1 && !state.updatedUsersData.some(updatedUser => updatedUser.userId === voterId)) {
            usersIds.push(voterId);
          }
        }
      });
      if (usersIds.length) {
        authManager.getUpdatedUsersBatches(usersIds).then((updatedUsers) => {
          state.updatedUsersData = state.updatedUsersData.concat(updatedUsers);
          resolve();
        }).catch((err) => {
          console.error(err);
          resolve();
        })
      } else {
        resolve();
      }
    })
  },

  getSettings() {
    return new Promise((resolve) => {
      Settings.get().then((result) => {
        if (result && result.hasOwnProperty('selectedPurchaseProductId') && result.hasOwnProperty('votesCountPerPurchase')) {
          Settings.unifyOldSettingsData().then((unifiedSettings) => {
            state.settings = unifiedSettings;
            resolve();
          }).catch((err) => { // don't blok the ui, just print the error and resolve
            console.error(err);
            resolve();
          });
        } else {
          state.settings = new Setting(result);
          resolve();
        }

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
      const { page, pageSize, settings, startFetchingCompleted } = state;
      const searchOptions = { page, pageSize };
      let $match = {
        "_buildfire.index.string1": { $exists: false }
      }, $sort = {};

      if (startFetchingCompleted) {
        // hide completed immediately
        if (settings.hideCompletedItems === 0) return resolve([]);

        // hide completed after a certain period
        if (settings.hideCompletedItems > 0) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - settings.hideCompletedItems);

          $match['$and'] = [
            { status: SUGGESTION_STATUS.COMPLETED },
            { modifiedOn: { $gte: startDate } }
          ];
        } else {
          // never hide the completed items
          $match.status = { $eq: SUGGESTION_STATUS.COMPLETED };
        }
      } else {
        $match['$or'] = [
          { status: SUGGESTION_STATUS.BACKLOG },
          { status: SUGGESTION_STATUS.INPROGRESS },
        ];
      }

      switch (settings.defaultItemSorting) {
        case ENUMS.SUGGESTIONS_SORTING.NEWEST:
          $sort = {
            createdOn: -1,
          };
          break;
        case ENUMS.SUGGESTIONS_SORTING.OLDEST:
          $sort = {
            createdOn: 1,
          };
          break;
        case ENUMS.SUGGESTIONS_SORTING.MOST_VOTES:
        default:
          $sort = {
            upVotedByCount: -1,
          };
          break;
      }

      searchOptions.pipelineStages = [
        { $match },
        { "$addFields": { "upVotedByCount": { "$size": { "$objectToArray": "$upVotedBy" } } } },
        { $sort },
      ]

      Suggestions.aggregate(searchOptions).then((result) => {
        state.page += 1;
        this.extractUpdatedUsersData(result).then(() => {
          const syncedSuggestions = result.map((suggestion) => {
            const updatedCreator = state.updatedUsersData.find(updatedUser => updatedUser.userId === suggestion.createdBy.userId);
            if (updatedCreator) suggestion.createdBy = updatedCreator;

            for (const voterId in suggestion.upVotedBy) {
              const updatedVoter = state.updatedUsersData.find(updatedUser => updatedUser.userId === voterId);
              if (updatedVoter) suggestion.upVotedBy[voterId].user = updatedVoter;
            }

            return suggestion;
          }).filter((suggestion) => !state.suggestionsList.some(stateSuggestion => stateSuggestion.id === suggestion.id));
          state.suggestionsList = state.suggestionsList.concat(syncedSuggestions);

          resolve(syncedSuggestions);
        })
      });
    });
  },

  getFirstSuggestionsPage() {
    return new Promise((resolve, reject) => {
      this.getSuggestions().then((suggestions) => {
        if (suggestions.length >= 10) {
          resolve(suggestions);
        } else {
          state.startFetchingCompleted = true;
          state.page = 0;

          this.getSuggestions().then(() => {
            resolve(state.suggestionsList);
          });
        }
      })
    })
  },

  getSuggestionById(suggestionId) {
    return new Promise((resolve, reject) => {
      Suggestions.getById(suggestionId).then((suggestion) => {
        this.extractUpdatedUsersData([suggestion]).then(() => {
          const updatedCreator = state.updatedUsersData.find(updatedUser => updatedUser.userId === suggestion.createdBy.userId);
          if (updatedCreator) suggestion.createdBy = updatedCreator;

          for (const voterId in suggestion.upVotedBy) {
            const updatedVoter = state.updatedUsersData.find(updatedUser => updatedUser.userId === voterId);
            if (updatedVoter) suggestion.upVotedBy[voterId].user = updatedVoter;
          }

          resolve(suggestion);
        })
      }).catch(reject);
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
      }).catch(reject);
    });
  },

  handleSuggestionVote(suggestion) {
    return new Promise((resolve, reject) => {
      Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: 1, _buildfire: { aggregationValue: 1 } });

      Suggestions.update(suggestion.id, {
        $set: {
          [`upVotedBy.${authManager.currentUser.userId}`]: {
            user: widgetUtils.getUserNeededAuthData(authManager.currentUser),
            votedOn: new Date(),
          },
        },
      }).then(resolve).catch(reject);
    });
  },

  handleSuggestionUnVote(suggestion) {
    return new Promise((resolve, reject) => {
      Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: -1, _buildfire: { aggregationValue: -1 } });

      Suggestions.update(suggestion.id, {
        $unset: { [`upVotedBy.${authManager.currentUser.userId}`]: '' },
      }).then(resolve).catch(reject);
    });
  },

  updateSuggestionStatus(suggestionId, updatedStatus) {
    return new Promise((resolve, reject) => {
      Suggestions.update(suggestionId, {
        $set: { status: updatedStatus, modifiedOn: new Date() },
      }).then(resolve).catch(reject);
    });
  },

  createNewSuggestion(suggestionTitle, suggestionDescription) {
    return new Promise((resolve, reject) => {
      const newSuggestion = new Suggestion({
        title: suggestionTitle,
        suggestion: suggestionDescription,
        createdBy: widgetUtils.getUserNeededAuthData(authManager.currentUser),
        createdOn: new Date(),
        upVotedBy: {
          [authManager.currentUser.userId]: {
            user: widgetUtils.getUserNeededAuthData(authManager.currentUser),
            votedOn: new Date(),
          },
        },
      });
      Suggestions.insert(newSuggestion).then(resolve).catch(reject);
    });
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

        const payload = {
          $set: {
            credits: encryptedCredits,
            lastUpdatedBy: authManager.currentUser._id,
            lastUpdatedOn: new Date(),
          },
        };
        return UserCredits.update(authManager.currentUser._id, payload).then((updatedCredits) => {
          state.userCredits = {
            credits: encryptedCredits,
          };
          if (updatedUserCredits === 0) {
            Analytics.trackAction(analyticKeys.CONSUMING_CREDITS.key);
          }

          resolve(true);
        }).catch(reject);
      });
    });
  },

  addUserCredits() {
    return new Promise((resolve, reject) => {
      const encryptedCredits = widgetUtils.encryptCredit(state.settings.inAppPurchase.votesPerPurchase, ENUMS.SECRET_KEY);
      const payload = {
        $set: {
          lastUpdatedBy: authManager.currentUser._id,
          lastUpdatedOn: new Date(),
          credits: encryptedCredits,
          firstTimePurchase: true,
        },
      };
      UserCredits.update(authManager.currentUser._id, payload).then((updatedCredits) => {
        state.userCredits = {
          lastUpdatedBy: authManager.currentUser._id,
          credits: encryptedCredits,
          firstTimePurchase: true,
        };
        Analytics.trackAction(analyticKeys.CHARGING_CREDITS.key);

        resolve(true);
      }).catch(reject);
    });
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
      });
    });
  },
};
