const onPopHandler = (breadcrumb) => {
  suggestionDetailsPage.destroy();
};

const hasPermission = (permissionType) => {
  let userPermitted = false;
  if (state.settings.permissions[permissionType].value === ENUMS.USERS_PERMISSIONS.ALL_USERS) {
    userPermitted = true;
  } else if (state.settings.permissions[permissionType].value === ENUMS.USERS_PERMISSIONS.NO_USERS) {
    userPermitted = false;
  } else {
    const appId = buildfire.getContext().appId;
    if (authManager.currentUser && authManager.currentUser.tags && authManager.currentUser.tags[appId]) {
      const userTags = authManager.currentUser.tags[appId];
      const permissionTags = state.settings.permissions[permissionType].tags;

      for (let i = 0; i < permissionTags.length; i++) {
        if (userTags.some((_tag) => (_tag.tagName === permissionTags[i].tagName || _tag.tagName === permissionTags[i].value))) {
          userPermitted = true;
          break;
        }
      }
    }
  }

  return userPermitted;
};

const init = () => {
  homePage.initSkeleton();
  handleCPSync();

  buildfire.notifications.pushNotification.subscribe({}, (err) => {
    if (err) console.error(err);
  });

  const promises = [
    widgetController.getSettings(),
    authManager.getCurrentUser(),
    initLanguageStrings(),
  ];
  Promise.all(promises).then(() => {
    buildfire.deeplink.onUpdate((deeplinkData) => {
      if (deeplinkData && deeplinkData.split('=')[1]) {
        const id = deeplinkData.split('=')[1];
        suggestionDetailsPage.init({ id });
      }
    });

    const suggestionIdToNavigate = widgetUtils.getSuggestionIdOnNewNotification();
    if (suggestionIdToNavigate) {
      suggestionDetailsPage.init({ id: suggestionIdToNavigate });
    } else {
      homePage.init();
    }

    buildfire.history.onPop(onPopHandler);
  }).catch((err) => {
    console.error(err);
  });
};

window.onload = () => {
  init();
};
