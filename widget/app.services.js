'use strict';

(function (angular, buildfire) {
  angular.module('upvote')
    .factory('ViewStack', ['$rootScope', function ($rootScope) {
      var views = [];
      var viewMap = {};
      return {
        push: function (view) {
          if (viewMap[view.template]) {
            this.pop();
          } else {
            viewMap[view.template] = 1;
            views.push(view);
            $rootScope.$broadcast('VIEW_CHANGED', 'PUSH', view);
          }
          return view;
        },
        pop: function () {
          $rootScope.$broadcast('BEFORE_POP', views[views.length - 1]);
          var view = views.pop();
          delete viewMap[view.template];
          $rootScope.$broadcast('VIEW_CHANGED', 'POP', view);

          return view;
        },
        hasViews: function () {
          return !!views.length;
        },
        getPreviousView: function() {
          return views.length && views[views.length - 2] || {};
        },
        getCurrentView: function () {
          return views.length && views[views.length - 1] || {};
        },
        popAllViews: function (noAnimation) {
          $rootScope.$broadcast('BEFORE_POP', null);
          $rootScope.$broadcast('VIEW_CHANGED', 'POPALL', views, noAnimation);
          views = [];
          viewMap = {};
        }
      };
    }])
    .filter('getUserImage', function () {
      return function (user) {
        var url = './assets/images/avatar.png';
        if (user) {
          url = buildfire.auth.getUserPictureUrl({ userId: user._id });
          url = buildfire.imageLib.cropImage(url,{ size: "xs", aspect: "1:1" });
          return url;
        }
        return url;
      };
    })
})(window.angular, window.buildfire);