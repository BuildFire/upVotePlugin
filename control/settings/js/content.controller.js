const contentController = {
  saveSettings(settings) {
    return new Promise((resolve, reject) => {
      Settings.save(settings).then(resolve).catch(reject);
    });
  },

  getSettings() {
    return new Promise((resolve) => {
      Settings.get().then((result) => {
        state.settings = result;
        resolve();
      }).catch((err) => { // don't blok the ui, just print the error and resolve
        console.error(err);
        resolve();
      });
    });
  },

  getInAppPurchaseProducts() {
    return new Promise((resolve, reject) => {
      buildfire.services.commerce.inAppPurchase.getProducts((err, products) => {
        if (err) return reject(err);
        resolve(products);
      });
    });
  }
}
