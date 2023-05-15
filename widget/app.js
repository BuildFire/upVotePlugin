"use strict";

(function (angular, buildfire, window) {
  angular
    .module("upvote", ["ngRoute", "ngAnimate"])
    .config([
      "$compileProvider",
      function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(
          /^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/
        );
      },
    ])

    .directive("viewSwitcher", [
      "ViewStack",
      "$rootScope",
      "$compile",
      function (ViewStack, $rootScope, $compile) {
        return {
          restrict: "AE",
          link: function (scope, elem, attrs) {
            var views = 0,
              currentView = null;
            manageDisplay();
            $rootScope.$on(
              "VIEW_CHANGED",
              function (e, type, view, noAnimation) {
                if (type === "PUSH") {
                  currentView = ViewStack.getPreviousView();
                  var _el = $("<a/>").attr("href", "javascript:void(0)"),
                    oldTemplate = $("#" + currentView.template);
                  oldTemplate.append(_el);

                  oldTemplate
                    .find(
                      "input[type=number], input[type=password], input[type=text]"
                    )
                    .each(function () {
                      $(this).blur().attr("disabled", "disabled");
                    });

                  $(document.activeElement).blur();
                  _el.focus();

                  var newScope = $rootScope.$new();

                  var _newView =
                    '<div  id="' +
                    view.template +
                    '" ><div class="slide content" ng-include="\'Item_details.html\'"></div></div>';

                  var parTpl = $compile(_newView)(newScope);

                  $(elem).append(parTpl);
                  views++;
                } else if (type === "POP") {
                  var _elToRemove = $(elem).find("#" + view.template),
                    _child = _elToRemove.children("div").eq(0);

                  _child.addClass("ng-leave ng-leave-active");
                  _child.one(
                    "webkitTransitionEnd transitionend oTransitionEnd",
                    function (e) {
                      _elToRemove.remove();
                      views--;
                    }
                  );

                  currentView = ViewStack.getCurrentView();
                  $("#" + currentView.template)
                    .find(
                      "input[type=number], input[type=password], input[type=text]"
                    )
                    .each(function () {
                      $(this).removeAttr("disabled");
                    });
                } else if (type === "POPALL") {
                  angular.forEach(view, function (value, key) {
                    var _elToRemove = $(elem).find("#" + value.template),
                      _child = _elToRemove.children("div").eq(0);

                    if (!noAnimation) {
                      _child.addClass("ng-leave ng-leave-active");
                      _child.one(
                        "webkitTransitionEnd transitionend oTransitionEnd",
                        function (e) {
                          _elToRemove.remove();
                          views--;
                        }
                      );
                    } else {
                      _elToRemove.remove();
                      views--;
                    }
                  });
                }
                manageDisplay();
              }
            );

            function manageDisplay() {
              if (views) {
                $(elem).removeClass("ng-hide");
              } else {
                $(elem).addClass("ng-hide");
              }
            }
          },
        };
      },
    ])
    .directive("getFocus", [
      "$timeout",
      function ($timeout) {
        return {
          link: function (scope, element, attrs) {
            $(element)
              .parents(".slide")
              .eq(0)
              .on(
                "webkitTransitionEnd transitionend oTransitionEnd",
                function () {
                  $timeout(function () {
                    $(element).focus();
                  }, 300);
                  //open keyboard manually
                  if (
                    window.cordova &&
                    window.cordova.plugins &&
                    window.cordova.plugins.Keyboard
                  ) {
                    window.cordova.plugins.Keyboard.show();
                  }

                  $(element).on("blur", function () {
                    //open keyboard manually
                    if (
                      window.cordova &&
                      window.cordova.plugins &&
                      window.cordova.plugins.Keyboard
                    ) {
                      window.cordova.plugins.Keyboard.hide();
                    }
                  });
                }
              );

            scope.$on("$destroy", function () {
              $(element)
                .parents(".slide")
                .eq(0)
                .off("webkitTransitionEnd transitionend oTransitionEnd", "**");
            });
          },
        };
      },
    ])
    .run([
      "Location",
      "$location",
      "$rootScope",
      "ViewStack",
      function (Location, $location, $rootScope, ViewStack) {
        buildfire.history.onPop(function (err, data) {
          if (ViewStack.hasViews()) {
            if (ViewStack.getCurrentView().template == "Item_Details") {
              buildfire.messaging.sendMessageToControl({
                type: "BackToHome",
              });
            }
            ViewStack.pop();
          }
        });
      },
    ]);
})(window.angular, window.buildfire, window);
