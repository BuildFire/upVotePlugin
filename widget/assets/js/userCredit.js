class UserCredit {
    constructor(data = {}) {
        this.id = data.id;
        this.credits = data.credits || '';
        this.firstTimePurchase = data.firstTimePurchase || false;
        this.userId = data.userId || null;
        this.createdOn = data.createdOn || new Date();
        this.createdBy = data.createdBy || null;
        this.lastUpdatedOn = data.lastUpdatedOn || new Date();
        this.lastUpdatedBy = data.lastUpdatedBy || null;
        this.deletedOn = data.deletedOn || null;
        this.deletedBy = data.deletedBy || null;
        this.isActive = data.isActive || 1;
    }

    toJSON() {
        return {
            id: this.id,
            credits: this.credits,
            createdOn: this.createdOn,
            firstTimePurchase: this.firstTimePurchase,
            userId: this.userId,
            createdBy: this.createdBy,
            lastUpdatedOn: this.lastUpdatedOn,
            lastUpdatedBy: this.lastUpdatedBy,
            deletedOn: this.deletedOn,
            deletedBy: this.deletedBy,
            isActive: this.isActive,
            _buildfire: {
                index: {
                    string1: this.userId,
                    date1: this.createdOn,
                },
            },
        };
    }

    /**
     * @returns user collection tag
     */
    static get TAG() {
        return 'credits';
    }

    /**
     *
     * @param {string} userId
     * @returns {Promise}
     */
    static get(userId) {
        return new Promise((resolve, reject) => {
            buildfire.appData.search(
                {
                    filter: {
                        '$json._buildfire.index.string1': userId,
                    },
                },
                this.TAG,
                (err, results) => {
                    if (err) return reject(err);

                    if (!results || !results.length) {
                        const data = new UserCredit({
                            userId: userId,
                        }).toJSON();
                        this.insert(data).then((res) => {
                            res.data.id = res.id;
                            resolve(new UserCredit(res.data).toJSON());
                        });
                    } else {
                        results[0].data.id = results[0].id;
                        resolve(new UserCredit(results[0].data).toJSON());
                    }
                }
            );
        });
    }

    /**
     * @param {object} data
     * @returns {Promise}
     */
    static insert(data) {
        return new Promise((resolve, reject) => {
            buildfire.appData.insert(data, this.TAG, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    /**
     * @param {string} userId
     * @param {object} data
     * @param {Promise}
     */
    static update(userId, data) {
        return new Promise((resolve, reject) => {
            buildfire.appData.update(userId, data, this.TAG, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }
}
