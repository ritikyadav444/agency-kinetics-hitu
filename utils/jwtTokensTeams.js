const nodeMailer = require("nodemailer");
const dotenv = require("dotenv").config();
const path = require("path");

const verifyTeamMail = async (
  user_email,
  combined_email,
  role,
  link,
  workspace_name,
  sender_name
) => {
  try {
    const transporter = nodeMailer.createTransport({
      host: process.env.SMPT_HOST,
      port: process.env.SMPT_PORT,
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_EMAIL,
        pass: process.env.SMPT_PASSWORD,
      },
    });

    // Construct the email content
    const logoPath = path.join(__dirname, "../images/agencyImgTest.png");
    console.log(logoPath);

    const emailContent = `<html>
        <head>
        </head>
        <body>
            <div style="text-align: left;">
                <div class="card-content">
                    <img src="cid:agencyKinetics" alt="Agency Kinetics Logo" style="max-width: 180px; max-height: 150px; margin-left: 10px ">
                </div>
                <div  style="font-size: 16px;">
                    <div style="margin-top: 20px; text-align: left; padding: 20px;">
                    <span><b>Hey there,</b></span>
                    <div style="margin-top: 10px;">
                <div style="font-weight:600;color:rgba(203, 145, 47, 1);">${sender_name} has invited you to join their workspace on Agency Kinetics as a team member. </div>
                <span>Please click the link below to set up your account and get started:</span><br>
                            <a href="${link}" style="display: inline-block; background-color: #7501D4; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-align: center; text-decoration: none; cursor: pointer; margin-top: 10px;">Join the team</a><br>
                    </div>
                    <div style="margin-top: 8px;">
                        <span>Once you're logged in, you can complete your profile and explore the features that will help us collaborate more effectively.</span>
                    </div>
                    <div style="margin-top: 8px;">
                        <span>Best regards,</span><br>
                        <span>${sender_name}</span>
                    </div>
                </div>
                </div>
            </div>
        </body>
    </html>`;

    // Send the email
    let info = await transporter.sendMail({
      from: process.env.SMPT_EMAIL,
      to: user_email,
      subject: "Join Our Team",
      text: "Welcome",
      html: emailContent,
      attachments: [
        {
          filename: "agencyImgTest.png",
          path: logoPath,
          cid: "agencyKinetics",
        },
      ],
    });

    console.log("Mail sent successfully", link);
  } catch (error) {
    console.log(error, "Mail failed to send");
  }
};

module.exports = verifyTeamMail;
