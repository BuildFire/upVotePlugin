const updateStatusDrawer = {
  appTheme: buildfire.getContext().appTheme,

  renderStatusItem(status) {
    const element = `
      <span style="margin: 0px;font-weight: 400;color: ${this.appTheme.colors.headerText};display: flex;align-items: center;gap: 10px;">
        <span style="
        display: inline-block;
        width: 25px;
        aspect-ratio: 1;
        margin: 0;
        background: ${status.statusBackgroundColor};
        border-radius: 100%;"></span>${status.statusText}</span>`;

    return element;
  },

  prepareOptions() {
    const listItems = [];
    const availableStatuses = [
      {
        statusText: state.strings['mainScreen.backlog'],
        statusBackgroundColor: 'rgba(150, 150, 150, 0.1)',
      },
      {
        statusText: state.strings['mainScreen.inProgress'],
        statusBackgroundColor: this.appTheme.colors.warningTheme,
      },
      {
        statusText: state.strings['mainScreen.completed'],
        statusBackgroundColor: this.appTheme.colors.successTheme,
      },
    ];
    for (let i = 1; i <= availableStatuses.length; i++) {
      listItems.push({
        id: i,
        text: this.renderStatusItem(availableStatuses[i - 1]),
        selected: this.activeSuggestion.status === i,
      });
    }

    return listItems;
  },

  init(suggestion, callback) {
    Suggestions.getById(suggestion.id).then((updatedSuggestion) => {
      this.activeSuggestion = updatedSuggestion;
      const listItems = this.prepareOptions();

      buildfire.components.drawer.open(
        {
          multiSelection: false,
          allowSelectAll: false,
          content: `<div style="color:${this.appTheme.colors.headerText};font-weight: bold;">${state.strings['mainScreen.updateStatus']}</div>`,
          isHTML: true,
          triggerCallbackOnUIDismiss: false,
          listItems,
        },
        (err, result) => {
          buildfire.components.drawer.closeDrawer();
          callback(err, result);
        },
      );
    });
  },
};
