

var upvoteApp = angular.module('upvote', []);

var _currentUser = null;

buildfire.appearance.titlebar.show();

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
		if(user){
			buildfire.notifications.pushNotification.subscribe({ groupName: 'suggestions' });
		}
	});
}

var config = {};

upvoteApp.controller('listCtrl', ['$scope', listCtrl]);
function listCtrl($scope) {
	$scope.suggestions = [];
	$scope.isInitalized = false;

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

	function init() {
		showSkeleton()
		buildfire.spinner.show();
		$scope.suggestions = [];
		$scope.isInitalized = false;
		const options = {
			sort: { upVoteCount: -1 }
		}

		Suggestion.search(options).then(results => {
			document.getElementById("btn--add__container").classList.remove("hidden")
			buildfire.spinner.hide();
			hideSkeleton();
			if (!results || !results.length) return update([]);

			results = results.map(checkYear);

			// quickly display the out of date suggestions,
			// they will update after promises resolve
			update(results);

			const promises = results.map(suggestion => {
				return new Promise(resolve => {
					buildfire.auth.getUserProfile({ userId: suggestion.createdBy._id }, (error, updatedUser) => {
						if (error || !updatedUser._id) {
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
				$scope.isInitalized = true;
				$scope.suggestions = data;
				buildfire.spinner.hide();
				if (!$scope.$$phase) $scope.$apply();
			}

			function checkYear(item) {
				var creationYear = new Date(item.createdOn).getFullYear();
				var currentYear = new Date().getFullYear();

				item.isCurrentYear = creationYear === currentYear;
				item.disableUpvote = _currentUser ? !item || !item.upVotedBy || item.upVotedBy[_currentUser._id] : false;

				return item;
			}
		}).catch(err => console.log(err))
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

	$scope.goSocial = (suggestion = {}) => {
		if (!suggestion) return;
		const { title, createdOn, createdBy } = suggestion;
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
		const queryString = `wid=${createdBy.displayName}-${createdOn}&wTitle=${title}`;
		buildfire.navigation.navigateToSocialWall({
			title,
			queryString,
			pluginTypeOrder: navigateToCwByDefault ? ['community', 'premium_social', 'social'] : ['premium_social', 'social', 'community']
		}, () => { });
	};

	$scope.showVoterModal = function (suggestion) {
		var voterIds = Object.keys(suggestion.upVotedBy);
		Promise.all(
			voterIds.map(userId => {
				return new Promise((resolve, reject) => {
					buildfire.auth.getUserProfile({ userId }, (error, user) => {
						if (error || !user) return reject(error);
						resolve(user);
					});
				});
			})
		).then(users => {
		    const listItems = [];
			for(let i=0;i<users.length;i++){
				listItems.push({
					text: users[i].firstName + " " + users[i].lastName , imageUrl:buildfire.auth.getUserPictureUrl({ userId: users[i]._id }) 
				})
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

	$scope.upVote = function(suggestionObj) {
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
							text: user.displayName + ' upvoted your suggestion ' + suggestionObj.title,
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
			Suggestion.update(suggestionObj,()=>{})
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
				required: true
			  }
			const steps = [step1, step2];

			buildfire.input.showTextDialog(steps, (err, response)=>{
				const title = response.results[0].textValue
				const description = response.results[1].textValue
				addSuggestion(title, description)
			})
		} else {
			enforceLogin();
		}
	};

	function addSuggestion(title, description) {

		getUser(function (user) {
			_addSuggestion(user, title, description);
			$scope.popupOn = false;

			Analytics.trackAction(analyticKeys.SUGGESTIONS_NUMBER.key, { _buildfire: { aggregationValue: 1 } });
			buildfire.notifications.pushNotification.schedule(
				{
					title: 'New suggestion by ' + user.displayName,
					text: title,
					//,at: new Date()
					groupName: 'suggestions'
				},
				function (err) {
					if (err) console.error(err);
				}
			);

			$scope.clearForm();
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
			$scope.suggestions.unshift(suggestion);
			if (!$scope.$$phase) $scope.$apply();
		})
	}
}
upvoteApp.filter('getUserImage', function () {
	return function (user) {
		var url = './avatar.png';
		if (user) {
			url = buildfire.auth.getUserPictureUrl({ userId: user._id });
			url = buildfire.imageLib.cropImage(url,{ size: "xs", aspect: "1:1" });
			return url;
		}
		return url;
	};
});

