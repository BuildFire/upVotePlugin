class UserCredit {
    constructor(data = {}) {
        this.id = data.id;
        this.credits = data.credits || '';
        this.firsTimePurchase = data.firsTimePurchase || false;
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
            firsTimePurchase: this.firsTimePurchase,
            createdBy: this.createdBy,
            lastUpdatedOn: this.lastUpdatedOn,
            lastUpdatedBy: this.lastUpdatedBy,
            deletedOn: this.deletedOn,
            deletedBy: this.deletedBy,
            isActive: this.isActive,
        };
    }

    /**
     * @returns user collection tag
     */
    static get TAG() {
        return 'creditsxxxxyyzzq';
    }

    /**
     *
     * @returns user credit data
     */
    static get() {
        return new Promise((resolve, reject) => {
            buildfire.userData.get(this.TAG, (e, results) => {
                if (e) {
                    reject(e);
                }
                if (
                    !results ||
                    !results.data ||
                    Object.keys(results.data).length === 0
                ) {
                    const data = new UserCredit();
                    this.save(data);
                    resolve(
                        new UserCredit({
                            ...results.data,
                            id: results.id,
                        }).toJSON()
                    );
                } else {
                    resolve(
                        new UserCredit({
                            ...results.data,
                            id: results.id,
                        }).toJSON()
                    );
                }
            });
        });
    }

    /**
     *
     * @param {object} data
     * @returns return user credit data
     */
    static save(data) {
        return new Promise((resolve, reject) => {
            buildfire.userData.save(data, this.TAG, (err, results) => {
                if (err) return reject(err);
                if (results.data.$set && results.data.$set.credits) {
                    resolve(
                        new UserCredit({
                            ...results,
                            credits: results.data.$set.credits,
                        }).toJSON()
                    );
                } else {
                    resolve(new UserCredit(results).toJSON());
                }
            });
        });
    }
}
