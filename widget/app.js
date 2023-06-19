"use strict";

(function (angular, buildfire, window) {
  angular
    .module("upvote", [])
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
                    '" ><div class="slide content" ng-include="\'templates/' + view.template + '.html\'"></div></div>';

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
    .run([
      "ViewStack","$rootScope",
      function (ViewStack, $rootScope) {
        buildfire.messaging.onReceivedMessage = function (msg) {
          switch (msg.type) {
            case 'UpdateSettings':
              $rootScope.$broadcast("SETTINGS_UPDATED", msg.data);
              if (!$rootScope.$$phase) $rootScope.$apply();
              break;
            }
        }
        buildfire.history.onPop(function (err, data) {
          if (ViewStack.hasViews()) {
            ViewStack.pop();
          }
        });
      },
    ]);
})(window.angular, window.buildfire, window);
