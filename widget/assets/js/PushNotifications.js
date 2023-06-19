class PushNotification {
  static sendToAll(title, message, id) {
    const notification = {
      title: title,
      text: message,
      at: new Date(),
      sendToSelf: false,
      queryString: `id=${id}`
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      function (err, data) {
        if (err) return;
      }
    );
  };

  static sendToCustomUsers(title, message, id, users) {
    const notification = {
      title: title,
      text: message,
      at: new Date(),
      sendToSelf: false,
      users: users,
      queryString: `id=${id}`
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      function (err, data) {
        if (err) return;
      }
    );
  };

  static sendToUserSegment(title, message, id, userTags) {
    const notification = {
      title: title,
      text: message,
      at: new Date(),
      userTags: userTags,
      sendToSelf: false,
      queryString: `id=${id}`
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      function (err, data) {
        console.log("Trace1", err)
        console.log("Trace1", data)
        if (err) return;
      }
    );
  };
}
