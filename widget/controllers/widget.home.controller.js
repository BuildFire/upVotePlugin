


var _currentUser = null;
var appThemeColors = null;
var isCardClicked = false;
buildfire.appearance.titlebar.show();

const callBacklogText = getLanguageValue("mainScreen.backlog") 
const callInProgressText = getLanguageValue("mainScreen.inProgress") 
const callCompletedText = getLanguageValue("mainScreen.completed") 

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
		
			showSkeleton()
			getSettings();


			buildfire.deeplink.getData((deeplinkData) => {});

			buildfire.deeplink.onUpdate((deeplinkData) => {
				if(deeplinkData){
					buildfire.spinner.show();
					init();
					var id = deeplinkData.split(":")[1]
					Suggestion.getById(id).then(_suggestion => {
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
				
				  
			  });

			buildfire.appearance.getAppTheme((err, result) => {
				if (err) return console.error(err);
				appThemeColors = result.colors
			  });

			  

			UpVoteHome.goToItemDetails = function (selectedItem) {
				if(isCardClicked){
					isCardClicked = false
					return;
				}
				document.getElementById("btn--add__container").classList.add("hidden")
				ViewStack.push({
					template: 'Item_details',
					item: selectedItem
				  });
				buildfire.history.push('Item_details', { elementToShow: 'Item_details' });
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
		
			function init() {
				let date = new Date();
				date.setDate(date.getDate() - 1);
		
		
				const options = {
					sort: { createdOn: -1 }
				}

				buildfire.datastore.onUpdate(function (obj) {
					if (obj) config = obj.data;
					UpVoteHome.text = config.text;
					if (!$scope.$$phase) $scope.$apply();
				});
				buildfire.datastore.get(function (err, obj) {
					if (obj) config = obj.data;
					UpVoteHome.text = config.text;
					if (!$scope.$$phase) $scope.$apply();
				});
				

				Promise.all([callBacklogText, callInProgressText,callCompletedText]).then(result => {
					$rootScope.TextStatuses = result;
					Suggestion.search(options).then(results => {
						results = results.filter(x => x.status != 3 || (x.status == 3 && new Date(x.createdOn) >= date))
						document.getElementById("btn--add__container").classList.remove("hidden")
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
									Suggestion.update(suggestion,()=>{})
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
		
			function getUserImage(createdBy){
				var url = './assets/images/avatar.png';
				if (createdBy) {
					url = buildfire.auth.getUserPictureUrl({ userId: createdBy._id });
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
				const h2 = document.createElement("h2")
				h2.innerHTML = title;

				const p = document.createElement("p")
				p.innerHTML = description;

				div.appendChild(h2)
				div.appendChild(p)

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
				const queryString = `wid=${createdBy.displayName}-${createdOn}&wTitle=${title}`;

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
											
											PushNotification.sendToCustomUsers("Task Completed", response.results[0].textValue, suggestion.id, voterIds);
										})
									} else if(suggestion.status === SUGGESTION_STATUS.INPROGRESS){
										PushNotification.sendToCustomUsers("Task in Progress", `"${suggestion.title}" has been marked as in progress`,suggestion.id, voterIds);
									}
									if (!$scope.$$phase) $scope.$apply();
								})
							}
							buildfire.components.drawer.closeDrawer();
						}
					);
			
			}
		
			$rootScope.upVote = function(suggestionObj) {
				isCardClicked = true;
				getUser(function(user) {
					if(!user) enforceLogin()
					if (!suggestionObj.upVotedBy) suggestionObj.upVotedBy = {};
					if (!suggestionObj.upVoteCount) suggestionObj.upVoteCount = 1;
		
					if (!suggestionObj.upVotedBy[user._id]) {
						// vote
						Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: 1, _buildfire: { aggregationValue: 1 } });
		
						suggestionObj.upVoteCount++;
						suggestionObj.disableUpvote = true;
						suggestionObj.upVotedBy[user._id] = {
							votedOn: new Date(),
							user: user
						};
		
						if (suggestionObj.createdBy._id != user._id) {
							buildfire.notifications.pushNotification.schedule(
								{
									title: 'You got an upvote!',
									text: getUserName(user) + ' upvoted your suggestion ' + suggestionObj.title,
									users: [suggestionObj.createdBy._id]
								},
								function (err) {
									if (err) console.error(err);
								}
							);
						}
					} else {
						// unvote
						Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: -1, _buildfire: { aggregationValue: -1 } });
		
						suggestionObj.upVoteCount--;
						suggestionObj.disableUpvote = false;
						delete suggestionObj.upVotedBy[user._id];
					}
		
					if (suggestionObj.upVoteCount < 10) {
						/// then just to a hard count just in case
						suggestionObj.upVoteCount = Object.keys(suggestionObj.upVotedBy).length;
					}
					suggestionObj.upvoteByYou = suggestionObj.upVotedBy[user._id] != null
					if (!$scope.$$phase) $scope.$apply();
					Suggestion.update(suggestionObj)
							  .then(()=>{})
							  .catch((err) => console.log(err))
				});
			};
		
			window.openPopup = function() {
				if(_currentUser){
					const step1 = {
						placeholder: "Enter short title*",
						saveText: "Next",
						defaultValue: "",
						required: true
					  }
					const step2 = {
						placeholder: "Add more details*",
						saveText: "Submit",
						defaultValue: "",
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
					createdBy: user,
					createdOn: new Date(),
					upVoteCount: 1,
					upVotedBy: {},
					status: SUGGESTION_STATUS.BACKLOG
				};
				obj.upVotedBy[user._id] = {
					votedOn: new Date(),
					user: user
				};
		
				Suggestion.insert(obj, (err, result) => {
					buildfire.dialog.toast({
						message: "Your suggestion has been successfully added.",
						type: "info"
					  });
					const suggestion = new Suggestion(result)
					suggestion.disableUpvote = true;
					suggestion.statusName = $rootScope.TextStatuses[0];

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
			});

			UpVoteHome.listeners['BEFORE_POP'] = $rootScope.$on('BEFORE_POP', function (e, item) {
				document.getElementById("btn--add__container").classList.remove("hidden")
			});
		}
	]
	  )}
)(window.angular, window.buildfire);

