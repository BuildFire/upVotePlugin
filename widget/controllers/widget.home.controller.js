


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
			showSkeleton()
			getSettings();
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

			let remainingVotesExpressionOptions = {
				plugin: {
					remainingVotes: 0,
				}
			}
			
			buildfire.dynamic.expressions.getContext = (options, callback) => {
				callback(null, remainingVotesExpressionOptions)
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
						_suggestion.imgUrl = getUserImage(_suggestion.createdBy);
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

			function getUserName(user){
				if(user){
					if(user.displayName) return user.displayName;
					else return user.firstName + " " + user.lastName
				}
				return "Someone";
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
				Settings.get((err, result)=>{
					$rootScope.settings = result;
				})
			}

			function getString(stringkey){
				let string = '';
				buildfire.language.get({stringKey: stringkey}, (err, result) => {
					if (err) return console.error(err);
					string = result;
				  });

				  return string;
			}
		
			function init() {
				let date = new Date();
				date.setDate(date.getDate() - 1);
		
		
				const options = {
					sort: { createdOn: -1 }
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
						results = results.filter(x => x.status != 3 || (x.status == 3 && new Date(x.createdOn) >= getStartDate($rootScope.settings.hideCompletedItems)))
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
							$scope.suggestions = data;
							$scope.suggestions = sortArray($rootScope.settings.defaultItemSorting,$scope.suggestions);
							buildfire.spinner.hide();
							if (!$scope.$$phase) $scope.$apply();
						}
			
						function checkYear(item) {
							item._createdOn = getCurrentDate(item.createdOn);
							item._displayName = getUserName(item.createdBy)
							item.disableUpvote = _currentUser ? !item || !item.upVotedBy || item.upVotedBy[_currentUser._id] : false;
							item.upvoteByYou = item.upVotedBy && _currentUser && item.upVotedBy[_currentUser._id] != null;
							item.statusName = $rootScope.TextStatuses[item.status - 1]
							item.imgUrl = getUserImage(item.createdBy);
							return item;
						}
					}).catch(err => console.log(err))
				})
				
			}
		
			getUser(init);
		
			buildfire.auth.onLogin(user => {
				_currentUser = user;
				init();
			});
		
			buildfire.auth.onLogout(() => {
				_currentUser = null;
				init();
			});
		
			function getUserImage(user){
				var url = './avatar.png';
				if (user) {
				  url = buildfire.auth.getUserPictureUrl({ userId: user._id });
				  url = buildfire.imageLib.cropImage(url,{ size: "xs", aspect: "1:1" });
				  return url;
				}
				return url;
			}
		
			function renderStatusItem(text, index){
				const element = `
				<div style='display:flex;color:'${appThemeColors.headerText}';font-weight:500;font-size:16px;line-height:24px'>
						<span style='width: 24px;height: 24px;border-radius: 50%;margin-right: 16px;background-color:
						   ${getStatusColor(index)}'></span> ${text} </div>`
		
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
							listItems.push({
								text: getUserName(users[i]), imageUrl:buildfire.auth.getUserPictureUrl({ userId: users[i]._id }) 
							})
						}
						
					}
					buildfire.components.drawer.open(
						{
						  content: '<b>Upvotes</b>',
						  isHTML: true,
						  triggerCallbackOnUIDismiss: false,   
						  autoUseImageCdn: true,
						  listItems: listItems
						},
						() => {}
					  );
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
								if(settingTag.tagName == tag.tagName){
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
							text: renderStatusItem($rootScope.TextStatuses[i-1], i)
						})
					}
					buildfire.components.drawer.open(
						{
							content: '<b>Update Status</b>',
							isHTML: true,
							triggerCallbackOnUIDismiss: false,   
							listItems: listItems
						},
						(err, result) => {
							if(suggestion.status != result.id){
								suggestion.status = parseInt(result.id) 
								Suggestion.update(suggestion).then(()=>{
									suggestion.statusName = $rootScope.TextStatuses[suggestion.status-1]
									const voterIds = Object.keys(suggestion.upVotedBy);
									if(suggestion.status == SUGGESTION_STATUS.COMPLETED){
										buildfire.input.showTextDialog({
											placeholder: `"${suggestion.title}" has been marked as completed`,
											saveText: "Post",
											defaultValue: `"${suggestion.title}" has been marked as completed`,
											required: true
										}, (err, response)=>{
											//$rootScope.goSocial(suggestion);
											PushNotification.sendToCustomUsers("Task Completed", response.results[0].textValue, suggestion.id, voterIds);
										})
									} else if(suggestion.status === SUGGESTION_STATUS.INPROGRESS){
										PushNotification.sendToCustomUsers("Task in Progress", `"${suggestion.title}" has been marked as in progress`,suggestion.id, voterIds);
									} else if(suggestion.status === SUGGESTION_STATUS.BACKLOG){
										PushNotification.sendToCustomUsers("Task in Backlog", `"${suggestion.title}" has been marked as in backlog`,suggestion.id, voterIds);
									}
									if (!$scope.$$phase) $scope.$apply();
								})
							}
							buildfire.components.drawer.closeDrawer();
						}
					);
			
			}

			const checkUserCredits = function () {
                const firstTimePurchaseOptions = {
                    title:
                        getString('firstTimePurchaseMessage.title') ||
                        'Buy Credit',
                    message:
                        getString('firstTimePurchaseMessage.body') ||
                        'Upvoting items is a premium feature. To upvote items, you need to purchase voting credits.',
                    confirmButton: {
                        text:
                            getString('firstTimePurchaseMessage.buy') || 'Buy',
                    },
                    cancelButtonText:
                        getString('firstTimePurchaseMessage.cancel') ||
                        'Cancel',
                };

                const defaultOptions = {
                    title:
                        getString('votesDepletedMessage.title') ||
                        'Get More Votes',
                    message:
                        getString('votesDepletedMessage.body') ||
                        'You don\'t have enough credit to cast a vote. Please consider purchasing additional voting credit.$',
                    confirmButton: {
                        text:
                            getString('votesDepletedMessage.buyMore') ||
                            'Buy More',
                    },
                    cancelButtonText:
                        getString('votesDepletedMessage.cancel') || 'Cancel',
                };
                if (!$rootScope.settings.productId) {
                    return Promise.resolve({});
                }
                return UserCredit.get().then((result) => {
                    let credits = Number(
                        decryptCredit(result.credits, secretKey)
                    );
                    if (credits > 0) {
                        return result;
                    } else {
						$scope.blockVote = true;
						$scope.$apply();
                        buildfire.dialog.confirm(
                            !result.firstTimePurchase
                                ? defaultOptions
                                : firstTimePurchaseOptions,
                            (err, isConfirmed) => {
                                if (err) {
									$scope.blockVote = false;
									$scope.$apply();
									return console.error(err)
								};

                                if (isConfirmed) {
                                    if ($rootScope.settings.productId) {
										if (!blockIAP) {
											buildfire.dialog.toast({
												message: getString('mainScreen.preparingPurchaseMessage') || 'Getting your purchase ready, please wait...',
												duration: 4000,
												type: 'info',
											});
                                            buildfire.services.commerce.inAppPurchase.purchase(
                                                $rootScope.settings.productId,
                                                (err, res) => {
                                                    if (err){
														$scope.blockVote = false;
														$scope.$apply();
                                                        return console.error(
                                                            err
                                                        );
													}
													if(res.hasErrors){
														$scope.blockVote = false;
														$scope.$apply();
														return console.error('Something went wrong, please try again')
													}
													if(res.isCancelled){
														$scope.blockVote = false;
														$scope.$apply();
														buildfire.dialog.toast({
															message: 'The purchase was cancelled',
															type: 'warning',
														});
														return;
													}
													if(res.isApproved){
														return updateUserCredit().then(
															() => {
																$scope.blockVote = false;
																$scope.$apply();
																return result;
															}
														);
													}
                                                }
                                            );
                                        } else {
											$scope.blockVote = false;
											$scope.$apply();
                                            console.warn(
                                                "Sorry, you can't purchase this item on a browser, use IOS or Android devices to purchase"
                                            );
                                            return null;
                                        }
                                    }
                                }else{
									$scope.blockVote = false;
									$scope.$apply();
								}
                            }
						);
                    }
                });
            };

			const updateUserCredit = function(){
				let encrypted = encryptCredit($rootScope.settings.votesPerPurchase,secretKey);
				let payload = {
					$set:{
						createdBy: _currentUser.userId,
						credits: encrypted,
						firstTimePurchase: true
					}
				}
				return UserCredit.save(payload);
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

						if ($rootScope.settings.productId) {
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

							remainingVotesExpressionOptions.plugin.remainingVotes = credit
							return UserCredit.save(payload).then(
								() => {
									buildfire.language.get({stringKey: 'mainScreen.voteConfirmed'}, (err, result) => {
										if (err) return console.error(err);
										buildfire.dialog.toast({
											message: result,
											type: 'info',
										});
									});
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
							if($rootScope.settings.productId){
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
					title:getString('unvoteMessage.title') || 'Remove Vote',
					message:getString('unvoteMessage.body') || 'Removing your vote will not refund your voting credit. Voting again will deduct anther credit.',
					confirmButton:{
						text:getString('unvoteMessage.remove') || 'Remove'
					},
					cancelButtonText:getString('unvoteMessage.cancel') || 'Cancel',
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
						placeholder:getString('addNewItem.title') || "Enter short title*",
						saveText:getString('addNewItem.next')  || "Next",
						defaultValue: "",
						cancelText: getString('addNewItem.cancel') || "Cancel",
						required: true,
						maxLength: 500
					  }
					const step2 = {
						placeholder: getString('addNewItem.description') || "Add more details*",
						saveText: getString('addNewItem.submit') || "Submit",
						defaultValue: "",
						cancelText: getString('addNewItem.cancel') || "Cancel",
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
			
			// ! for demo purposes only
			$rootScope.insertDummySuggestion = function(dayBefore, title , text){
				let customDay = document.getElementById('dummyDayInput').value;
				if(!dayBefore) {
					dayBefore = Number(customDay);
					title = `before ${dayBefore} days`;
				}
				getUser(function (user) {
					if (!user || !title || !text) return;
					
					var obj = {
						title: title,
						suggestion: text,
						createdBy: user,
						createdOn: new Date(Date.now() - dayBefore * 24 * 60 * 60 * 1000).toISOString(),
						upVoteCount: 1,
						upVotedBy: {},
						status: SUGGESTION_STATUS.BACKLOG
					};
					obj.upVotedBy[user._id] = {
						votedOn: new Date(),
						user: user, 
					};
			
					Suggestion.insert(obj, (err, result) => {
						buildfire.dialog.toast({
							message: "Your suggestion has been successfully added.",
							type: "info"
						  });
						const suggestion = new Suggestion(result)
						suggestion.disableUpvote = true;
						suggestion.statusName = $rootScope.TextStatuses[0];
						suggestion.upvoteByYou = true;
						$scope.suggestions.unshift(suggestion);
						if($rootScope.settings){
							const title = "A new item has been created";
							const message = `A "${suggestion.title}" has been created`;
							if($rootScope.settings.pushNotificationUsersSegment === PUSH_NOTIFICATIONS_SEGMENT.ALL_USERS){
								PushNotification.sendToAll(title, message, suggestion.id);
							} else if($rootScope.settings.pushNotificationUsersSegment === PUSH_NOTIFICATIONS_SEGMENT.TAGS){
								const userTags = $rootScope.settings.pushNotificationTags.map(tag=> tag.tagName);
								if(userTags.length > 0){
									PushNotification.sendToUserSegment(title, message, suggestion.id, userTags)
								}
							}
						}
						suggestion._createdOn = getCurrentDate(suggestion.createdOn);
						suggestion.createdBy = _currentUser
						suggestion._displayName = getUserName(suggestion.createdBy);
						suggestion.imgUrl = getUserImage(suggestion.createdBy);
	
						if (!$scope.$$phase) $scope.$apply();
					})
				});

			}
			// !---------

			function _addSuggestion(user, title, text) {
				if (!user || !title || !text) return;
				
				let isIAPEnabled = $rootScope.settings.productId ? true: false;
				var obj = {
					title: title,
					suggestion: text,
					createdBy: user,
					createdOn: new Date(),
					upVoteCount: isIAPEnabled ? 0: 1,
					upVotedBy: {},
					status: SUGGESTION_STATUS.BACKLOG
				};
				if(!$rootScope.settings.productId){
					obj.upVotedBy[user._id] = {
						votedOn: new Date(),
						user: user, 
					};
				}
		
				Suggestion.insert(obj, (err, result) => {
					buildfire.dialog.toast({
						message: "Your suggestion has been successfully added.",
						type: "info"
					  });
					const suggestion = new Suggestion(result)
					suggestion.disableUpvote = isIAPEnabled ? false : true;
					suggestion.statusName = $rootScope.TextStatuses[0];
					suggestion.upvoteByYou =  isIAPEnabled ? false : true;
					$scope.suggestions.unshift(suggestion);
					if($rootScope.settings){
						const title = "A new item has been created";
						const message = `A "${suggestion.title}" has been created`;
						if($rootScope.settings.pushNotificationUsersSegment === PUSH_NOTIFICATIONS_SEGMENT.ALL_USERS){
							PushNotification.sendToAll(title, message, suggestion.id);
						} else if($rootScope.settings.pushNotificationUsersSegment === PUSH_NOTIFICATIONS_SEGMENT.TAGS){
							const userTags = $rootScope.settings.pushNotificationTags.map(tag=> tag.tagName);
							if(userTags.length > 0){
								PushNotification.sendToUserSegment(title, message, suggestion.id, userTags)
							}
						}
					}
					suggestion._createdOn = getCurrentDate(suggestion.createdOn);
					suggestion.createdBy = _currentUser
					suggestion._displayName = getUserName(suggestion.createdBy);
					suggestion.imgUrl = getUserImage(suggestion.createdBy);

					if (!$scope.$$phase) $scope.$apply();
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

