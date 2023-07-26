function convertTimeToMinutes(timeString) {
    const regex = /(\d+)(min|hour)/;
    const matches = timeString.match(regex);
    if (matches && matches.length === 3) {
        const value = parseInt(matches[1]);
        const unit = matches[2];
        if (unit === 'min') {
            return value;
        } else if (unit === 'hour') {
            return value * 60;
        }
    }
    return 0; // Return 0 if the time format is not recognized
}
