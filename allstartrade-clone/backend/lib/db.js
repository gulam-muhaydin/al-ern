
const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'backend', 'data');
const usersFile = path.join(dataDir, 'users.json');
const depositRequestsFile = path.join(dataDir, 'depositRequests.json');

const connectToDatabase = async () => {
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    // Ensure file exists
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, '[]');
    }
    if (!fs.existsSync(depositRequestsFile)) {
        fs.writeFileSync(depositRequestsFile, '[]');
    }
    console.log('Connected to local JSON database');
};

module.exports = connectToDatabase;
