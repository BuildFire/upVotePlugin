describe('Suggestions', () => {
  let testSuggestion = {
    title: 'Test Title',
    suggestion: 'Test Suggestion',
    createdBy: '',
    createdOn: new Date(),
    modifiedOn: new Date(),
    pushNotificationTags: null,
    upVoteCount: 5,
    upVotedBy: null,
    status: SUGGESTION_STATUS.BACKLOG,
  };
  it('Insert New Suggestion', (done) => {
    Suggestions.insert(testSuggestion).then((result) => {
      const suggestion = new Suggestion(result);
      testSuggestion = suggestion;
      expect(suggestion.id).toBeDefined();
      expect(suggestion.upVoteCount).toEqual(5);
      done();
    }).catch((error) => fail(error));
  });

  it('Update Existing Suggestion', (done) => {
    Suggestions.update(testSuggestion.id, { ...testSuggestion, upVoteCount: 2 })
      .then((result) => {
        expect(result.upVoteCount).toEqual(2);
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
