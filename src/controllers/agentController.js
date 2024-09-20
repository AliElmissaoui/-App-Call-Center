const User = require("../models/User");
const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};


const comparePassword = async (plainTextPassword, hashedPassword) => {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
};

const getAllAgents = async (req, res) => {
    try {
        const agents = await User.find({ function: 'agent' });
        res.render('pages/agents/index', {
            currentPage: "agents",
            agents: agents,
            success: req.flash('success'), 
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).send('Server Error');
    }
};
const addAgent = async (req, res) => {
    try {
        res.render('pages/agents/add', {
            currentPage: "agents",
            success: req.flash('success'), 
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).send('Server Error');
    }
};
const storeAgents = async (req, res) => {
    try {
        
        const hashedPassword = await hashPassword(req.body.password);
        const newAgent = new User({
            name: req.body.name,
            email: req.body.email,     
            phone: req.body.phone,  
            password:hashedPassword,    
            function: 'agent'          
        });
        await newAgent.save();
        req.flash('success', 'The agent is successfully created');
        res.redirect('/agents');
    } catch (err) {
        req.flash('error', 'Error creating agent');
        res.redirect('back');
    }
};
const editAgent = async (req, res) => {
    try {
        const agent = await User.findOne({ _id: req.params.id, function: 'agent' });
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }
        res.render('pages/agents/edit', { currentPage: "agents", agent: agent, success: req.flash('success'), error: req.flash('error') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateAgent = async (req, res) => {
    const { id } = req.params;
    const {name , email ,phone } = req.body;
        const Agent = await User.findById(id);
        if (!Agent) {
            return res.status(404).json({ message: ' Agent not found' });
        }
        Agent.name = name;
        Agent.email = email;
        Agent.phone = phone;
        await Agent.save();
        req.flash('success', 'The agent is successfully modified');
        res.redirect('/agents');
    
    
};

const deleteAgent = async (req, res) => {
    const { id } = req.params;

    try {
      
        const agent = await User.findById(id);

        if (!agent) {
            return res.status(404).json({ message: 'agent not found' });
        }
        const deletedagent = await User.findByIdAndRemove(id);

        res.json({ message: 'Agent deleted successfully', agent: deletedagent });
    } catch (error) {
        console.error('Error deleting Agent:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
const viewAgent = async (req, res) => {
    try {
        const agent = await User.findOne({ _id: req.params.id, function: 'agent' });
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }
        res.render('pages/agents/view', { currentPage: "agents", agent: agent, success: req.flash('success'), error: req.flash('error') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllAgents,
    addAgent,
    storeAgents,
    editAgent,
    updateAgent,
    deleteAgent,
    viewAgent
};