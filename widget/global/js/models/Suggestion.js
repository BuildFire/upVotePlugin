class Suggestion {
  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title || null;
    this.suggestion = data.suggestion || null;
    this.createdBy = data.createdBy || null;
    this.createdOn = data.createdOn || null;
    this.modifiedOn = data.lastUpdated || null;
    this.upVotedBy = data.upVotedBy || {};
    this.status = data.status || SUGGESTION_STATUS.BACKLOG;
  }
}
