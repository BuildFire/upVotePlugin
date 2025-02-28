const widgetUtils = {
	prepareDeeplinkQueryStringData(obj) {
		return `&dld=${encodeURIComponent(JSON.stringify(obj))}`;
	},
	formatDate(date) {
		// return date in format MMM dd, yyyy
		const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
	}
}
