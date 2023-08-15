
const Analytics = {
    trackView: (eventName, metaData) => {
      if (eventName) return buildfire.analytics.trackView(eventName, metaData);
    },
    trackAction: (eventName, metaData) => {
      if (eventName) return buildfire.analytics.trackAction(eventName, metaData);
    },
    registerEvent: (event, options, callback) => {
      if (event.title && event.key) {
        let _options = options.silentNotification || true;
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
        }
      );
  
      Analytics.registerEvent(
        analyticKeys.SUGGESTIONS_NUMBER,
        { silentNotification: true },
        (err, res) => {
          if (err) console.error(err);
        }
      );
      Analytics.registerEvent(
        analyticKeys.CHARGING_CREDITS,
        { silentNotification: true },
        (err, res) => {
          if (err) console.error(err);
        }
      );
      Analytics.registerEvent(
        analyticKeys.CONSUMING_CREDITS,
        { silentNotification: true },
        (err, res) => {
          if (err) console.error(err);
        }
      );
    },
  };
  