'use strict';

(function (angular, window) {
  angular
    .module('upvote')
    .controller('WidgetItemCtrl', ['$scope', 'ViewStack', '$rootScope', '$sce',
      function ($scope, ViewStack, $rootScope, $sce) {
        var WidgetItem = this;
        WidgetItem.listeners = {}
        $scope.selectedSuggestion = ViewStack.getCurrentView().item
      
        
      }
    ]
    )
})(window.angular, window);
