// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const homeController = require('../controllers/homeController');
const agentController = require('../controllers/agentController');
const callController = require('../controllers/callController');
const ticketController = require('../controllers/ticketController');

const {validateInputAgents,validateInputEditAgents} = require('../middleware/validationInputAgents');
const {validateInputCalls,validateEditInputCalls} = require('../middleware/validationInputCalls');
const {validateInputTickets,validateEditTickets} = require('../middleware/validationInputTicket');


const isAuthenticated = (req, res, next) => {
      if (req.isAuthenticated()) {
          return next();
      } else {
          req.flash('error', 'You must be logged in to access this page');
          res.redirect('/login');
      }
   };
// Route for rendering the login page
router.get('/login', authController.renderLoginPage);
// Route for handling user login
router.post('/login', passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
  }));
// Route for handling user registration
router.post('/register', authController.registerUser);

// Route for handling user registration
router.get('/register', authController.renderRegisterPage);
// Route for handling user logout
router.get('/logout', authController.logoutUser);

router.use(isAuthenticated);
router.get('/', homeController.renderHome);
router.get('/profile', authController.renderProfile);
router.post('/profile/edit',authController.editProfile);

// ---------- Agents-------------------
router.get('/agents', agentController.getAllAgents);
router.route('/agents/add')
      .get(agentController.addAgent)
      .post(validateInputAgents,agentController.storeAgents);
router.route('/agents/edit/:id')
      .get(agentController.editAgent)
      .put(
           validateInputEditAgents,agentController.updateAgent 
      );
router.get('/agents/view/:id', agentController.viewAgent);
router.delete('/agents/:id', agentController.deleteAgent);
// ----------end Agents-------------------

// ---------- Calls-------------------
router.get('/calls', callController.getAllCalls);
router.route('/calls/add')
      .get(callController.addCall)
      .post(validateInputCalls,callController.storeCall);
router.route('/calls/edit/:id')
      .get(callController.editCall)
      .put(
            validateEditInputCalls,callController.updateCall
      );
router.get('/calls/view/:id', callController.viewCall);      
// ----------end Calls-------------------


// ---------- Tickets-------------------
router.get('/tickets', ticketController.getAllTickets);
router.route('/tickets/add')
      .get(ticketController.addTicket)
      .post(validateInputTickets,ticketController.storeTicket);
router.route('/tickets/edit/:id')
      .get(ticketController.editTicket)
      .put(
            validateEditTickets,ticketController.updateTicket
      );
    
router.get('/tickets/view/:id', ticketController.viewTicket); 
router.post('/tickets/:id/comment', ticketController.addComment); 
router.post('/tickets/:id/comment', ticketController.addComment); 
router.post('/tickets/:id/update-status', ticketController.updateTicketStatus);
// ----------end Tickets-------------------








module.exports = router;
