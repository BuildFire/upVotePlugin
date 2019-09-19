/**
 * Created by danielhindi on 8/31/17.
 */

var upvoteApp = angular.module('upvote', []);

var _currentUser = null;

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
            debugger;
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
        $scope.suggestions.unshift(obj);
        if (!$scope.$$phase)
            $scope.$apply();
    });

    buildfire.publicData.search({ sort: { "upVoteCount": -1 } }, "suggestion", function (err, results) {


        if (!_currentUser)
            $scope.suggestions = results;
        else
            $scope.suggestions = results.map(function (s) {
                s.disableUpvote = !s
                    || !s.data.upVotedBy
                    || s.data.upVotedBy[_currentUser._id];
                return s;
            });

        $scope.hasSocial = config.socialPlugin ? true : false;
        if (!$scope.$$phase) $scope.$apply();
    });

    $scope.goSocial = function (s) {

        buildfire.navigation.navigateTo({
            pluginId: config.socialPlugin.pluginTypeId
            , instanceId: config.socialPlugin.instanceId
            , folderName: config.socialPlugin.folderName
            , title: s.data.title
            , queryString: "wid=" + s.data.createdBy.userToken + "-" + s.data.createdOn + "&wTitle=" + s.data.title
        });
    };

    $scope.expandVotes = function (s) {
        s.voteDetails = [];

        for (p in s.data.upVotedBy)
            s.voters = [s.data.upVotedBy[p].user];



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
            }

            if (suggestionObj.data.upVoteCount < 10) /// then just to a hard count just in case
                suggestionObj.data.upVoteCount = Object.keys(suggestionObj.data.upVotedBy).length;


            buildfire.publicData.update(suggestionObj.id, suggestionObj.data, "suggestion", function (err) {
                if (err)
                    console.error(err);
            });

        });
    };
}]);

upvoteApp.controller('suggestionBoxCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.popupOn = false;
    $scope.text = config.text;

    buildfire.datastore.get(function (err, obj) {
        if (obj)
            config = obj.data;
        $scope.text = config.text;
    });

    $scope.addSuggestion = function () {
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

            $scope.suggestionTitle = $scope.suggestionText = '';
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
        obj.upVotedBy[user._id] = new Date();

        buildfire.publicData.insert(obj, "suggestion", function (err, obj) {
            $rootScope.$broadcast('suggestionAdded', obj);
        });


    }


}]);