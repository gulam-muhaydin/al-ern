const connectToDatabase = require('../lib/db');
const User = require('../lib/User');
const { signToken } = require('../lib/auth');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { name, email, password, username, phone, referrer } = req.body;

    const normalizedName = (name || username || '').toString().trim();
    const normalizedEmail = (email || phone || username || '').toString().trim();
    const normalizedUsername = (username || '').toString().trim();
    const normalizedPhone = (phone || '').toString().trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (normalizedName) {
      const nameExists = await User.findOne({ name: normalizedName });
      if (nameExists) {
        return res.status(400).json({ message: 'Name already exists' });
      }
    }
    if (normalizedUsername) {
      const usernameExists = await User.findOne({ username: normalizedUsername });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    if (normalizedPhone) {
      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone already exists' });
      }
    }

    let referredBy = '';
    const referrerId = (referrer || '').toString().trim();
    if (referrerId) {
      const refUser = await User.findById(referrerId);
      if (refUser) {
        referredBy = referrerId;
      }
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      username: normalizedUsername,
      phone: normalizedPhone,
      password,
      referredBy,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: signToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
