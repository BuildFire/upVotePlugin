


var _currentUser = null;
var appThemeColors = null;
var isCardClicked = false;
buildfire.appearance.titlebar.show();

const callBacklogText = getLanguageValue("mainScreen.backlog")
const callInProgressText = getLanguageValue("mainScreen.inProgress")
const callCompletedText = getLanguageValue("mainScreen.completed")
const voteConfirmedText = getLanguageValue("mainScreen.voteConfirmed")

// secret key for user credit encoding
const secretKey = 'upvote';

function getLanguageValue(stringkey) {
	return new Promise((resolve, reject) => {
		buildfire.language.get({stringKey: stringkey}, (err, result) => {
		  if (err) reject({
			err
		  });
		  resolve(result);
		});
	  });
}

function getUser(callback) {
	if (_currentUser) {
		callback(_currentUser);
		return;
	}
	buildfire.auth.getCurrentUser(function(err, user) {
		if (err || !user) {
			callback(null);
			return console.error(err);
		}
		if(user){
			_currentUser = user;
			buildfire.notifications.pushNotification.subscribe(
				{},
				(err, subscribed) => {
				  if (err) return console.error(err);
				}
			  );
			callback(user)
		}
	});
}

function enforceLogin() {
	buildfire.auth.login({}, function(err, user) {
		if (err) {
			callback();
			return console.error(err);
		}
		_currentUser = user;
	});
}

var config = {};

