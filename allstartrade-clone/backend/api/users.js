const connectToDatabase = require('../lib/db');
const User = require('../lib/User');
const { verifyToken } = require('../lib/auth');

module.exports = async (req, res) => {
  // Enable CORS
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

  let token;
  let user;

  // Auth Middleware Logic
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
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

      // Admin check
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
      }

    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  if (req.method === 'GET') {
    try {
      const users = await User.find({}).select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    // We expect the ID to be part of the query in serverless functions usually, 
    // or we can parse it from the URL if using dynamic routes like /api/users/[id].js
    // But since the structure requested is simple, let's assume query parameter ?id=...
    // Or we can try to parse it from req.url if needed, but query param is safer for standard Vercel functions without dynamic routing file setup.
    // However, the prompt asked for DELETE /api/users/:id.
    // In Vercel, to support /api/users/:id, we usually need a file named [id].js in users directory.
    // The prompt structure was:
    // api/
    // ├── register.js
    // ├── login.js
    // ├── user.js
    // ├── users.js
    // So DELETE /api/users/:id might need to be handled in users.js by checking query params or path.
    // But standard Vercel routing for `users.js` will catch `/api/users`.
    // If the user wants `/api/users/:id`, we might need to rely on query params `?id=` 
    // OR create a folder `api/users/[id].js`.
    // Given the prompt's strict structure, I will handle DELETE in `users.js` and expect the ID in the query string `?id=...` 
    // OR try to parse it from the path if Vercel passes it (which it does if configured, but strict file structure was given).
    // Let's support `?id=` for simplicity and robustness in a single file, 
    // but I'll also check if I can support the path style.
    
    const id = req.query.id; 
    
    if (!id) {
        return res.status(400).json({ message: 'User ID required' });
    }

    try {
      const userToDelete = await User.findById(id);
      if (userToDelete) {
        await userToDelete.deleteOne();
        res.json({ message: 'User removed' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
