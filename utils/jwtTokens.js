const nodeMailer = require("nodemailer");
const dotenv = require("dotenv").config();
const path = require("path");


const verifyMail = async (user_email, sName, link, workName) => {
    try {
        const transporter = nodeMailer.createTransport({
            host: process.env.SMPT_HOST,
            port: process.env.SMPT_PORT,
            service: process.env.SMPT_SERVICE,
            auth: {
                user: process.env.SMPT_EMAIL,
                pass: process.env.SMPT_PASSWORD
            }
        });
        console.log(process.env.SMPT_EMAIL, user_email, link, sName);

        // Send mail
        const logoPath = path.join(__dirname, "../images/agencyImgTest.png");
        console.log(logoPath)
        const emailContent = `
            <html>
                <head>
                </head>
                <body>
                    <div style="text-align: left;">
                        <div class="card-content">
                            <img src="cid:agencyKinetics" alt="Agency Kinetics Logo" style="max-width: 180px; max-height: 150px; margin-left:10px">
                        </div>

                        <div  style="font-size: 16px;">
                            <div style="margin-top: 20px; text-align: left; padding: 20px;">
                                <span><b>Hello ${sName},</b></span>
                                <div style="margin-top: 10px;">
                                    <span>Welcome to <b>${workName}</b> on Agency Kinetics. To activate your account, please verify your email address by clicking the link below::</span><br>
                                    <a href="${link}" style="display: inline-block; background-color: #7501D4; color: white; padding: 10px 20px; border: none; border-radius: 5px;  text-align: center; text-decoration: none; cursor: pointer; margin-top: 10px;">Confirm Email Address</a><br>
                                </div>
                                <div style="margin-top: 8px;">
                                    <span>If you have any questions, don’t hesitate to reach out to our support team.</span>
                                </div>
                                <div style="margin-top: 8px;">
                                    <span>Thank You</span><br>
                                    <span>Agency Kinetics Team</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        let info = await transporter.sendMail({
            from: process.env.SMPT_EMAIL,
            to: user_email,
            subject: "Verify your email - Agency Kinetics",
            text: "Welcome",
            html: emailContent,
            attachments: [{
                filename: "agencyImgTest.png",
                path: logoPath,
                cid: "agencyKinetics"
            }]
        });
        console.log("Mail sent successfully", link);
    } catch (error) {
        console.log(error, "mail failed to send");
    }
};

module.exports = verifyMail;