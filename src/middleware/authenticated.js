const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {  
        return next(); 
    } else {
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/login');  // Ensure you return the redirect
    }
};

