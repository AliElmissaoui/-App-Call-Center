const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    callerName: {
        type: String,
        required: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    callCode: {
        type: String,
        unique: true 
    }
});

module.exports = mongoose.model('Call', callSchema);
