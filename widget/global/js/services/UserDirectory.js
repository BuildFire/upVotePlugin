class UserDirectory {
	static get DirectoryTag() {
		return '$$userDirectory';
	}
	static get BadgesTag() {
		return '$$badges';
	}

	static getUserDirectoryRecord(userId) {
		return new Promise((resolve, reject) => {
			const filter = {
				'_buildfire.index.string1': userId
			}

			buildfire.appData.search({ filter }, '$$userDirectory', (err, res) => {
				if (err) reject(err);
				else {
					resolve(res[0] ? res[0].data : null);
				}
			});
		});
	}

	static getUserBadges(badgesIds) {
		return new Promise((resolve, reject) => {
            const filter = {
                '_buildfire.index.string1': { $in: badgesIds }
            }

            buildfire.appData.search({ filter }, '$$badges', (err, res) => {
                if (err) reject(err);
                else {
                    resolve(res.map(badge => badge.data));
                }
            });
        });
	}
}
