/**
 * Created by danielhindi on 8/31/17.
 */

var upvoteApp = angular.module('upvote', []);

var _currentUser = null;

buildfire.appearance.titlebar.show();

buildfire.auth.onLogin(function (user) {
    _currentUser = user;
});

buildfire.auth.onLogout(function () {
    _currentUser = null;
});

function getUser(callback) {
    if (_currentUser) {
        callback(_currentUser);
        return;
    }
    buildfire.auth.getCurrentUser(function (err, user) {
        if (err) {
            console.error(err);
        }
        else if (!user) {
            buildfire.auth.login({}, function (err, user) {
                if (err)
                    console.error(err);
                else {
                    _currentUser = user;
                    callback(user);
                    buildfire.notifications.pushNotification.subscribe({ groupName: "suggestions" });
                }
            });
        }
        else {
            _currentUser = user;
            callback(user);
            buildfire.notifications.pushNotification.subscribe({ groupName: "suggestions" });
        }
    });
}
getUser(function () { });

var config = {};
upvoteApp.controller('listCtrl', ['$scope', function ($scope) {
    $scope.suggestions = [];

    $scope.$on('suggestionAdded', function (e, obj) {
        obj.voters = [];
        obj.disableUpvote = true;
        $scope.suggestions.unshift(obj);
        if (!$scope.$$phase)
            $scope.$apply();
    });

    // added pluginInstance search to find out if social wall is available
    var social = function () {
        buildfire.pluginInstance.search({}, function (err, instances) {
            if (err) {
                console.error(err.message);
            } else {
                if (!instances || !instances.result || !instances.result.length) {
                    return;
                }
                for (var i = 0, j = instances.result.length; i < j; i++) {
                    if (instances.result[i].data._buildfire.pluginType.result[0].name.toLowerCase().indexOf("social") >= 1) {
                        config.socialPlugin = instances.result[i].data._buildfire.pluginType.result[0];
                        break;
                    }
                }
            }
            $scope.hasSocial = config.socialPlugin ? true : false;
            if (!$scope.$$phase) $scope.$apply();
        })
    };

    buildfire.publicData.search({ sort: { "upVoteCount": -1 } }, "suggestion", function (err, results) {
        social();

        if (!_currentUser)
            $scope.suggestions = results;
        else
            $scope.suggestions = results.map(function (s) {
                var creationYear = new Date(s.data.createdOn).getFullYear();
                var currentYear = new Date().getFullYear();

                s.isCurrentYear = creationYear === currentYear;
                s.disableUpvote = !s
                    || !s.data.upVotedBy
                    || s.data.upVotedBy[_currentUser._id];
                return s;
            });

        if (!$scope.$$phase) $scope.$apply();
    });

    $scope.goSocial = function (s) {
        buildfire.navigation.navigateToSocialWall({ // changed navigateTo, to navigateToSocialWall (see official docs)
            title: s.data.title
            , queryString: "wid=" + s.data.createdBy.userToken + "-" + s.data.createdOn + "&wTitle=" + s.data.title
        });
    };

    $scope.toggleVotes = function (s) {
        s.voteDetails = [];
        s.voters = [];

        if (s.isExpanded) {
            s.isExpanded = false;
            if (!$scope.$$phase) $scope.$apply();
            return;
        };

        s.isExpanded = true;
        // s.voters.push(s.data.createdBy);
        for (var p in s.data.upVotedBy) {
            // if(p != s.data.createdBy._id)
            s.voters.push(s.data.upVotedBy[p].user);
        }

        if (!$scope.$$phase) $scope.$apply();
    };

    $scope.upVote = function (suggestionObj) {

        getUser(function (user) {

            if (!suggestionObj.data.upVotedBy) suggestionObj.data.upVotedBy = {};
            if (!suggestionObj.data.upVoteCount) suggestionObj.data.upVoteCount = 1;

            if (!suggestionObj.data.upVotedBy[user._id]) {
                suggestionObj.data.upVoteCount++;
                suggestionObj.disableUpvote = true;
                suggestionObj.data.upVotedBy[user._id] = {
                    votedOn: new Date()
                    , user: user
                };
                if (suggestionObj.isExpanded) {
                    suggestionObj.voters.push(user);
                }

                if (suggestionObj.data.createdBy._id != user._id) {
                    buildfire.notifications.pushNotification.schedule({
                        title: "You got an upvote !!!"
                        , text: user.displayName + " upvoted your suggestion " + suggestionObj.data.title
                        //,at: new Date()
                        , users: [suggestionObj.data.createdBy._id]
                    }, function (err) {
                        if (err) console.error(err);
                    });
                }


            }
            else { // unvote
                suggestionObj.data.upVoteCount--;
                suggestionObj.disableUpvote = false;
                delete suggestionObj.data.upVotedBy[user._id];
                suggestionObj.voters = (suggestionObj.voters || []).filter(function (voter) {
                    return voter._id != user._id;
                });
            }

            if (suggestionObj.data.upVoteCount < 10) /// then just to a hard count just in case
                suggestionObj.data.upVoteCount = Object.keys(suggestionObj.data.upVotedBy).length;


            buildfire.publicData.update(suggestionObj.id, suggestionObj.data, "suggestion", function (err) {
                if (err)
                    console.error(err);
            });

        });
    };
}])
.filter('getUserImage', function () {
    return function (user) {
        var url = './avatar.png';
        if (user) {
            url = buildfire.auth.getUserPictureUrl(user);
            return url;
        }
        return url;
    }
});

