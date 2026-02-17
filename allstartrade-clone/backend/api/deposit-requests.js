const connectToDatabase = require('../lib/db');
const User = require('../lib/User');
const DepositRequest = require('../lib/DepositRequest');
const { verifyToken } = require('../lib/auth');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const adminPin = req.headers['x-admin-pin'];
    const isPinAdmin = String(adminPin || '') === '2227';

    let token;
    let user;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
            await connectToDatabase();
            user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
        } catch {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else if (!isPinAdmin) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    } else {
        await connectToDatabase();
        user = { _id: 'admin', role: 'admin' };
    }

    const isAdmin = user.role === 'admin' || isPinAdmin;

    if (req.method === 'GET') {
        const id = req.query.id;
        if (id) {
            const found = await DepositRequest.findById(id);
            if (!found) return res.status(404).json({ message: 'Request not found' });
            if (isAdmin || found.userId === user._id) return res.json(found);
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (isAdmin) {
            const list = await DepositRequest.findAll();
            return res.json(list);
        }

        const list = await DepositRequest.findAll();
        return res.json(list.filter(r => r.userId === user._id));
    }

    if (req.method === 'POST') {
        const { method, plan, planId, amount, transactionId, accountNumber, accountName, proof } = req.body || {};
        const finalPlanId = plan?.id || planId;
        const finalAmount = plan?.price || amount;
        if (!finalPlanId || !finalAmount || !transactionId || !proof) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const created = await DepositRequest.create({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            method: method || 'jazzcash',
            plan: plan || null,
            planId: finalPlanId,
            amount: finalAmount,
            transactionId,
            accountNumber: accountNumber || '',
            accountName: accountName || '',
            proof,
            status: 'pending',
        });
        return res.status(201).json(created);
    }

    if (req.method === 'PATCH') {
        if (!isAdmin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const id = req.query.id;
        const { status } = req.body || {};
        if (!id) return res.status(400).json({ message: 'Request ID required' });
        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updates = { status };
        if (status === 'approved') {
            updates.approvedAt = new Date().toISOString();
            updates.rejectedAt = null;
        }
        if (status === 'rejected') {
            updates.rejectedAt = new Date().toISOString();
            updates.approvedAt = null;
        }

        const updated = await DepositRequest.updateById(id, updates);
        if (!updated) return res.status(404).json({ message: 'Request not found' });
        if (status === 'approved') {
            await User.addPlanForUser(updated.userId, updated.plan || {}, updated._id);
        }
        return res.json(updated);
    }

    return res.status(405).json({ message: 'Method not allowed' });
};
