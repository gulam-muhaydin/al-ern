const fs = require('fs');
const path = require('path');

const requestsFile = path.join(process.cwd(), 'backend', 'data', 'depositRequests.json');

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

class DepositRequest {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.userId = data.userId;
        this.userName = data.userName || '';
        this.userEmail = data.userEmail || '';
        this.method = data.method || 'jazzcash';
        this.plan = data.plan || null;
        this.planId = data.planId;
        this.amount = data.amount;
        this.transactionId = data.transactionId;
        this.accountNumber = data.accountNumber || '';
        this.accountName = data.accountName || '';
        this.proof = data.proof || null;
        this.status = data.status || 'pending';
        this.approvedAt = data.approvedAt || null;
        this.rejectedAt = data.rejectedAt || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    static async create(data) {
        const requests = getRequests();
        const req = new DepositRequest(data);
        requests.unshift(req);
        saveRequests(requests);
        return req;
    }

    static async findAll() {
        return getRequests().map(r => new DepositRequest(r));
    }

    static async findById(id) {
        const requests = getRequests();
        const found = requests.find(r => r._id === id);
        return found ? new DepositRequest(found) : null;
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
        return new DepositRequest(updated);
    }
}

module.exports = DepositRequest;
