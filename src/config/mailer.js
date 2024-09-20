const nodemailer = require('nodemailer');
require('dotenv').config(); // To load environment variables

// Create Mailtrap transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    },
});

// Function to send email
const sendMail = (to, subject, text) => {
    const mailOptions = {
        from: '"Support Team" <support@example.com>', 
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendMail };
