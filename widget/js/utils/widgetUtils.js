const widgetUtils = {
  appTheme: buildfire.getContext().appTheme,

  getUserName(userObj) {
    if (userObj) {
      if (userObj.displayName) {
        return userObj.displayName;
      } else if ((userObj.firstName || userObj.lastName) && (userObj.firstName.trim() !== '' || userObj.lastName.trim() !== '')) {
        return (
          (userObj.firstName ? userObj.firstName : '') +
          ' ' +
          (userObj.lastName ? userObj.lastName : '')
        );
      } else {
        return state.strings['mainScreen.unknownUser'] || 'Someone';
      }
    }
  },
  getUserNeededAuthData(userObj) {
    if (userObj) {
      return {
        userId: userObj.userId,
        _id: userObj._id,
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        displayName: userObj.displayName,
        username: userObj.username,
      }
    }
  },
  prepareDeeplinkQueryStringData(obj) {
    return `&dld=${encodeURIComponent(JSON.stringify(obj))}`;
  },
  formatDate(date) {
    // return date in format MMM dd, yyyy
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  },
  getSuggestionStatusData(suggestion) {
    const suggestionStatus = {};
    switch (suggestion.status) {
      case 3:
        suggestionStatus.statusText = state.strings['mainScreen.completed'];
        suggestionStatus.statusContainerClass = 'successBackgroundTheme';
        break;
      case 2:
        suggestionStatus.statusText = state.strings['mainScreen.inProgress'];
        suggestionStatus.statusContainerClass = 'warningBackgroundTheme';
        break;
      case 1:
      default:
        suggestionStatus.statusText = state.strings['mainScreen.backlog'];
        suggestionStatus.statusContainerClass = 'defaultBackgroundStatus';
        break;
    }
    return suggestionStatus;
  },
  buildHeaderContentHtml(title, description) {
    const div = document.createElement("div")
    const titleParagraph = document.createElement("p")
    titleParagraph.style.color = this.appTheme.colors.bodyText;
    titleParagraph.style.fontSize = "16px"
    titleParagraph.style.fontWeight = 500;
    titleParagraph.innerHTML = title;

    const descriptionParagraph = document.createElement("p")
    descriptionParagraph.style.color = this.appTheme.colors.bodyText;
    descriptionParagraph.style.fontWeight = 400;
    descriptionParagraph.style.fontSize = "14px"

    descriptionParagraph.innerHTML = description;

    div.appendChild(titleParagraph)
    div.appendChild(descriptionParagraph)

    return div.innerHTML;
  },

  setDynamicExpressionContext(expressionContext) {
    buildfire.dynamic.expressions.getContext = (options, callback) => {
      const context = {
        plugin: expressionContext,
      };
      callback(null, context);
    };
  },

  getSuggestionIdOnNewNotification() {
    const getParamsRegex = /\?(.+)/;
    let suggestionId = '';
    if (getParamsRegex.test(location.href)) {
      const params = getParamsRegex.exec(location.href)[1].split('&');
      params.forEach((param) => {
        const keyValue = param.split('=');
        if (keyValue[0] === 'id') {
          suggestionId = keyValue[1];
        }
      });
    }
    return suggestionId;
  },

  encryptCredit(credit, key) {
    if (typeof credit !== 'string') credit = `${credit}`;

    let encryptedCredit = '';
    for (let i = 0; i < credit.length; i++) {
      const charCode = credit.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encryptedCredit += String.fromCharCode(charCode);
    }
    return btoa(encryptedCredit);
  },

  decryptCredit(encryptedCredit, key) {
    encryptedCredit = atob(encryptedCredit);
    let decryptedCredit = '';
    for (let i = 0; i < encryptedCredit.length; i++) {
      const charCode =
        encryptedCredit.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decryptedCredit += String.fromCharCode(charCode);
    }
    return decryptedCredit;
  }
}
