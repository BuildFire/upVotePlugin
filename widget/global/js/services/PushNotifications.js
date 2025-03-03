class PushNotification {
  static sendToAll(title, message, id) {
    const notification = {
      title,
      text: message,
      at: new Date(),
      sendToSelf: false,
      queryString: `id=${id}`,
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      (err, data) => {
        if (err) console.error(err);
      },
    );
  }

  static sendToCustomUsers(title, message, id, users) {
    const notification = {
      title,
      text: message,
      at: new Date(),
      sendToSelf: false,
      users,
      queryString: `id=${id}`,
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      (err, data) => {
        if (err) console.error(err);
      },
    );
  }

  static sendToUserSegment(title, message, id, userTags) {
    const notification = {
      title,
      text: message,
      at: new Date(),
      userTags,
      sendToSelf: false,
      queryString: `id=${id}`,
    };
    buildfire.notifications.pushNotification.schedule(
      notification,
      (err, data) => {
        if (err) console.error(err);
      },
    );
  }
}
