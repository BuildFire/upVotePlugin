'use strict';

(function (angular, window) {
  angular
    .module('upvote')
    .controller('WidgetItemCtrl', ['$scope', 'ViewStack', '$rootScope', '$sce',
      function ($scope, ViewStack, $rootScope, $sce) {
        var WidgetItem = this;
        WidgetItem.listeners = {}
        $scope.selectedSuggestion = ViewStack.getCurrentView().item
        $scope.selectedSuggestion.imageInProgress = true;

        const ownerImage = buildfire.auth.getUserPictureUrl({ userId: $scope.selectedSuggestion.createdBy._id });

        validateImage(ownerImage).then((isValid) => {
            if (!$scope.selectedSuggestion) return;
            if (isValid) {
                $scope.selectedSuggestion.imgUrl = buildfire.imageLib.cropImage(ownerImage, { size: 'm', aspect: '1:1' });
            }
            $scope.selectedSuggestion.imageInProgress = false;
            if (!$scope.$$phase) $scope.$apply();
        });


      }


    ]
    )
})(window.angular, window);
