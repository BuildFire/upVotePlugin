
describe('Settings', () => {
  it('Updates Settings', (done) => {
    const testSettings = new Setting();
    Settings.save(testSettings).then((settings) => {
      expect(settings.hasOwnProperty('introduction')).toEqual(true);
      expect(settings.hasOwnProperty('inAppPurchase')).toEqual(true);
      expect(settings.hasOwnProperty('permissions')).toEqual(true);
      done();
    }).catch(error => fail(error));
  });

  it('Gets Updated Settings', (done) => {
    Settings.get().then((settings) => {
      expect(settings.hasOwnProperty('introduction')).toEqual(true);
      expect(settings.hasOwnProperty('inAppPurchase')).toEqual(true);
      expect(settings.hasOwnProperty('permissions')).toEqual(true);
      done();
    }).catch(error => fail(error));
  });
});
