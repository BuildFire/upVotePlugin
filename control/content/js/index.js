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
      this.initWYSIWYG();
      document.body.classList.remove('hidden');
    }).catch((err) => {
      console.error(err);
    });
  },
};

window.onload = () => {
  contentPage.init();
};
