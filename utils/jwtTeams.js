const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    auth: {
        user: process.env.SMPT_EMAIL,
        pass: process.env.SMPT_PASSWORD
    }

});

const verifyTeam = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.SMPT_EMAIL,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = verifyTeam;