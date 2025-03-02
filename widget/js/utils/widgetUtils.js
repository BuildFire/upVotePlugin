const widgetUtils = {
  appTheme: buildfire.getContext().appTheme,

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
}
