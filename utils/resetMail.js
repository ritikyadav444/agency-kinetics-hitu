const nodemailer = require("nodemailer");
const path = require("path");

const resetEmail = async ({ email, subject, message, htmlContent }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_EMAIL,
            pass: process.env.SMPT_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.SMPT_EMAIL,
        to: email,
        subject: subject,
        text: message,
        html: htmlContent,
        attachments: [{
            filename: 'agencyImgTest.png',
            path: path.join(__dirname, "../images/agencyImgTest.png"),
            cid: 'agencyKinetics'
        }]
    };

    await transporter.sendMail(mailOptions);
};

module.exports = resetEmail;
