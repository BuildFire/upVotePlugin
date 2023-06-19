
  describe('Settings', () => {
  

    it('Updates Settings', (done) => {
      const testSettings = {
        enableComments:  true,
        statusUpdateUsersSegment: STATUS_UPDATE_SEGMENT.ALL_USERS,
        statusUpdateTags: [],
        pushNotificationUsersSegment: PUSH_NOTIFICATIONS_SEGMENT.NO_USERS,
        pushNotificationTags: [{tagName: "Pierre", id:1}]
      };
      Settings.save(testSettings, (err, result) => {
        const settings = result.data;
        expect(settings.pushNotificationTags.length).toEqual(1);
        expect(settings.statusUpdateTags.length).toEqual(0);
        done();
      })
        .catch(error => fail(error));
    });

    it('Gets Updated Settings', (done) => {
      Settings.get((err, result)=>{
        expect(result.pushNotificationTags.length).toEqual(1);
        expect(result.statusUpdateTags.length).toEqual(0);
        done();
      }).catch(error => fail(error));
    });


    it('Updates Settings To Default', (done) => {
      const testSettings = new Settings();
      Settings.save(testSettings, (err, result) => {
        const settings = result.data;
        expect(settings.pushNotificationTags.length).toEqual(0);
        expect(settings.statusUpdateTags.length).toEqual(0);
        done();
      })
        .catch(error => fail(error));
    });


    it('Gets Default Settings', (done) => {
      Settings.get((err, result)=>{
        expect(result.pushNotificationTags.length).toEqual(0);
        expect(result.statusUpdateTags.length).toEqual(0);
        expect(result.enableComments).toEqual(false);
        expect(result.statusUpdateUsersSegment).toEqual(STATUS_UPDATE_SEGMENT.NO_USERS);
        expect(result.pushNotificationUsersSegment).toEqual(PUSH_NOTIFICATIONS_SEGMENT.NO_USERS);
        
        done();
      }).catch(error => fail(error));
    });
  });
