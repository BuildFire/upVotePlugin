class PushNotification {
  static sendToAll = (title, message) => {
    const notification = {
      title: title,
      text: message,
      at: new Date(),
      sendToSelf: false,
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      function (err, data) {
        if (err) return;
      }
    );
  };

  static sendToCustomUsers = (title, message, users) => {
    const notification = {
      title: title,
      text: message,
      at: new Date(),
      sendToSelf: false,
      users: users,
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      function (err, data) {
        if (err) return;
      }
    );
  };

  static sendToUserSegment = (title, message, userTags) => {
    const notification = {
      title: title,
      text: message,
      at: new Date(),
      userTags: [userTags],
      sendToSelf: false,
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      function (err, data) {
        if (err) return;
      }
    );
  };
}
