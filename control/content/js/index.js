const contentPage = {
  saveTimer: null,
  saveWithDelay() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      contentController.saveSettings(state.settings);

      buildfire.messaging.sendMessageToWidget({
        scope: 'introduction',
        introduction: state.settings.introduction,
      });
    }, 500);
  },

  initWYSIWYG() {
    tinymce.init({
      selector: '#introduction',
      setup(editor) {
        editor.on('init', () => {
          tinymce.activeEditor.setContent(state.settings.introduction);
        });
        editor.on('keyup change', () => {
          state.settings.introduction = tinymce.activeEditor.getContent();
          contentPage.saveWithDelay();
        });
      },
    });
  },

  init() {
    contentController.getSettings().then(() => {
      // TODO: analytics shouldn't be registered every time
      // TODO: add code unification and migration from old data
      // TODO: html body should be hidden and show it after initialization
      this.initWYSIWYG();
    }).catch((err) => {
      console.error(err);
    });
  },
};

window.onload = () => {
  contentPage.init();
};
