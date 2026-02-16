
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFile = path.join(process.cwd(), 'backend', 'data', 'users.json');

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
        this.password = data.password;
        this.role = data.role || 'user';
        this.referredBy = data.referredBy || '';
        this.createdAt = data.createdAt || new Date();
    }

    static async findOne(query) {
        const users = getUsers();
        if (query.email) {
            const user = users.find(u => u.email === query.email);
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
        
        // Hash password
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