upvoteApp.controller('suggestionBoxCtrl', ['$scope', '$sce', '$rootScope', function ($scope, $sce, $rootScope) {
    $scope.popupOn = false;
    $scope.text = $sce.trustAsHtml(config.text);

    window.openPopup = function () {
        $scope.popupOn = true;
        if (!$scope.$$phase) $scope.$apply();
    }

    buildfire.datastore.get(function (err, obj) {
        if (obj)
            config = obj.data;
        $scope.text = $sce.trustAsHtml(config.text);
    });

    buildfire.datastore.onUpdate(function (obj) {
        if (obj)
            config = obj.data;
        $scope.text = $sce.trustAsHtml(config.text);
        if (!$scope.$$phase) $scope.$apply();
    });

    $scope.clearForm = function () {
        $scope.suggestionTitle = "";
        $scope.suggestionText = "";
        $scope.suggestionForm.$setUntouched();
        $scope.popupOn = false;
    };

    $scope.closeForm = function () {
        $scope.popupOn = false;
    }

    $scope.addSuggestion = function () {

        if ($scope.suggestionForm.$invalid) {
            $scope.suggestionForm.suggestionTitle.$setTouched();
            $scope.suggestionForm.suggestionText.$setTouched();
            return;
        }

        getUser(function (user) {
            _addSuggestion(user, $scope.suggestionTitle, $scope.suggestionText);
            $scope.popupOn = false;

            buildfire.notifications.pushNotification.schedule({
                title: "New suggestion by " + user.displayName
                , text: $scope.suggestionTitle
                //,at: new Date()
                , groupName: "suggestions"
            }, function (err) {
                if (err) console.error(err);
            });

            $scope.clearForm();
            if (!$scope.$$phase) $scope.$apply();

        });
    };

    function _addSuggestion(user, title, text) {
        if (!user || !title || !text) return;

        var obj = {
            title: title
            , suggestion: text
            , createdBy: user
            , createdOn: new Date()
            , upVoteCount: 1
            , upVotedBy: {}
        };
        obj.upVotedBy[user._id] = {
            votedOn: new Date(),
            user: user
        };

        buildfire.publicData.insert(obj, "suggestion", function (err, obj) {
            $rootScope.$broadcast('suggestionAdded', obj);
        });
    }
}]);