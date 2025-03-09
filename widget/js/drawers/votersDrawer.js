const votersDrawer = {
  appTheme: buildfire.getContext().appTheme,

  prepareOptions() {
    const listItems = [];
    for (const userRecord in this.activeSuggestion.upVotedBy) {
      const user = this.activeSuggestion.upVotedBy[userRecord].user;
      const userImage = buildfire.auth.getUserPictureUrl({ userId: user._id });
      const croppedUserImage = buildfire.imageLib.cropImage(userImage, { size: 'm', aspect: '1:1' });

      listItems.push({
        text: widgetUtils.getUserName(user),
        imageUrl: croppedUserImage,
        userId: user._id,
      });
    }

    return listItems;
  },

  init(suggestion, callback) {
    widgetController.getSuggestionById(suggestion.id).then((updatedSuggestion) => {
      this.activeSuggestion = updatedSuggestion;
      const listItems = this.prepareOptions();

      buildfire.components.drawer.open(
        {
          multiSelection: false,
          allowSelectAll: false,
          content: `<div style="color:${this.appTheme.colors.headerText};font-weight: bold;">${state.strings['mainScreen.upvotes']}</div>`,
          isHTML: true,
          triggerCallbackOnUIDismiss: false,
          listItems,
        },
        (err, result) => {
          callback(err, result);
        },
      );
    });
  },
};
