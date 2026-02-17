
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

const getUsers = () => {
    try {
        if (!fs.existsSync(usersFile)) {
            return [];
        }
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const saveUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

class User {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.name = data.name;
        this.email = data.email;
        this.username = data.username || '';
        this.phone = data.phone || '';
        this.password = data.password;
        this.role = data.role || 'user';
        this.referredBy = data.referredBy || '';
        this.walletBalance = Number.isFinite(Number(data.walletBalance)) ? Number(data.walletBalance) : 0;
        this.plans = Array.isArray(data.plans) ? data.plans : [];
        this.createdAt = data.createdAt || new Date();
    }

    static async findOne(query) {
        const users = getUsers();
        const normalize = (value) => String(value || '').trim().toLowerCase();
        if (query.email) {
            const target = normalize(query.email);
            const user = users.find(u => normalize(u.email) === target);
            return user ? new User(user) : null;
        }
        if (query.name) {
            const target = normalize(query.name);
            const user = users.find(u => normalize(u.name) === target);
            return user ? new User(user) : null;
        }
        if (query.username) {
            const target = normalize(query.username);
            const user = users.find(u => normalize(u.username) === target);
            return user ? new User(user) : null;
        }
        if (query.phone) {
            const target = normalize(query.phone);
            const user = users.find(u => normalize(u.phone) === target);
            return user ? new User(user) : null;
        }
        return null;
    }

    static async findById(id) {
        const users = getUsers();
        const user = users.find(u => u._id === id);
        return user ? new User(user) : null;
    }

    static async create(data) {
        const users = getUsers();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        
        const newUser = new User({
            ...data,
            password: hashedPassword
        });
        
        users.push(newUser);
        saveUsers(users);
        return newUser;
    }

    static async updateById(id, updates) {
        const users = getUsers();
        const idx = users.findIndex(u => u._id === id);
        if (idx === -1) return null;
        const updated = {
            ...users[idx],
            ...updates
        };
        users[idx] = updated;
        saveUsers(users);
        return new User(updated);
    }

    static async addPlanForUser(userId, plan, requestId) {
        const users = getUsers();
        const idx = users.findIndex(u => u._id === userId);
        if (idx === -1) return null;
        const user = users[idx];
        const existingPlans = Array.isArray(user.plans) ? user.plans : [];
        const reqKey = String(requestId || '');
        if (reqKey && existingPlans.some(p => String(p.requestId || '') === reqKey)) {
            return new User(user);
        }

        const dailyProfit = Number(plan?.dailyProfit || 0);
        const validityDays = Number(plan?.validityDays || 0);
        const now = Date.now();
        const initialPayouts = validityDays > 0 ? 1 : 0;
        const currentBalance = Number(user.walletBalance || 0);
        const safeBalance = Number.isFinite(currentBalance) ? currentBalance : 0;
        const nextBalance = safeBalance + (initialPayouts ? dailyProfit : 0);

        const planEntry = {
            requestId: reqKey,
            planId: plan?.id || plan?.planId || '',
            dailyProfit,
            validityDays,
            startedAt: now,
            lastPayoutAt: now,
            payoutsDone: initialPayouts,
            status: 'active'
        };

        const updated = {
            ...user,
            walletBalance: nextBalance,
            plans: [...existingPlans, planEntry]
        };
        users[idx] = updated;
        saveUsers(users);
        return new User(updated);
    }

    static async applyPayoutsForUserId(userId) {
        const users = getUsers();
        const idx = users.findIndex(u => u._id === userId);
        if (idx === -1) return null;
        const user = users[idx];
        const plans = Array.isArray(user.plans) ? user.plans : [];
        if (!plans.length) return new User(user);

        const DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        let walletBalance = Number(user.walletBalance || 0);
        if (!Number.isFinite(walletBalance)) walletBalance = 0;
        let changed = false;

        const updatedPlans = plans.map(p => {
            if (!p || p.status !== 'active') return p;
            const dailyProfit = Number(p.dailyProfit || 0);
            const validityDays = Number(p.validityDays || 0);
            const payoutsDone = Number(p.payoutsDone || 0);
            const lastPayoutAt = Number(p.lastPayoutAt || p.startedAt || now);
            const remaining = Math.max(0, validityDays - payoutsDone);
            if (remaining <= 0) {
                if (p.status !== 'completed') changed = true;
                return { ...p, status: 'completed' };
            }
            const elapsed = now - lastPayoutAt;
            const periods = Math.floor(elapsed / DAY_MS);
            const payable = Math.min(periods, remaining);
            if (payable <= 0) return p;
            walletBalance += payable * dailyProfit;
            const newPayoutsDone = payoutsDone + payable;
            const newLastPayoutAt = lastPayoutAt + payable * DAY_MS;
            changed = true;
            return {
                ...p,
                payoutsDone: newPayoutsDone,
                lastPayoutAt: newLastPayoutAt,
                status: newPayoutsDone >= validityDays ? 'completed' : 'active'
            };
        });

        if (!changed) return new User(user);
        const updated = {
            ...user,
            walletBalance,
            plans: updatedPlans
        };
        users[idx] = updated;
        saveUsers(users);
        return new User(updated);
    }

    static async applyPayoutsForAll() {
        const users = getUsers();
        let changed = false;
        const DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();

        const updatedUsers = users.map(user => {
            const plans = Array.isArray(user.plans) ? user.plans : [];
            if (!plans.length) return user;
            let walletBalance = Number(user.walletBalance || 0);
            if (!Number.isFinite(walletBalance)) walletBalance = 0;
            let localChanged = false;

            const updatedPlans = plans.map(p => {
                if (!p || p.status !== 'active') return p;
                const dailyProfit = Number(p.dailyProfit || 0);
                const validityDays = Number(p.validityDays || 0);
                const payoutsDone = Number(p.payoutsDone || 0);
                const lastPayoutAt = Number(p.lastPayoutAt || p.startedAt || now);
                const remaining = Math.max(0, validityDays - payoutsDone);
                if (remaining <= 0) {
                    if (p.status !== 'completed') localChanged = true;
                    return { ...p, status: 'completed' };
                }
                const elapsed = now - lastPayoutAt;
                const periods = Math.floor(elapsed / DAY_MS);
                const payable = Math.min(periods, remaining);
                if (payable <= 0) return p;
                walletBalance += payable * dailyProfit;
                const newPayoutsDone = payoutsDone + payable;
                const newLastPayoutAt = lastPayoutAt + payable * DAY_MS;
                localChanged = true;
                return {
                    ...p,
                    payoutsDone: newPayoutsDone,
                    lastPayoutAt: newLastPayoutAt,
                    status: newPayoutsDone >= validityDays ? 'completed' : 'active'
                };
            });

            if (!localChanged) return user;
            changed = true;
            return {
                ...user,
                walletBalance,
                plans: updatedPlans
            };
        });

        if (!changed) return;
        saveUsers(updatedUsers);
    }

    static async find(query) {
        // Simple implementation returns all users
        const users = getUsers();
        // Mock Mongoose .select() chaining
        const result = users.map(u => new User(u));
        result.select = function(fields) {
            // Very basic mock of select
            if (fields === '-password') {
                return result.map(u => {
                    const { password, ...rest } = u;
                    return rest;
                });
            }
            return result;
        };
        return result;
    }

    async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    }

    async deleteOne() {
        const users = getUsers();
        const filteredUsers = users.filter(u => u._id !== this._id);
        saveUsers(filteredUsers);
    }
}

module.exports = User;
