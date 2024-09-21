const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketCode: {
        type: String,
        unique: true 
    },
    callId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Call',
        required: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problemDescription: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high','urgent'],
        default: 'medium'
    },
    comments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Middleware to update `updatedAt` field on ticket updates
ticketSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
