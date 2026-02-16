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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    await connectToDatabase();
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const users = await User.find({}).select('-password');
    const list = Array.isArray(users) ? users : [];

    const level1 = list.filter(u => String(u.referredBy || '') === String(currentUser._id));
    const level1Ids = new Set(level1.map(u => String(u._id)));
    const level2 = list.filter(u => level1Ids.has(String(u.referredBy || '')));
    const level2Ids = new Set(level2.map(u => String(u._id)));

    const requests = await DepositRequest.findAll();
    const approved = (Array.isArray(requests) ? requests : []).filter(r => (r.status || 'pending') === 'approved');

    const userMap = new Map(list.map(u => [String(u._id), u]));
    const items = [];
    let totalBonus = 0;

    approved.forEach(r => {
      const userId = String(r.userId || '');
      let level = null;
      let percent = 0;
      if (level1Ids.has(userId)) {
        level = 1;
        percent = 13;
      } else if (level2Ids.has(userId)) {
        level = 2;
        percent = 3;
      } else {
        return;
      }

      const amount = Number(r.amount || 0);
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      const bonusAmount = Number(((safeAmount * percent) / 100).toFixed(2));
      totalBonus += bonusAmount;

      const user = userMap.get(userId) || {};
      items.push({
        _id: r._id,
        userId,
        userName: r.userName || user.name || '-',
        userEmail: r.userEmail || user.email || '-',
        planId: r.planId || '-',
        amount: safeAmount,
        level,
        percent,
        bonusAmount,
        approvedAt: r.approvedAt || r.createdAt || null
      });
    });

    items.sort((a, b) => {
      const aTime = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const bTime = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json({
      totalBonus: Number(totalBonus.toFixed(2)),
      totalCount: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
