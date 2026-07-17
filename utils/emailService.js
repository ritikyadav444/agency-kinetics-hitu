const nodemailer = require('nodemailer');
const dotenv = require("dotenv").config()
const path = require("path");



async function sendEmail(to, subject, password, workspace_name, createdAt, link, sender_name) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMPT_HOST,
            port: process.env.SMPT_PORT,
            service: process.env.SMPT_SERVICE,
            auth: {
                user: process.env.SMPT_EMAIL,
                pass: process.env.SMPT_PASSWORD
            }
        });
        const logoPath = path.join(__dirname, "../images/agencyImgTest.png");
        const emailContent = `
            <html>
                <head>
                   <style>
                        .card-content {
                            background-color: transparent; /* Ensures no background color */
                            padding: 10px; /* Optional: Add padding if needed */
                        }
                    </style>
                </head>
                <body>
                    <div style="text-align: left;">
                        <div class="card-content">
                            <img src="cid:agencyKinetics" alt="Agency Kinetics Logo" style="max-width: 180px; max-height: 150px; margin-left:10px">
                        </div>

                        <div  style="font-size: 16px;">
                            <div>Hi there!</div>
                            <div style="font-weight:600;color:rgba(203, 145, 47, 1);">${sender_name} has invited you to join their workspace as a client.</div>
                            <div><b>Email</b>: ${to}</div>
                            <div><b>Password</b>: ${password}</div>
                            <div>Workspace Name: ${workspace_name}</div>
                                    <a href="${link}" style="display: inline-block; background-color: #7501D4; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; text-align: center; text-decoration: none; cursor: pointer; margin-top: 10px;">Join your Workspace</a><br>

                            <div style="margin-top: 20px; text-align: left; padding: 20px;">
                            <span><b>What to Expect:</b></span>
                            <div style="margin-top: 10px;">
                                <span>- <b>Manage Projects:</b> View and organize your project details effortlessly.</span><br>
                                <span>- <b>Communicate with Our Team:</b> Use our platform to collaborate and share updates.</span><br>
                                <span>- <b>Track Tasks and Invoices:</b> Stay on top of your tasks and manage invoices seamlessly.</span><br>
                            </div>
                            <div style="margin-top: 20px;">
                                <span>Once you've set up your profile, you’ll be ready to explore the features and start working with us. If you have any questions or need assistance, our support team is here to help.</span>
                            </div>
                            <div style="margin-top: 20px;">
                                <span>We look forward to a successful partnership!</span>
                            </div>
                            <div style="margin-top: 20px;">
                                <span>Best regards,</span><br>
                                <span>${sender_name}</span>
                            </div>
                        </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        let info = await transporter.sendMail({
            from: process.env.SMPT_EMAIL,
            to: to,
            subject: "Your account has been created",
            text: "Welcome",
            html: emailContent,
            attachments: [{
                filename: "agencyImgTest.png",
                path: logoPath,
                cid: "agencyKinetics"
            }]
        });
        console.log('Email sent successfully:', link);
        return info; // Return the info object on success
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Throw the error on failure
    }
}

module.exports = { sendEmail };