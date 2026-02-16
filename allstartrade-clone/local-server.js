
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API Routes Adapter (mimic Vercel function signature)
const apiAdapter = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// Mount API routes
const registerHandler = require('./backend/api/register');
const loginHandler = require('./backend/api/login');
const userHandler = require('./backend/api/user');
const usersHandler = require('./backend/api/users');
const depositRequestsHandler = require('./backend/api/deposit-requests');
const withdrawRequestsHandler = require('./backend/api/withdraw-requests');
const referralsHandler = require('./backend/api/referrals');
const referralBonusHandler = require('./backend/api/referral-bonus');

app.post('/api/register', apiAdapter(registerHandler));
app.post('/api/login', apiAdapter(loginHandler));
app.get('/api/user', apiAdapter(userHandler));
app.get('/api/users', apiAdapter(usersHandler));
app.delete('/api/users', apiAdapter(usersHandler)); 
app.get('/api/deposit-requests', apiAdapter(depositRequestsHandler));
app.post('/api/deposit-requests', apiAdapter(depositRequestsHandler));
app.patch('/api/deposit-requests', apiAdapter(depositRequestsHandler));
app.get('/api/withdraw-requests', apiAdapter(withdrawRequestsHandler));
app.post('/api/withdraw-requests', apiAdapter(withdrawRequestsHandler));
app.patch('/api/withdraw-requests', apiAdapter(withdrawRequestsHandler));
app.get('/api/referrals', apiAdapter(referralsHandler));
app.get('/api/referral-bonus', apiAdapter(referralBonusHandler));

// Serve static files (css, js, images)
app.use(express.static(path.join(__dirname, 'frontend'), { extensions: ['html'] }));

// Handle routes without .html extension
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
});
