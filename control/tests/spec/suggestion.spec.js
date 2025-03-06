describe('Suggestions', () => {
  let testSuggestion = {
    title: 'Test Title',
    suggestion: 'Test Suggestion',
    createdBy: '',
    createdOn: new Date(),
    modifiedOn: new Date(),
    pushNotificationTags: null,
    upVotedBy: null,
    status: SUGGESTION_STATUS.BACKLOG,
  };
  it('Insert New Suggestion', (done) => {
    Suggestions.insert(testSuggestion).then((result) => {
      const suggestion = new Suggestion(result);
      testSuggestion = suggestion;
      expect(suggestion.id).toBeDefined();
      done();
    }).catch((error) => fail(error));
  });

  it('Update Existing Suggestion', (done) => {
    Suggestions.update(testSuggestion.id, { ...testSuggestion, title: 'updated title' })
      .then((result) => {
        expect(result.title).toEqual('updated title');
        done();
      })
      .catch((error) => fail(error));
  });

  it('Delete Existing Suggestion', (done) => {
    Suggestions.delete(testSuggestion.id)
      .then((result) => {
        expect(result.status).toEqual('deleted');
        done();
      })
      .catch((error) => fail(error));
  });
});
