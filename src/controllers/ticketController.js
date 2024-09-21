const User = require("../models/User");
const Call = require("../models/Call");
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const { sendMail } = require('../config/mailer');

const getAllTickets = async (req, res) => {
    try {
        const tickets = req.user.function === 'supervisor' 
            ? await Ticket.find().populate('callId') 
            : await Ticket.find({ agentId: req.user._id }).populate('callId');
        
        res.render('pages/tickets/index', {
            tickets,
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
        if (req.user.function !== 'agent') return res.redirect('/tickets');
        
        const calls = await Call.find({ agentId: req.user._id });

        res.render('pages/tickets/add', {
            currentPage: "tickets",
            calls, 
            success: req.flash('success'),
            error: req.flash('error'),
            statusOptions: ['open', 'in-progress', 'resolved'],
            priorityOptions: ['low', 'medium', 'high', 'urgent']
        });
    } catch (error) {
        console.error('Error rendering add ticket page:', error);
        res.status(500).send('Server Error');
    }
};

const storeTicket = async (req, res) => {
    try {
        const newTicketCode = await generateNewTicketCode();
        const newTicket = new Ticket({
            callId: req.body.callId,
            agentId: req.user._id,
            problemDescription: req.body.problemDescription,
            status: req.body.status,
            priority: req.body.priority,
            ticketCode: newTicketCode,
        });

        await newTicket.save();

        const supervisor = await User.findOne({ function: 'supervisor' });
        if (!supervisor) {
            req.flash('error', 'No supervisor found to send the notification.');
            return res.redirect('/tickets');
        }

        await sendTicketNotifications(supervisor, req.user, newTicket);
        req.flash('success', 'The ticket has been successfully added');
        res.redirect('/tickets');
    } catch (error) {
        console.error('Error storing the ticket:', error);
        req.flash('error', 'Error adding ticket');
        res.redirect('back');
    }
};

const editTicket = async (req, res) => {
    try {
        if (req.user.function !== 'agent') return res.redirect('/tickets');

        const ticket = await Ticket.findById(req.params.id);
        const calls = await Call.find({ agentId: req.user._id });

        if (!ticket) {
            req.flash('error', 'Ticket not found');
            return res.redirect('/tickets');
        }

        res.render('pages/tickets/edit', {
            currentPage: "tickets",
            ticket,
            calls,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error fetching ticket');
        res.redirect('/tickets');
    }
};

const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            req.flash('error', 'Ticket not found');
            return res.redirect('/tickets');
        }

        ticket.problemDescription = req.body.problemDescription;
        ticket.priority = req.body.priority;
        ticket.callId = req.body.callId;
        ticket.updatedAt = Date.now();

        await ticket.save();

        req.flash('success', 'The ticket details have been successfully updated');
        res.redirect('/tickets');
    } catch (error) {
        req.flash('error', 'Error updating ticket');
        res.redirect('back');
    }
};

const viewTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate({
                path: 'comments',
                populate: { path: 'commenterId', select: 'name' }
            })
            .populate('callId')
            .populate('agentId');

        if (!ticket) return res.status(404).send('Ticket not found');

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
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send('Ticket not found');

        const newComment = new Comment({
            ticketId: ticket._id,
            commenterId: req.user._id,
            commentText: req.body.commentText
        });

        await newComment.save();
        ticket.comments.push(newComment._id);
        await ticket.save();

        req.flash('success', 'Comment added successfully');
        res.redirect(`/tickets/view/${ticket._id}`);
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

        const ticketDetails = `
            Ticket Code: ${ticket.ticketCode}
            Old Status :  ${ oldStatus}
            Status: ${ticket.status}
            Priority: ${ticket.priority}
            
        `;

        const agent = await User.findById(ticket.agentId);
        const supervisor = await User.findOne({ function: 'supervisor' });

        if (!agent || !supervisor) {
            req.flash('error', 'Agent or Supervisor not found.');
            return res.redirect('/tickets');
        }

        if (oldStatus !== newStatus) {
            if (req.user.function === 'supervisor') {
                const supervisorEmailText = `
                    Hi ${supervisor.name},

                    You have updated the status of the ticket assigned to Agent ${agent.name}.
                    ${ticketDetails}
                `;

                const agentEmailText = `
                    Hi ${agent.name},

                    The status of your ticket (Code: ${ticket.ticketCode}) has been updated by Supervisor ${req.user.name}.
                    ${ticketDetails}
                `;

                await sendMail(supervisor.email, `Ticket Status Updated: ${ticket.ticketCode}`, supervisorEmailText);
                await sendMail(agent.email, `Ticket Status Updated: ${ticket.ticketCode}`, agentEmailText);
            } else if (req.user.function === 'agent') {
                const agentEmailText = `
                    Hi ${agent.name},

                    You have updated the status of your ticket.
                    ${ticketDetails}
                `;

                const supervisorEmailText = `
                    Hi ${supervisor.name},

                    The status of the ticket (Code: ${ticket.ticketCode}) assigned to Agent ${agent.name} has been updated by Agent ${req.user.name}.
                    ${ticketDetails}
                `;

                await sendMail(agent.email, `Ticket Status Updated: ${ticket.ticketCode}`, agentEmailText);
                await sendMail(supervisor.email, `Ticket Status Updated: ${ticket.ticketCode}`, supervisorEmailText);
            }
        }

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
    const ticketDetails = `
        Ticket Code: ${ticket.ticketCode}
        Status: ${ticket.status}
        Priority: ${ticket.priority}
    `;
    const supervisorEmailText = `
        A new ticket has been created by Agent ${agent.name}.
        Ticket Details:
        ${ticketDetails}
        Please follow up if necessary.
    `;
    const agentEmailText = `
        Hi ${agent.name},
        Your ticket has been successfully created with the following details:
        ${ticketDetails}
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
