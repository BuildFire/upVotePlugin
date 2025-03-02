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
}
