/**
 * Created by danielhindi on 8/31/17.
 */

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

	$scope.$on('suggestionAdded', function (e, obj) {
		obj.disableUpvote = true;
		$scope.suggestions.unshift(obj);
		if (!$scope.$$phase) $scope.$apply();
	});

	// added pluginInstance search to find out if social wall is available
	var social = function () {
		buildfire.pluginInstance.search({}, function (err, instances) {
			if (err) return console.error(err);
			if (typeof instances !== 'object') return;

			let { result } = instances;

			result = (result || [])
				.filter(i => i.data._buildfire)
				.some(r => {
					if (r.data._buildfire.pluginType.result[0].name.toLowerCase().indexOf('social') >= 1) {
						$scope.hasSocial = true;
						if (!$scope.$$phase) $scope.$apply();
						return true;
					}
				});
		});
	};

	function init() {

		buildfire.spinner.show();
		$scope.suggestions = [];
		$scope.isInitalized = false;

		buildfire.publicData.search({ sort: { upVoteCount: -1 } }, 'suggestion', function (err, results) {
			social();

			if (err) return console.error(err);
			if (!results || !results.length) return update([]);

			results = results.map(checkYear);

			// quickly display the out of date suggestions,
			// they will update after promises resolve
			update(results);

			const promises = results.map(s => {
				return new Promise(resolve => {
					buildfire.auth.getUserProfile({ userId: s.data.createdBy._id }, (error, updatedUser) => {
						if (error || !updatedUser._id) {
							console.warn('failed to update user profile:', s.data.createdBy);
							return resolve(s);
						}

						const hasUpdate = s.data.createdBy.displayName !== updatedUser.displayName;

						s.data.createdBy = updatedUser;
						resolve(s);

						if (!hasUpdate) return;
						// update suggestion out of sync for next time
						buildfire.publicData.update(s.id, s.data, 'suggestion', e => {
							if (e) console.error(e);
						});
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
				var creationYear = new Date(item.data.createdOn).getFullYear();
				var currentYear = new Date().getFullYear();

				item.isCurrentYear = creationYear === currentYear;
				item.disableUpvote = _currentUser ? !item || !item.data.upVotedBy || item.data.upVotedBy[_currentUser._id] : false;

				return item;
			}
		});
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

	$scope.goSocial = (s = {}) => {
		if (!s.data) return;
		const { title, createdOn, createdBy } = s.data;
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

	$scope.showVoterModal = function (s) {
		var voterIds = Object.keys(s.data.upVotedBy);
		if (!voterIds.length) {
			var richContent = '<p style="padding-top: 10px; text-align: center">No votes yet!<p>';
			var options = { richContent };
			return buildfire.components.popup.display(options, err => {
				if (err) return console.log(err);
			});
		}

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
			var richContent = `
				<div class="user-container">
					${users
					.map(user => {
						return `
							<div class="user-item">
								<img alt="${user.displayName}" src=${buildfire.auth.getUserPictureUrl({ userId: user._id })} class="avatar" onerror="this.src=window._appRoot+'media/avatar.png'"/>
								<p class="ellipsis margin-bottom-zero">${user.displayName}</p>
							</div>
						`;
					})
					.join('')}
				</div>
				<style>
					.user-container{
						max-height: 60vh;
						overflow-y: auto; 
					}
					.user-item{
						display: flex;
						align-items: center;
						padding: 16px 0;
						font-size: 14px;
					}
					.avatar{
						border-radius: 50%;
						overflow: hidden;
						width: 24px;
						height: 24px;
						object-fit: cover;
						background-color: rgba(128, 128, 128, 0.1);
						flex-shrink: 0;
						margin-right: 12px;
					}
				</style>
			`;

			var options = { richContent };
			buildfire.components.popup.display(options, err => {
				if (err) return console.log(err);
			});
		});
	};

	$scope.upVote = function(suggestionObj) {
		getUser(function(user) {
			if(!user) enforceLogin()
			if (!suggestionObj.data.upVotedBy) suggestionObj.data.upVotedBy = {};
			if (!suggestionObj.data.upVoteCount) suggestionObj.data.upVoteCount = 1;

			if (!suggestionObj.data.upVotedBy[user._id]) {
				// vote
				Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: 1, _buildfire: { aggregationValue: 1 } });

				suggestionObj.data.upVoteCount++;
				suggestionObj.disableUpvote = true;
				suggestionObj.data.upVotedBy[user._id] = {
					votedOn: new Date(),
					user: user
				};

				if (suggestionObj.data.createdBy._id != user._id) {
					buildfire.notifications.pushNotification.schedule(
						{
							title: 'You got an upvote!',
							text: user.displayName + ' upvoted your suggestion ' + suggestionObj.data.title,
							users: [suggestionObj.data.createdBy._id]
						},
						function (err) {
							if (err) console.error(err);
						}
					);
				}
			} else {
				// unvote
				Analytics.trackAction(analyticKeys.VOTE_NUMBER.key, { votes: -1, _buildfire: { aggregationValue: -1 } });

				suggestionObj.data.upVoteCount--;
				suggestionObj.disableUpvote = false;
				delete suggestionObj.data.upVotedBy[user._id];
			}

			if (suggestionObj.data.upVoteCount < 10) {
				/// then just to a hard count just in case
				suggestionObj.data.upVoteCount = Object.keys(suggestionObj.data.upVotedBy).length;
			}

			buildfire.publicData.update(suggestionObj.id, suggestionObj.data, 'suggestion', function (err) {
				if (err) console.error(err);
			});
		});
	};
}
upvoteApp.filter('getUserImage', function () {
	return function (user) {
		var url = './avatar.png';
		if (user) {
			url = buildfire.auth.getUserPictureUrl({ userId: user._id });
			return url;
		}
		return url;
	};
});

upvoteApp.controller('suggestionBoxCtrl', ['$scope', '$sce', '$rootScope', suggestionBoxCtrl]);
function suggestionBoxCtrl($scope, $sce, $rootScope) {
	$scope.popupOn = false;
	$scope.text = $sce.trustAsHtml(config.text);

	window.openPopup = function() {
		if(_currentUser){
			$scope.popupOn = true;
			if (!$scope.$$phase) $scope.$apply();
		} else {
			enforceLogin();
		}
	};

	buildfire.datastore.get(function (err, obj) {
		if (obj) config = obj.data;
		$scope.text = $sce.trustAsHtml(config.text);
	});

	buildfire.datastore.onUpdate(function (obj) {
		if (obj) config = obj.data;
		$scope.text = $sce.trustAsHtml(config.text);
		if (!$scope.$$phase) $scope.$apply();
	});

	$scope.clearForm = function () {
		$scope.suggestionTitle = '';
		$scope.suggestionText = '';
		$scope.suggestionForm.$setUntouched();
		$scope.popupOn = false;
	};

	$scope.closeForm = function () {
		$scope.popupOn = false;
	};

	$scope.addSuggestion = function () {

		if ($scope.suggestionForm.$invalid) {
			$scope.suggestionForm.suggestionTitle.$setTouched();
			$scope.suggestionForm.suggestionText.$setTouched();
			return;
		}

		getUser(function (user) {
			_addSuggestion(user, $scope.suggestionTitle, $scope.suggestionText);
			$scope.popupOn = false;

			Analytics.trackAction(analyticKeys.SUGGESTIONS_NUMBER.key, { _buildfire: { aggregationValue: 1 } });
			buildfire.notifications.pushNotification.schedule(
				{
					title: 'New suggestion by ' + user.displayName,
					text: $scope.suggestionTitle,
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
			upVotedBy: {}
		};
		obj.upVotedBy[user._id] = {
			votedOn: new Date(),
			user: user
		};

		buildfire.publicData.insert(obj, 'suggestion', function (err, obj) {
			$rootScope.$broadcast('suggestionAdded', obj);
		});
	}
}
