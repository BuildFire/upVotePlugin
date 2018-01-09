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
                }
            });
        }
        else {
            _currentUser = user;
            callback(user);
        }
    });
}

var config = {};
upvoteApp.controller('listCtrl', ['$scope', function ($scope) {
    $scope.suggestions = [];


    $scope.$on('suggestionAdded', function(e,obj){
        $scope.suggestions.unshift(obj);
        if(!$scope.$$phase)
        $scope.$apply();
    });


    buildfire.publicData.search({sort: {"upVoteCount": -1}}, "suggestion", function (err, results) {

        $scope.suggestions = results;
        $scope.hasSocial = config.socialPlugin?true:false;
        if(!$scope.$$phase)$scope.$apply();
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

    $scope.upVote = function (suggestionObj) {

        getUser(function (user) {

            if (!suggestionObj.data.upVotedBy) suggestionObj.data.upVotedBy = {};
            if (!suggestionObj.data.upVoteCount) suggestionObj.data.upVoteCount = 1;

            if (!suggestionObj.data.upVotedBy[user._id]) {
                suggestionObj.data.upVoteCount++;
                suggestionObj.data.upVotedBy[user._id] = new Date();
                buildfire.publicData.update(suggestionObj.id, suggestionObj.data, "suggestion", function (err) {
                    if (err) {
                        console.error(err);
                    }
                    else
                        $scope.$apply();
                });
            }
        });
    };
}]);

upvoteApp.controller('suggestionBoxCtrl', ['$scope','$rootScope', function ($scope,$rootScope) {
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
            $scope.suggestionTitle = $scope.suggestionText = '';
            if(!$scope.$$phase) $scope.$apply();

        });
    };

    function _addSuggestion(user, title, text) {
        if (!user || !title || !text)return;

        var obj = {
            title: title
            , suggestion: text
            , createdBy: user
            , createdOn: new Date()
            , upVoteCount: 1
            , upVotedBy: {}
        };
        obj.upVotedBy[user._id] = new Date();

        buildfire.publicData.insert(obj, "suggestion", function (err,obj) {
            $rootScope.$broadcast('suggestionAdded',obj);
        });


    }


}]);