const ENUMS = Object.freeze({
  'USERS_PERMISSIONS': {
    'ALL_USERS': 'ALL_USERS',
    'NO_USERS': 'NO_USERS',
    'USERS_WITH': 'USERS_WITH'
  },
  'SUGGESTIONS_SORTING': {
    'NEWEST': 'NEWEST',
    'OLDEST': 'OLDEST',
    'MOST_VOTES': 'MOST_VOTES'
  },
  'SECRET_KEY': 'upvote',
})

var SUGGESTION_STATUS = Object.freeze({
	BACKLOG: 1,
  INPROGRESS: 2,
  COMPLETED: 3,
});
