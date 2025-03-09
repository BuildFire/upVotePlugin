class UserCredits {
  static get TAG() {
    return 'credits';
  }

  static get(userId) {
    return new Promise((resolve, reject) => {
      buildfire.appData.search(
        {
          filter: {
            '$json._buildfire.index.string1': userId,
          },
        },
        this.TAG,
        (err, results) => {
          if (err) return reject(err);

          if (!results || !results.length) {
            const data = new UserCredit({
              userId,
            }).toJSON();
            this.insert(data).then((res) => {
              res.data.id = res.id;
              resolve(new UserCredit(res.data).toJSON());
            });
          } else {
            results[0].data.id = results[0].id;
            resolve(new UserCredit(results[0].data).toJSON());
          }
        },
      );
    });
  }

  static insert(data) {
    return new Promise((resolve, reject) => {
      buildfire.appData.insert(data, this.TAG, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  static update(userId, data) {
    return new Promise((resolve, reject) => {
      buildfire.appData.searchAndUpdate({ '_buildfire.index.string1': userId }, data, this.TAG, (err, result) => {
        if (err) return reject(err);
        resolve(new UserCredit(result.data));
      });
    });
  }
}
