const getLanguage = (key) => {
  return new Promise((resolve, reject) => {
    buildfire.language.get({ stringKey: key }, (err, res) => {
      if (err) {
        reject(err);
      }
      state.strings[key] = res;
      resolve(res);
    });
  });
};

const initLanguageStrings = () => {
  return new Promise((resolve, reject) => {
    const arr = Object.keys(state.strings).map((el) => getLanguage(el));
    Promise.all(arr)
      .then((values) => resolve(values))
      .catch((error) => reject(error));
  });
};
