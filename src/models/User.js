const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: { 
        type: String, 
        required: true
    },
    function: {
        type: String,
        enum: ['agent', 'supervisor'], 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.statics.findByIdAndRemove = async function(id) {
    return await this.findOneAndDelete({ _id: id });
};

module.exports = mongoose.model('User', userSchema);