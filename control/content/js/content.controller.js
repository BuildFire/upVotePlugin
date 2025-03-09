const contentController = {
  saveSettings(settings) {
    return new Promise((resolve, reject) => {
      Settings.save(settings).then(resolve).catch(reject);
    });
  },

  getSettings() {
    return new Promise((resolve) => {
      Settings.get().then((result) => {
        if (!result || !Object.keys(result).length) {
          Analytics.init(); // init analytics only for the first time of installing the plugin
          Settings.save(new Setting({ navigateToCwByDefault: true })).then((settings) => {
            state.settings = new Setting();
            resolve();
          }).catch((err) => { // don't blok the ui, just print the error and resolve
            console.error(err);
            resolve();
          });
        } else if (result.hasOwnProperty('selectedPurchaseProductId') && result.hasOwnProperty('votesCountPerPurchase')) {
          Settings.unifyOldSettingsData().then((unifiedSettings) => {
            Settings.save(new Setting(unifiedSettings)).then(() => {
              state.settings = unifiedSettings;
              resolve();
            }).catch((err) => { // don't blok the ui, just print the error and resolve
              console.error(err);
              resolve();
            });
          }).catch((err) => { // don't blok the ui, just print the error and resolve
            console.error(err);
            resolve();
          });
        } else {
          state.settings = new Setting(result);
          resolve();
        }
      }).catch((err) => { // don't blok the ui, just print the error and resolve
        console.error(err);
        resolve();
      });
    });
  },

};
