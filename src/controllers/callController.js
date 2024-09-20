const Call = require('../models/Call'); 
const User = require('../models/User');

const getAllCalls = async (req, res) => {
    try {
        
        let calls;
        
        if (req.user.function === 'supervisor') {
            calls = await Call.find().populate('agentId', 'name'); 
        } else if (req.user.function === 'agent') {
            calls = await Call.find({ agentId: req.user._id }).populate('agentId', 'name');
        }
        res.render('pages/calls/index', {
            currentPage: "calls",
            calls: calls,
            success: req.flash('success'), 
            error: req.flash('error')     
        });
    } catch (error) {
        console.error('Error fetching calls:', error);
        res.status(500).send('Server Error');
    }
};

const addCall = async (req, res) => {
    try {
       
        const agents = await User.find({ function: 'agent' });
        res.render('pages/calls/add', {
            currentPage: "calls",
            agents: agents,  
            success: req.flash('success'), 
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error rendering add call page:', error);
        res.status(500).send('Server Error');
    }
};


const storeCall = async (req, res) => {
    try {
        const agentId = req.user._id; 
        const lastCall = await Call.findOne().sort({ _id: -1 }).select('callCode');
        let newCallCode = 'C-1';
        if (lastCall && lastCall.callCode) {
            const lastCallNumber = parseInt(lastCall.callCode.split('-')[1]);
            newCallCode = `C-${lastCallNumber + 1}`;
        }
        const newCall = new Call({
            callerName: req.body.callerName,
            agentId: agentId,  
            date: req.body.date,
            duration: req.body.duration,
            subject: req.body.subject,
            callCode: newCallCode
        });
        await newCall.save();
        req.flash('success', 'The call has been successfully added');
        res.redirect('/calls'); 
    } catch (error) {
        req.flash('error', 'Error adding call');
        console.error('Error storing the call:', error);
        res.redirect('back'); 
    }
};

const editCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }
        res.render('pages/calls/edit', { 
            currentPage: "calls", 
            call: call, 
            success: req.flash('success'), 
            error: req.flash('error') 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateCall = async (req, res) => {
    try {
        const { id } = req.params;
        const { callerName, duration, subject } = req.body;
        const call = await Call.findById(id);
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }
        call.callerName = callerName;
        call.duration = duration;
        call.subject = subject;
        await call.save();
        req.flash('success', 'The call details are successfully updated');
        res.redirect('/calls');
    } catch (err) {
        req.flash('error', 'Error updating call');
        res.redirect('back');
    }
};
const viewCall = async (req, res) => {
    try {
       
        const call = await Call.findOne({ _id: req.params.id }).populate('agentId');
        
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }
        
        res.render('pages/calls/view', { 
            currentPage: "calls", 
            call: call, 
            success: req.flash('success'), 
            error: req.flash('error') 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



module.exports = {
     getAllCalls,
     addCall,
     storeCall,
     editCall,
     updateCall,
     viewCall
    
    };
