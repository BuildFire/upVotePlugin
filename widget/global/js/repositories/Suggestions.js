class Suggestions {
	static get TAG() {
		return 'suggestion';
	}

  static search(options) {
    return new Promise((resolve, reject) => {
      buildfire.publicData.search(options, Suggestions.TAG, (e, results) => {
        if (e) {
          reject(e);
        } else {
          let suggestions = results.map(result => new Suggestion({...result.data, id: result.id}))
          resolve(suggestions);
        }
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      buildfire.publicData.getById(
        id,
        Suggestions.TAG,
        (err, result) => {

          if (err) reject(err);
          resolve(new Suggestion({...result.data, id: result.id}) )
        }
      );
    });
  }


  static insert(suggestion, callback) {
    return new Promise((resolve, reject) => {
      buildfire.publicData.insert(suggestion, Suggestions.TAG, (e, r) => {
        if (e) {
          reject(e);
          if (callback) callback(e);
        } else {
          resolve(r);
          if (callback) callback(null, r);
        }
      });
    });
  }

  static update(suggestionId, payload) {
    return new Promise((resolve, reject) => {
        buildfire.publicData.update(suggestionId, payload, Suggestions.TAG, (e, r) => {
          if (e) {
            reject(e);
          } else {
            resolve(r);
          }
        });
      });
  }

  static searchAndUpdate(id, payload){
    return new Promise((resolve, reject) => {
      buildfire.publicData.searchAndUpdate({"id": id}, payload, Suggestions.TAG, (e, r) => {
        if (e) {
          reject(e);
        } else {
          resolve(r);
        }
      });
    });
  }

  static delete(id){
    return new Promise((resolve, reject) => {
      buildfire.publicData.delete(id, Suggestions.TAG, (e, r) => {
        if (e) {
          reject(e);
        }else{
          resolve(r);
        }
      });
    });
  }

}
