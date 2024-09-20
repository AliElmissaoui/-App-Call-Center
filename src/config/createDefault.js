const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('../models/User'); 


const defaultUser = {
    name: 'supervisor',
    email: 'supervisor@gmail.com',
    phone: '1234567890',
    password: 'supervisor123', 
    function: 'supervisor' 
};

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const existingUser = await User.findOne({ email: defaultUser.email });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
            const user = new User({ 
                ...defaultUser, 
                password: hashedPassword 
            });
            await user.save();
            console.log('Default user created successfully:', user);
        } else {
            console.log('Default user already exists:', existingUser);
        }
    } catch (error) {
        console.error('Error creating default user:', error);
    } finally {
        console.log('Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};


seedDatabase()
