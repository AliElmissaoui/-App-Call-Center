const User = require("../models/User");
const Call = require("../models/Call");
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const { sendMail } = require('../config/mailer');


const getAllTickets = async (req, res) => {
    try {
        let tickets;
        
        if (req.user.function === 'supervisor') {
             tickets = await Ticket.find(); 
        } else if (req.user.function === 'agent') {
            tickets = await Ticket.find({ agentId: req.user._id });
        }
        
        res.render('pages/tickets/index', {
            tickets: tickets,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).send('Server Error');
    }
};

const addTicket = async (req, res) => {
    try {
       
        const calls = await Call.find(); 

        res.render('pages/tickets/add', {
            currentPage: "tickets",
            calls: calls, 
            success: req.flash('success'),
            error: req.flash('error'),
            statusOptions: ['open', 'in-progress', 'resolved']
        });
    } catch (error) {
        console.error('Error rendering add ticket page:', error);
        res.status(500).send('Server Error');
    }
};

const storeTicket = async (req, res) => {
    try {
        const agentId = req.user._id; 
        const agent = req.user; 
        const newTicketCode = await generateNewTicketCode();
        const newTicket = new Ticket({
            callId: req.body.callId,       
            agentId: agentId,    
            problemDescription: req.body.problemDescription,
            status: req.body.status,
            priority: req.body.priority,
            ticketCode:newTicketCode,
            subject:req.body.subject,
        });
        await newTicket.save();
        const supervisor = await User.findOne({ function: 'supervisor' });
        if (!supervisor) {
            req.flash('error', 'No supervisor found to send the notification.');
            return res.redirect('/tickets');
        }

        await sendTicketNotifications(supervisor, agent, newTicket);
        req.flash('success', 'The ticket has been successfully added');
        res.redirect('/tickets'); 
    } catch (error) {
        req.flash('error', 'Error adding ticket');
        console.error('Error storing the ticket:', error);
        res.redirect('back');
    }
};

const editTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        const calls = await Call.find();  
        if (!ticket) {
            req.flash('error', 'Ticket not found');
            return res.redirect('/tickets');
        }
        res.render('pages/tickets/edit', { 
            currentPage: "tickets", 
            ticket: ticket, 
            calls: calls,  
            success: req.flash('success'), 
            error: req.flash('error') 
        });
    } catch (err) {
        req.flash('error', 'An error occurred while fetching the ticket');
        res.redirect('/tickets');
    }
};



const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { problemDescription, subject, priority, callId } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            req.flash('error', 'Ticket not found');
            return res.redirect('/tickets');
        }
        ticket.problemDescription = problemDescription;
        ticket.subject = subject;
        ticket.priority = priority;
        ticket.callId = callId;  
        ticket.updatedAt = Date.now();
        
        await ticket.save();

        req.flash('success', 'The ticket details have been successfully updated');
        res.redirect('/tickets');
    } catch (err) {
        req.flash('error', `Error updating ticket: ${err.message}`);
        res.redirect('back');
    }
};

const viewTicket = async (req, res) => {
    try {
        const ticketId = req.params.id; 
        const ticket = await Ticket.findById(ticketId).populate({
            path: 'comments',
            populate: {
                path: 'commenterId',
                select: 'name' 
            }
        });
        
        if (!ticket) {
            return res.status(404).send('Ticket not found');
        }
        res.render('pages/tickets/view', {
            ticket,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).send('Server Error');
    }
};

const addComment = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { commentText } = req.body;

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).send('Ticket not found');
        }

        const newComment = new Comment({
            ticketId: ticket._id,
            commenterId: req.user._id, 
            commentText
        });

        await newComment.save();
        ticket.comments.push(newComment._id);
        await ticket.save();

        req.flash('success', 'Comment added successfully');
        res.redirect(`/tickets/view/${ticketId}`);
    } catch (error) {
        console.error('Error adding comment:', error);
        req.flash('error', 'Error adding comment');
        res.redirect('back');
    }
};

const updateTicketStatus = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        const oldStatus = ticket.status;
        const newStatus = req.body.status;
        ticket.status = newStatus;
        await ticket.save();
        const user = req.user;
        const userFunction = user.function;
        const agent = await User.findById(ticket.agentId);
        if (!agent) {
            req.flash('error', 'Agent not found.');
            return res.redirect('/tickets');
        }
        if (oldStatus !== newStatus) {
            const supervisor = await User.findOne({ function: 'supervisor' });
            if (!supervisor) {
                req.flash('error', 'Supervisor not found.');
                return res.redirect('/tickets');
            }
            const ticketDetails = `Ticket Details:\n- Ticket Code: ${ticket.ticketCode}`;
            if (userFunction === 'supervisor') {
                const supervisorEmailText = `
                    Hi ${supervisor.name},

                    You have updated the status of the ticket assigned to Agent ${agent.name}.\n
                    ${ticketDetails}
                `;

                const agentEmailText = `
                    Hi ${agent.name},

                    The status of your ticket (Code: ${ticket.ticketCode}) has been updated by Supervisor ${user.name}.\n
                    ${ticketDetails}
                `;
                await sendMail(supervisor.email, `Ticket Status Updated: ${ticket.ticketCode}`, supervisorEmailText);
                await sendMail(agent.email, `Ticket Status Updated: ${ticket.ticketCode}`, agentEmailText);
            } else if (userFunction === 'agent') {
                const agentEmailText = `
                    Hi ${agent.name},

                    You have updated the status of your ticket.\n
                    ${ticketDetails}
                `;

                const supervisorEmailText = `
                    Hi ${supervisor.name},
                    The status of the ticket (Code: ${ticket.ticketCode}) assigned to Agent ${agent.name} has been updated by Agent ${user.name}.\n
                    ${ticketDetails}
                `;
                await sendMail(agent.email, `Ticket Status Updated: ${ticket.ticketCode}`, agentEmailText);
                await sendMail(supervisor.email, `Ticket Status Updated: ${ticket.ticketCode}`, supervisorEmailText);
            }
        }

        // Respond with success message
        res.json({ success: true, message: 'Ticket status updated successfully' });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ success: false, message: 'Error updating ticket status' });
    }
};

const generateNewTicketCode = async () => {
    const lastTicket = await Ticket.findOne().sort({ _id: -1 }).select('ticketCode');
    if (lastTicket && lastTicket.ticketCode) {
        const lastTicketNumber = parseInt(lastTicket.ticketCode.split('-')[1], 10);
        return `T-${lastTicketNumber + 1}`;
    }
    return 'T-1';
};
const sendTicketNotifications = async (supervisor, agent, ticket) => {
    const supervisorEmailText = `
        A new ticket has been created by Agent ${agent.name}.
        
        Ticket Details:
        - Ticket Code: ${ticket.ticketCode}

        Please follow up if necessary.
    `;
    
    const agentEmailText = `
        Hi ${agent.name},

        Your ticket has been successfully created with the following details:

        - Ticket Code: ${ticket.ticketCode}

        You will be notified once there is an update on your ticket. Thank you for your submission.
    `;
    await sendMail(supervisor.email, `New Ticket Created: ${ticket.ticketCode}`, supervisorEmailText);
    await sendMail(agent.email, `Ticket Created: ${ticket.ticketCode}`, agentEmailText);
};
module.exports = {
    getAllTickets,
    addTicket,
    storeTicket,
    editTicket,
    updateTicket,
    viewTicket,
    addComment,
    updateTicketStatus
   
   };