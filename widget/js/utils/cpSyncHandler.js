const handleCPSync = () => {
  buildfire.messaging.onReceivedMessage = (message) => {
    if (message.scope === 'introduction') {
      state.settings.introduction = message.introduction;
      document.getElementById('wysiwygContainer').innerHTML = state.settings.introduction;
    } else if (message.scope === 'directoryOptions') {
      state.settings = {
        ...state.settings,
        ...message.directoryOptions,
      }
    } else if (message.scope === 'permissions') {
      state.settings.permissions = message.permissions;

      homePage.initSuggestionsFab();
    } else {
      window.location.reload();
    }
  };
};
