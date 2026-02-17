const fs = require('fs');
const path = require('path');

const requestsFile = path.join(__dirname, '..', 'data', 'withdrawRequests.json');

const getRequests = () => {
    try {
        if (!fs.existsSync(requestsFile)) return [];
        const data = fs.readFileSync(requestsFile, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const saveRequests = (requests) => {
    fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
};

class WithdrawRequest {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.userId = data.userId;
        this.userName = data.userName || '';
        this.userEmail = data.userEmail || '';
        this.method = data.method || 'jazzcash';
        this.amount = data.amount;
        this.accountNumber = data.accountNumber || '';
        this.accountName = data.accountName || '';
        this.fromWallet = data.fromWallet || 'current';
        this.status = data.status || 'pending';
        this.approvedAt = data.approvedAt || null;
        this.rejectedAt = data.rejectedAt || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    static async create(data) {
        const requests = getRequests();
        const req = new WithdrawRequest(data);
        requests.unshift(req);
        saveRequests(requests);
        return req;
    }

    static async findAll() {
        return getRequests().map(r => new WithdrawRequest(r));
    }

    static async findById(id) {
        const requests = getRequests();
        const found = requests.find(r => r._id === id);
        return found ? new WithdrawRequest(found) : null;
    }

    static async updateById(id, updates) {
        const requests = getRequests();
        const idx = requests.findIndex(r => r._id === id);
        if (idx === -1) return null;

        const updated = {
            ...requests[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        requests[idx] = updated;
        saveRequests(requests);
        return new WithdrawRequest(updated);
    }
}

module.exports = WithdrawRequest;
