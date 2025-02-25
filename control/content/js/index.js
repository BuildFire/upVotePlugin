const contentPage = {
  saveTimer: null,
  saveWithDelay() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      contentController.saveSettings(state.settings);
    }, 500);
  },

  initWYSIWYG() {
    tinymce.init({
      selector: "#introduction",
      setup: function (editor) {
        editor.on("init", () => {
          tinymce.activeEditor.setContent(state.settings.introduction);
        });
        editor.on("keyup change", () => {
          state.settings.introduction = tinymce.activeEditor.getContent();
          contentPage.saveWithDelay();
        });
      }
    });
  },

  init() {
    contentController.getSettings().then(() => {
      Analytics.init();
      this.initWYSIWYG();
    }).catch((err) => {
      console.error(err);
    });
  },
}

window.onload = () => {
  contentPage.init();
}
