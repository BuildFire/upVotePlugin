class Settings {
  static get TAG() {
    return 'settings';
  }

  static get() {
    return new Promise((resolve, reject) => {
      buildfire.datastore.get(this.TAG, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.data)
        }
      });
    })
  }

  static save(settings) {
    return new Promise((resolve, reject) => {
      buildfire.datastore.save(new Setting(settings), this.TAG, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    })
  }
}
