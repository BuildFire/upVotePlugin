const analyticKeys = Object.freeze({
  VOTE_NUMBER: {
    title: 'Total Number of Votes',
    key: 'Vote_Number',
    description: 'Number of total votes for all suggestions ',
  },
  SUGGESTIONS_NUMBER: {
    title: 'Number of Suggestions',
    key: 'Suggestions_Number',
    description: 'Number of suggestions for all users',
  },
  CHARGING_CREDITS: {
    title: 'Upvote Credit Purchased',
    key: 'Charging_Credits',
    description: 'When a purchase is made by a user',
  },
  CONSUMING_CREDITS: {
    title: 'Upvote Credit Consumed',
    key: 'Consuming_Credits',
    description: 'When all credits are consumed by a user',
  },
});

const Analytics = {
  trackView: (eventName, metaData) => {
    if (eventName) return buildfire.analytics.trackView(eventName, metaData);
  },
  trackAction: (eventName, metaData) => {
    if (eventName) return buildfire.analytics.trackAction(eventName, metaData);
  },
  registerEvent: (event, options, callback) => {
    if (event.title && event.key) {
      const _options = options.silentNotification || true;
      buildfire.analytics.registerEvent(event, _options, (err, res) => {
        if (err) return callback(err, null);
        return callback(null, res);
      });
    }
  },
  unregisterEvent: (key, callback) => {
    if (key) {
      buildfire.analytics.unregisterEvent(key, (err, res) => {
        if (err) return callback(err, null);
        return callback(null, res);
      });
    }
  },
  showReports: (options, callback) => {
    if (options.eventKey) {
      buildfire.analytics.showReports(options, (err, res) => {
        if (err) return callback(err, null);
        return callback(null, res);
      });
    }
  },

  init: () => {
    Analytics.registerEvent(
      analyticKeys.VOTE_NUMBER,
      { silentNotification: true },
      (err, res) => {
        if (err) console.error(err);
      },
    );

    Analytics.registerEvent(
      analyticKeys.SUGGESTIONS_NUMBER,
      { silentNotification: true },
      (err, res) => {
        if (err) console.error(err);
      },
    );
    Analytics.registerEvent(
      analyticKeys.CHARGING_CREDITS,
      { silentNotification: true },
      (err, res) => {
        if (err) console.error(err);
      },
    );
    Analytics.registerEvent(
      analyticKeys.CONSUMING_CREDITS,
      { silentNotification: true },
      (err, res) => {
        if (err) console.error(err);
      },
    );
  },
};