'use strict';
(function (angular, buildfire) {
	angular
	  .module('upvote')
	  .controller('listCtrl', ['$scope', 'ViewStack', '$sce', '$rootScope',
		function ($scope, ViewStack, $sce, $rootScope) {
			var UpVoteHome = this;
			UpVoteHome.listeners = {};
			UpVoteHome.isInitalized = false;
			UpVoteHome.text;
			const platform = buildfire.context.device.platform.toLowerCase();
			let blockIAP = platform !== 'ios' && platform !== 'android';
			$scope.blockVote = false;
			$scope.currentUserCreditData = null;
			showSkeleton()

			const suggestionId = getSuggestionIdOnNewNotification()
			if(suggestionId != ''){
				navigateToItemDetails(suggestionId)
			}

			buildfire.deeplink.onUpdate((deeplinkData) => {
				if(deeplinkData){
					var id = deeplinkData.split("=")[1]
					navigateToItemDetails(id)
				}
			  });

			buildfire.appearance.getAppTheme((err, result) => {
				if (err) return console.error(err);
				appThemeColors = result.colors
			  });

			let votesExpressionOptions = {
				plugin: {
					remainingVotes: 0,
				}
			}

			buildfire.dynamic.expressions.getContext = (options, callback) => {
				callback(null, votesExpressionOptions)
			}

			UpVoteHome.goToItemDetails = function (selectedItem) {
				if($scope.blockVote) return;

				if(isCardClicked){
					isCardClicked = false
					return;
				}
				ViewStack.push({
					template: 'Item_details',
					item: selectedItem
				  });
				buildfire.history.push('Item_details', { elementToShow: 'Item_details' });
			}

			function getSuggestionIdOnNewNotification(){
				const getParamsRegex = /\?(.+)/;
				let suggestionId = '';
				if (getParamsRegex.test(location.href)) {
				const params = getParamsRegex.exec(location.href)[1].split('&');
				params.forEach((param) => {
						const keyValue = param.split('=');
						if (keyValue[0] === 'id') {
							suggestionId = keyValue[1];
						}
					});
				}
  				return suggestionId;
			}

			function navigateToItemDetails(suggestionId){
				buildfire.spinner.show();
				init();
				Suggestion.getById(suggestionId).then(_suggestion => {
					Promise.all([callBacklogText, callInProgressText,callCompletedText]).then(result => {
						$rootScope.TextStatuses = result;
						_suggestion.statusName = $rootScope.TextStatuses[_suggestion.status - 1]
						_suggestion._createdOn = getCurrentDate(_suggestion.createdOn);
						_suggestion._displayName = getUserName(_suggestion.createdBy);

						ViewStack.push({
							template: 'Item_details',
							item: _suggestion
						});
						buildfire.spinner.hide();

						buildfire.history.push('Item_details', { elementToShow: 'Item_details' })
					})

				})
			}

			function getUserName(user) {
                if (user) {
                    if (user.displayName) {
                        return user.displayName;
                    } else if ((user.firstName || user.lastName) && (user.firstName.trim() !=='' || user.lastName.trim() !=='')) {
                        return (
                            (user.firstName ? user.firstName : '') +
                            ' ' +
                            (user.lastName ? user.lastName : '')
                        );
                    } else {
                        return getLanguageString('mainScreen.unknownUser') || 'Someone';
                    }
                }
            }


			function showSkeleton() {
				let skeleton = document.getElementById("skeleton")
				for(let i=0;i<=2;i++){
					let div = document.createElement("div")
					div.classList.add("bf-skeleton-loader")
					div.classList.add("grid-block")
					skeleton.append(div);
				}
			}

			function hideSkeleton() {
				let skeleton = document.getElementById("skeleton")
				skeleton.style.display = "none";
			}

			function getSettings() {
				return Settings.get((err, result)=>{
					$rootScope.settings = result;
				})
			}

			function getLanguageString(stringkey){
				let string = '';
				buildfire.language.get({stringKey: stringkey}, (err, result) => {
					if (err) return console.error(err);
					string = result;
				  });

				  return string;
			}

			function init() {
				const options = {
                    sort: { createdOn: -1 },
                    filter: {},
                };

                if ($rootScope.settings.defaultItemSorting === 2) {
                    options.sort.createdOn = 1;
                } else if ($rootScope.settings.defaultItemSorting === 3) {
                    options.sort = { upVoteCount: -1 };
                }

                if ($rootScope.settings.hideCompletedItems !== -1) {
                    const startDate = getStartDate(
                        $rootScope.settings.hideCompletedItems
                    );
                    options.filter = {
                        $or: [
                            { status: { $ne: 3 } },
                            { status: 3, createdOn: { $gte: startDate } },
                        ],
                    };
                }

				buildfire.datastore.onUpdate(function (obj) {
					if(obj && obj.tag === ''){
						if (obj) config = obj.data;
						UpVoteHome.text = config.text;
						if (!$scope.$$phase) $scope.$apply();
					}

				});
				buildfire.datastore.get(function (err, obj) {
					if (obj) config = obj.data;
					UpVoteHome.text = config.text;
					if (!$scope.$$phase) $scope.$apply();
				});


				Promise.all([callBacklogText, callInProgressText,callCompletedText]).then(result => {
					$rootScope.TextStatuses = result;
					Suggestion.search(options).then(results => {
						if (!results || !results.length) return update([]);

						results = results.map(checkYear);
						const promises = results.map(suggestion => {
							return new Promise(resolve => {
								buildfire.auth.getUserProfile({ userId: suggestion.createdBy._id }, (error, updatedUser) => {
									if (error || !updatedUser || !updatedUser._id) {
										console.warn('failed to update user profile:', suggestion.createdBy);
										return resolve(suggestion);
									}

									const hasUpdate = suggestion.createdBy.displayName !== updatedUser.displayName;

									suggestion.createdBy = updatedUser;
									resolve(suggestion);

									if (!hasUpdate) return;
									// update suggestion out of sync for next time
									Suggestion.update(suggestion).then(()=>{})
								});
							});
						});

						Promise.all(promises)
							.then(update)
							.catch(console.error);

						function update(data) {
							hideSkeleton();
							UpVoteHome.isInitalized = true;
							$scope.suggestions = data.map((suggestion) => {
								suggestion.imgUrl = 'assets/images/avatar.png';
								suggestion.imageInProgress = true;
								return suggestion;
							})
							$scope.suggestions = sortArray($scope.suggestions);
							$scope.suggestions.forEach((suggestion) => {
								const ownerImage = buildfire.auth.getUserPictureUrl({ userId: suggestion.createdBy._id });
								validateImage(ownerImage).then((isValid) => {
									if (isValid) {
										suggestion.imgUrl = buildfire.imageLib.cropImage(ownerImage, { size: 'm', aspect: '1:1' });
									}
									suggestion.imageInProgress = false;
									if (!$scope.$$phase) $scope.$apply();
								});
							})
							buildfire.spinner.hide();
							if (!$scope.$$phase) $scope.$apply();
						}

						function checkYear(item) {
							item._createdOn = getCurrentDate(item.createdOn);
							item._displayName = getUserName(item.createdBy)
							item.disableUpvote = _currentUser ? !item || !item.upVotedBy || item.upVotedBy[_currentUser._id] : false;
							item.upvoteByYou = item.upVotedBy && _currentUser && item.upVotedBy[_currentUser._id] != null;
							item.statusName = $rootScope.TextStatuses[item.status - 1]
							return item;
						}
					}).catch(err => console.log(err))
				})

			}

			getSettings().then(()=>{
				getUser(init);
			})

			buildfire.auth.onLogin(user => {
				_currentUser = user;
				init();
			});

			buildfire.auth.onLogout(() => {
				_currentUser = null;
				init();
			});

			function renderStatusItem(text, index){
				const element = `
					<span style="margin: 0px;font-weight: 400;color: ${appThemeColors.headerText};display: flex;align-items: center;gap: 10px;">
					    <span style="
					    display: inline-block;
					    width: 25px;
					    aspect-ratio: 1;
					    margin: 0;
					    background: ${getStatusColor(index)};
					    border-radius: 100%;"></span>${text}</span>`

				return element;
			}

			function getStatusColor(index){
				switch (index) {
					case 1:
						return "rgba(150, 150, 150, 0.1)";
					case 2:
						return appThemeColors.warningTheme
					case 3:
						return appThemeColors.successTheme
				}
			}

			function buildHeaderContentHtml(title, description){

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
			}

			$rootScope.goSocial = (suggestion = {}) => {
				isCardClicked = true;
				if (!suggestion || !$rootScope.settings.enableComments) return;

				const { title, createdOn, createdBy} = suggestion;

				const navigateToCwByDefault = (
					config && !Object.keys(config).length
						?
						true
						:
						config && config.navigateToCwByDefault
							?
							config.navigateToCwByDefault
							:
							false
				);
				const headerContentHtml = buildHeaderContentHtml(title, suggestion.suggestion);
				const wid = encodeURIComponent(createdBy.displayName + "-" + createdOn)
				const wTitle = encodeURIComponent(title);
				const queryString = `wid=${wid}&wTitle=${wTitle}`;

				buildfire.navigation.navigateToSocialWall({
					title,
					queryString,
					headerContentHtml,
					pluginTypeOrder: navigateToCwByDefault ? ['community', 'premium_social', 'social'] : ['premium_social', 'social', 'community']
				}, () => { });
			};

			$rootScope.showVoterModal = function (suggestion) {
				isCardClicked = true;
				var voterIds = Object.keys(suggestion.upVotedBy);
				Promise.all(
					voterIds.map(userId => {
						return new Promise((resolve, reject) => {
							buildfire.auth.getUserProfile({ userId }, (error, user) => {
								//if (error || !user) return reject(error);
								resolve(user);
							});
						});
					})
				).then(users => {
					const listItems = [];
					for(let i=0;i<users.length;i++){
						if(users[i]){
							const userImage = buildfire.auth.getUserPictureUrl({ userId: users[i]._id });
							const croppedUserImage = buildfire.imageLib.cropImage(userImage, { size: 'm', aspect: '1:1' });

							listItems.push({
								text: getUserName(users[i]),
								imageUrl: croppedUserImage,
							})
						}

					}
					getLanguageValue('mainScreen.upvotes').then((upvotesText) => {
						buildfire.components.drawer.open(
							{
							  content: `<b>${upvotesText}</b>`,
							  isHTML: true,
							  triggerCallbackOnUIDismiss: false,
							  autoUseImageCdn: true,
							  listItems: listItems
							},
							() => {}
						  );
					});
				});
			};

			$rootScope.openChangeStatusModal = function (suggestion) {
					isCardClicked = true;
					if(!_currentUser){
						enforceLogin();
						return;
					}
					if($rootScope.settings.statusUpdateUsersSegment === STATUS_UPDATE_SEGMENT.NO_USERS){
						return;
					}
					else if($rootScope.settings.statusUpdateUsersSegment === STATUS_UPDATE_SEGMENT.TAGS){
						if(!_currentUser) return;
						var userContainAnyStatusTags = false;
						if(_currentUser.tags && _currentUser.tags[buildfire.context.appId] && $rootScope.settings.statusUpdateTags.length > 0){
							_currentUser.tags[buildfire.context.appId].forEach(tag => {
							 $rootScope.settings.statusUpdateTags.forEach(settingTag => {
								if(settingTag.value == tag.tagName || settingTag.tagName == tag.tagName){
									userContainAnyStatusTags = true;
								}
							  })
							});
						}
						if(!userContainAnyStatusTags) return;
					}
					const listItems = []
					for(let i=1;i<=$rootScope.TextStatuses.length;i++){
						listItems.push({
							id: i,
							text: renderStatusItem($rootScope.TextStatuses[i-1], i),
							selected: suggestion.status === i
						});
					}

					const _appThemeColors = buildfire.getContext().appTheme.colors;
					getLanguageValue('mainScreen.updateStatus').then((headerText) => {
						buildfire.components.drawer.open(
							{
								multiSelection: false,
								allowSelectAll : false,
								content: `<div style="color:${_appThemeColors.headerText};font-weight: bold;">${headerText}</div>`,
								isHTML: true,
								triggerCallbackOnUIDismiss: false,
								listItems: listItems
							},
							(err, result) => {
								buildfire.components.drawer.closeDrawer();

								if (err) return console.error(err);

								if(suggestion.status != result.id){
									suggestion.status = parseInt(result.id)
									Suggestion.update(suggestion).then(()=>{
										suggestion.statusName = $rootScope.TextStatuses[suggestion.status-1]
										const voterIds = Object.keys(suggestion.upVotedBy);

										votesExpressionOptions.plugin.itemTitle = suggestion.title;
										Promise.all([
											getLanguageValue("notifications.backlogItemTitle"),
											getLanguageValue("notifications.backlogItemBody"),
											getLanguageValue("notifications.inProgressItemTitle"),
											getLanguageValue("notifications.inProgressItemBody"),
											getLanguageValue("notifications.completedItemBody"),
											getLanguageValue("notifications.completedItemMessageInputPlaceholder"),
											getLanguageValue("notifications.completedItemMessageSendText"),
											getLanguageValue("notifications.completedItemMessageCancelText"),
										])
										.then(([
											backlogItemTitle,
											backlogItemBody,
											inProgressItemTitle,
											inProgressItemBody,
											completedItemBody,
											completedItemMessageInputPlaceholder,
											completedItemMessageSendText,
											completedItemMessageCancelText,
										]) => {
											if(suggestion.status == SUGGESTION_STATUS.COMPLETED){
												buildfire.input.showTextDialog({
													placeholder: completedItemMessageInputPlaceholder,
													saveText: completedItemMessageSendText,
													defaultValue: completedItemMessageInputPlaceholder,
													required: true,
													cancelText: completedItemMessageCancelText
												}, (err, response)=>{
													if (err) console.error(err);
													if (response && response.results && response.results[0]) {
														PushNotification.sendToCustomUsers(completedItemBody, response.results[0].textValue, suggestion.id, voterIds);
													}
												})
											} else if(suggestion.status === SUGGESTION_STATUS.INPROGRESS){
												PushNotification.sendToCustomUsers(inProgressItemTitle, inProgressItemBody,suggestion.id, voterIds);
											} else if(suggestion.status === SUGGESTION_STATUS.BACKLOG){
												PushNotification.sendToCustomUsers(backlogItemTitle, backlogItemBody,suggestion.id, voterIds);
											}
											if (!$scope.$$phase) $scope.$apply();
										});
									});
								}
							}
						);
					})

			}

			const getPurchaseDialogOption = function(firstTimePurchase) {
				let options = {};
				if(!firstTimePurchase){
					options = {
						title:
							getLanguageString('firstTimePurchaseMessage.title') ||
							'Buy Credit',
						message:
							getLanguageString('firstTimePurchaseMessage.body') ||
							'Upvoting items is a premium feature. To upvote items, you need to purchase voting credits.',
						confirmButton: {
							text:
								getLanguageString('firstTimePurchaseMessage.buy') || 'Buy',
						},
						cancelButtonText:
							getLanguageString('firstTimePurchaseMessage.cancel') ||
							'Cancel',
					};
				}else{
					options = {
						title:
							getLanguageString('votesDepletedMessage.title') ||
							'Get More Votes',
						message:
							getLanguageString('votesDepletedMessage.body') ||
							"You don't have enough credit to cast a vote. Please consider purchasing additional voting credit.$",
						confirmButton: {
							text:
								getLanguageString('votesDepletedMessage.buyMore') ||
								'Buy More',
						},
						cancelButtonText:
							getLanguageString('votesDepletedMessage.cancel') || 'Cancel',
					};
				}

				return options;
			}

			const checkUserCredits = function () {
				if (!$rootScope.settings.selectedPurchaseProductId) {
					return Promise.resolve({});
				}
				let userId = '';
				getUser((user)=> {userId = user.userId; });
				return UserCredit.get(userId).then((result) => {
					$scope.currentUserCreditData = result;
					let credits = Number(
						decryptCredit(result.credits, secretKey)
					);
					if (credits > 0) {
						return result;
					} else {
						buildfire.dialog.confirm(
							getPurchaseDialogOption(result.firstTimePurchase),
							(err, isConfirmed) => {
								if (err) {
									return console.error(err);
								}

								if (isConfirmed) {
									return purchaseHandler();
								} else {
									$scope.blockVote = false;
									$scope.$apply();
								}
							}
						);
					}
				});
			};

			const purchaseHandler = function() {
				const platform = buildfire.getContext().device.platform;
				if (platform === 'web') {
					getLanguageValue('mainScreen.purchaseNotAvailable').then((toastMessage) => {
						buildfire.dialog.toast({
							message: toastMessage,
							type: 'danger',
						});
					});
					return;
				}
				if ($rootScope.settings.selectedPurchaseProductId) {
					if (!blockIAP) {
						$scope.blockVote = true;
						$scope.$apply();
						buildfire.dialog.toast({
							message:
								getLanguageString(
									'mainScreen.preparingPurchaseMessage'
								) ||
								'Getting your purchase ready, please wait...',
							duration: 5000,
							type: 'info',
						});
						buildfire.services.commerce.inAppPurchase.purchase(
							$rootScope.settings.selectedPurchaseProductId, (err, res) => {
								if (err || !res || res.hasErrors) {
									getLanguageValue('mainScreen.somethingWentWrong').then((toastMessage) => {
										buildfire.dialog.toast({
											message: toastMessage,
											type: 'danger',
										});

										if (err) console.error(err);
										return;
									});
								}

								if (res.isCancelled) {
									getLanguageValue('mainScreen.purchaseWasCancelled').then((toastMessage) => {
										buildfire.dialog.toast({
											message: toastMessage,
											type: 'warning',
										});
									})
									return;
								}
								if (res.isApproved) {
									return updateUserCredit().then(
										() => {
											return result;
										}
									);
								}
							}
						);
					} else {
						console.warn(
							"Sorry, you can't purchase this item on a browser, use IOS or Android devices to purchase"
						);
						return null;
					}
				}
				setTimeout(() => {
					$scope.blockVote = false;
					$scope.$apply();
				}, 3000);
			}

			const updateUserCredit = function () {
				let encrypted = encryptCredit($rootScope.settings.votesCountPerPurchase, secretKey);
				let payload = {
					$set: {
						createdBy: _currentUser.userId,
						credits: encrypted,
						firstTimePurchase: true
					}
				}
				return UserCredit.update($scope.currentUserCreditData.id, payload).then(()=>{
					Analytics.trackAction(analyticKeys.CHARGING_CREDITS.key);
				});
			}


			const upVoteHandler = (suggestionObj, user, isUserUpvoted)=>{
				checkUserCredits()
				.then((res) => {
					if (res) {
						isUserUpvoted = true;
						// vote
						Analytics.trackAction(
							analyticKeys.VOTE_NUMBER.key,
							{
								votes: 1,
								_buildfire: { aggregationValue: 1 },
							}
						);

						suggestionObj.upVoteCount++;
						suggestionObj.disableUpvote = true;
						suggestionObj.upVotedBy[user._id] = {
							votedOn: new Date(),
							user: user,
						};

						if (
							suggestionObj.createdBy._id != user._id
						) {
							buildfire.notifications.pushNotification.schedule(
								{
									title: 'You got an upvote!',
									text:
										getUserName(user) +
										' upvoted your suggestion ' +
										suggestionObj.title,
									users: [
										suggestionObj.createdBy._id,
									],
								},
								function (err) {
									if (err) console.error(err);
								}
							);
						}

						if ($rootScope.settings.selectedPurchaseProductId) {
							let credit = Number(
								decryptCredit(
									res.credits,
									secretKey
								)
							);
							credit -= 1;
							let payload = {
								$set: {
									updatedBy: _currentUser.userId,
									credits: encryptCredit(
										credit,
										secretKey
									),
								},
							};

							votesExpressionOptions.plugin.remainingVotes = credit
							return UserCredit.update($scope.currentUserCreditData.id,payload).then(
								() => {
									buildfire.language.get({stringKey: 'mainScreen.voteConfirmed'}, (err, result) => {
										if (err) return console.error(err);
										buildfire.dialog.toast({
											message: result,
											type: 'info',
										});
									});
									if(credit === 0){
										Analytics.trackAction(analyticKeys.CONSUMING_CREDITS.key);
									}
									return res;
								}
							);
						} else {
							return res;
						}
					} else {
						return null;
					}
				})
				.then((res) => {
					if (res)
						updateSuggestion(
							suggestionObj,
							user,
							isUserUpvoted
						);
				});
			};

			const downVoteHandler = (suggestionObj, user, isUserUpvoted)=>{
                        // unvote
                        Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, {
                            votes: -1,
                            _buildfire: { aggregationValue: -1 },
                        });
                        suggestionObj.upVoteCount--;
                        suggestionObj.disableUpvote = false;
                        delete suggestionObj.upVotedBy[user._id];
                        updateSuggestion(suggestionObj, user, isUserUpvoted);
			};

			$rootScope.upVote = function (suggestionObj) {
				isCardClicked = true;
                getUser(function (user) {
                    if (!user) enforceLogin();
                    if (!suggestionObj.upVotedBy) suggestionObj.upVotedBy = {};
                    if (!suggestionObj.hasOwnProperty('upVoteCount'))
                        suggestionObj.upVoteCount = 1;
                    let isUserUpvoted = false;

						if (!suggestionObj.upVotedBy[user._id]) {
							upVoteHandler(suggestionObj, user, isUserUpvoted);
						} else {
							if($rootScope.settings.selectedPurchaseProductId){
								unvoteDialog((err, result) => {
									if (err) return new Error(err);
									if (result){
										downVoteHandler(suggestionObj, user, isUserUpvoted);
									}
								})
							}else{
								downVoteHandler(suggestionObj, user, isUserUpvoted);
							}
						}
                });
            };

			const updateSuggestion =(suggestionObj,user, isUserUpvoted)=>{
				if (suggestionObj.upVoteCount < 10) {
					/// then just to a hard count just in case
					suggestionObj.upVoteCount = Object.keys(suggestionObj.upVotedBy).length;
				}
				suggestionObj.upvoteByYou = suggestionObj.upVotedBy[user._id] != null
				if (!$scope.$$phase) $scope.$apply();

				Suggestion.getById(suggestionObj.id).then(_suggestion => {
					if(_suggestion){
						_suggestion.upVoteCount = isUserUpvoted ? _suggestion.upVoteCount + 1 : _suggestion.upVoteCount - 1
						if(!isUserUpvoted){
							delete _suggestion.upVotedBy[user._id];
						} else {
							_suggestion.upVotedBy[user._id] = {
								votedOn: new Date(),
								user: user
							};
						}
						suggestionObj.upVoteCount = _suggestion.upVoteCount;
						suggestionObj.upVotedBy = _suggestion.upVotedBy;
						if (!$scope.$$phase) $scope.$apply();
						Suggestion.update(_suggestion).then(()=>{})
					}
				})
			}

			const unvoteDialog = (callback) =>{
				const dialogOptions = {
					title:getLanguageString('unvoteMessage.title') || 'Remove Vote',
					message:getLanguageString('unvoteMessage.body') || 'Removing your vote will not refund your voting credit. Voting again will deduct anther credit.',
					confirmButton:{
						text:getLanguageString('unvoteMessage.remove') || 'Remove'
					},
					cancelButtonText:getLanguageString('unvoteMessage.cancel') || 'Cancel',
				}
				buildfire.dialog.confirm(
					dialogOptions,
					(err, isConfirmed) => {
							if (err) return console.error(err);
							if (isConfirmed) {
							callback(null, true);
						} else {
							callback(null, false);
						}
					}
				);
			}

			window.openPopup = function() {
				if(_currentUser){
					const step1 = {
						placeholder:getLanguageString('addNewItem.title') || "Enter short title*",
						saveText:getLanguageString('addNewItem.next')  || "Next",
						defaultValue: "",
						cancelText: getLanguageString('addNewItem.cancel') || "Cancel",
						required: true,
						maxLength: 500
					  }
					const step2 = {
						placeholder: getLanguageString('addNewItem.description') || "Add more details*",
						saveText: getLanguageString('addNewItem.submit') || "Submit",
						defaultValue: "",
						cancelText: getLanguageString('addNewItem.cancel') || "Cancel",
						attachments: {
							images: { enable: true, multiple: false },
						  },
						required: true,
					}

					buildfire.input.showTextDialog([step1, step2], (err, response)=>{
						if(response.results.length == 2){
							const paragraph = document.createElement("p")
							paragraph.innerHTML = response.results[1].textValue;
							const images = response.results[1].images;
							if(images && images.length > 0){
								for(let i=0;i<images.length;i++){
									const imgEl = document.createElement("img");
									const imgUrl = buildfire.imageLib.cropImage( images[i],{ size: "full_width", aspect: "16:9" })
									imgEl.src = imgUrl;
									paragraph.append(imgEl);
								}
							}

							const title = response.results[0].textValue;
							const description = paragraph.innerHTML;
							addSuggestion(title, description)
						}


					})

				} else {
					enforceLogin();
				}
			};

			function addSuggestion(title, description) {

				getUser(function (user) {
					_addSuggestion(user, title, description);
					Analytics.trackAction(analyticKeys.SUGGESTIONS_NUMBER.key, { _buildfire: { aggregationValue: 1 } });
					if (!$scope.$$phase) $scope.$apply();
				});
			};

			function _addSuggestion(user, title, text) {
				if (!user || !title || !text) return;

				var obj = {
					title: title,
					suggestion: text,
					createdBy: {
						_id: user._id,
						displayName: user.displayName,
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName,
					},
					createdOn: new Date(),
					upVoteCount: 1,
					upVotedBy: {},
					status: SUGGESTION_STATUS.BACKLOG
				};
				obj.upVotedBy[user._id] = {
					votedOn: new Date(),
					user: user,
				};

				Suggestion.insert(obj, (err, result) => {
					let languageKey = 'mainScreen.suggestionSuccessfullyAdded';
					if (err) languageKey = 'mainScreen.somethingWentWrong';

					getLanguageValue(languageKey).then((toastMessage) => {
						buildfire.dialog.toast({
							message: toastMessage,
							type: "info"
						});

						if (err) return console.error(err);

						const suggestion = new Suggestion(result)
						suggestion.disableUpvote = true;
						suggestion.statusName = $rootScope.TextStatuses[0];
						suggestion.upvoteByYou = true;
						$scope.suggestions.unshift(suggestion);
						if($rootScope.settings){
							votesExpressionOptions.plugin.itemTitle = suggestion.title;
							Promise.all([getLanguageValue("notifications.newItemTitle"), getLanguageValue("notifications.newItemBody")])
							.then(([title, message]) => {
								if($rootScope.settings.pushNotificationUsersSegment === PUSH_NOTIFICATIONS_SEGMENT.ALL_USERS){
									PushNotification.sendToAll(title, message, suggestion.id);
								} else if($rootScope.settings.pushNotificationUsersSegment === PUSH_NOTIFICATIONS_SEGMENT.TAGS){
									const userTags = $rootScope.settings.pushNotificationTags.map(tag=> (tag.tagName ? tag.tagName : tag.value));
									if(userTags.length > 0){
										PushNotification.sendToUserSegment(title, message, suggestion.id, userTags)
									}
								}
							})
						}
						suggestion._createdOn = getCurrentDate(suggestion.createdOn);
						suggestion._displayName = getUserName(suggestion.createdBy);

						suggestion.imgUrl = 'assets/images/avatar.png';
						suggestion.imageInProgress = true;
						const ownerImage = buildfire.auth.getUserPictureUrl({ userId: suggestion.createdBy._id });
						validateImage(ownerImage).then((isValid) => {
							if (isValid) {
								suggestion.imgUrl = buildfire.imageLib.cropImage(ownerImage, { size: 'm', aspect: '1:1' });
							}
							suggestion.imageInProgress = false;
							if (!$scope.$$phase) $scope.$apply();
						});

						if (!$scope.$$phase) $scope.$apply();
					});
				})
			}

			function getCurrentDate(createdon){
				const createdDate = new Date(createdon);
				const currentDate = new Date();

				const timeDifference = currentDate.getTime() - createdDate.getTime();
				const minutesDifference = Math.floor(timeDifference / (1000 * 60));
				const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
				const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

				if(hoursDifference < 24 && hoursDifference != 0){
				  return hoursDifference + "hour";
				} else if(hoursDifference == 0){
				  return minutesDifference + "min"
				} else if(daysDifference == 1) {
				  return "1day"
				} else {
				  return null;
				}
			}
			$rootScope.safeHtml = function (html) {
				if (html) {
					var $html = $('<div />', {html: html});
					$html.find('iframe').each(function (index, element) {
						var src = element.src;
						src = src && src.indexOf('file://') != -1 ? src.replace('file://', 'http://') : src;
						element.src = src && src.indexOf('http') != -1 ? src : 'http:' + src;
					});
					return $sce.trustAsHtml($html.html());
				}
			};


			UpVoteHome.listeners['SETTINGS_UPDATED'] = $rootScope.$on('SETTINGS_UPDATED', function (e, item) {
				$rootScope.settings = item;
				init();
			});

			UpVoteHome.listeners['BEFORE_POP'] = $rootScope.$on('BEFORE_POP', function (e, item) {
			});
		}
	]
	  )}
)(window.angular, window.buildfire);

