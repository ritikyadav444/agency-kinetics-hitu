const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const verifyMail = require("../utils/jwtTokens");
const ErrorHander = require('../utils/errorHander');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Token = require("../models/tokenUserModel");
const Combined = require('../models/combinedModel');
const { sendEmail } = require('../utils/emailService');
const verifyTeamMail = require("../utils/jwtTokensTeams");
const resetEmail = require("../utils/resetMail")
const dotenv = require("dotenv");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require('sharp');
const Subscription = require("../models/subscriptionModel");
dotenv.config()

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });

async function createClient(clientData) {
    return Combined.create(clientData);
}


exports.invite = async (req, res, next) => {
    // try {
    
    const isTeamMember = req.body.isTeamMember;
    if (isTeamMember) {
        try {
            const { email, role, workspace_name } = req.body;
            const existingTeam = await Combined.findOne({ email, workspace_name });
            if (existingTeam) {
                return res.status(400).json({ success: false, message: 'Team already exists.' });
            }
            const combinedWorkSpaceName = req.combinedWorkSpaceName
            const SuperFname = req.SuperFname
            const SuperLname = req.SuperLname
            req.body.workspace_name = combinedWorkSpaceName
            req.body.fname = SuperFname
            req.body.lname = SuperLname
            const loggedInUserName = req.SuperFname + ' ' + SuperLname;


            const combinedEmail = req.combinedEmail
            // const combinedWorkSpaceName = req.combinedWorkSpaceName
            // req.body.workspace_name = combinedWorkSpaceName
            // console.log(combinedWorkSpaceName)
            const newTeam = new Combined({
                email: req.body.email,
                role: req.body.role,
                isTeamMember: req.body.isTeamMember,
                workspace_name: req.body.workspace_name,
            });
            const team = await newTeam.save();
            const token = new Token({
                userId: team._id,
                token: crypto.randomBytes(16).toString('hex')
            });
            await token.save();
            // const verificationLink = `https://pr8hejpke8.execute-api.ap-south-1.amazonaws.com/v1/combined/verifyTeam/${token.token}`;
            const verificationLink = `${process.env.FRONTEND_URL}/combined/verifyTeam/${token.token}`;

            


            await verifyTeamMail(email, combinedEmail, role, verificationLink, combinedWorkSpaceName, loggedInUserName);
            res.status(201).json({
                success: true,
                message: 'Team invitation sent successfully.',
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
};


exports.createClient = async (req, res, next) => {
    const isClient = req.body.isClient;

    if (isClient) {
        try {
            const body = req.body;

            const { email } = body;
            body.role = 'CLIENT'
            const SuperFname = req.SuperFname
            const SuperLname = req.SuperLname
            const loggedInUserName = req.SuperFname + ' ' + SuperLname;
            const combinedWorkSpaceName = req.combinedWorkSpaceName
            body.workspace_name = combinedWorkSpaceName
            body.client_createdUnder = combinedWorkSpaceName
            let client = await Combined.findOne({ email, client_createdUnder: combinedWorkSpaceName });
            if (client) {
                return res.status(400).json({ success: false, message: "Client with given workspace already exists!" });
            }
            // console.log(clientData)

            const lastClient = await Combined.findOne({ clientId: { $exists: true, $ne: null } }).sort({ clientId: -1 });
            body.clientId = lastClient && lastClient.clientId ? lastClient.clientId + 1 : 1;
            body.password = req.body.password
            const clientData = body;

            client = await createClient(clientData);

            const token = new Token({
                userId: client._id,
                token: crypto.randomBytes(32).toString('hex'),
            });
            await token.save();

            const emailSubject = 'Account Details';
            const clientLoginLink = `${process.env.FRONTEND_URL}/login?workspace_name=${combinedWorkSpaceName}`;
            

            
            const clientPassword = body.password
            const createdat = client.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            await sendEmail(email, emailSubject, clientPassword, combinedWorkSpaceName, createdat, clientLoginLink, loggedInUserName);

            return res.json({ success: true, message: 'Client registered successfully', combined: client });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};

exports.register = async (req, res, next) => {

    try {
        let userCheck = await Combined.findOne({ email: req.body.email });
        if (userCheck) {
            return res.status(400).json({ success: false, message: "Only one workspace is allowed per email !" });
        }
        let user = await Combined.findOne({ workspace_name: req.body.workspace_name, email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, message: "Only one workspace is allowed per email !" });
        }
        const subscribedOn = new Date();
        const expireOn = new Date();
        expireOn.setDate(subscribedOn.getDate() + 15);  // expireOn is 15 days after subscribedOn

        const days = Math.ceil((expireOn - subscribedOn) / (1000 * 60 * 60 * 24));

        user = new Combined({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            workspace_name: req.body.workspace_name,
            role: req.body.role,
            password: req.body.password,
            workspace_created_on: subscribedOn,

        });
        user = await user.save();
        const token = new Token({
            userId: user._id,
            token: crypto.randomBytes(16).toString('hex')
        });
        await token.save();
        const link = `${process.env.API_URL}/api/v1/combined/confirm/${token.token}`;

        const email = user.email;
        const sName = user.fname + '  ' + user.lname
        const workName = user.workspace_name
        await verifyMail(email, sName, link, workName);
        res.status(201).json({
            token: token,
            success: true,
            message: "Registration successful. Verification email sent.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

exports.verifyTeamEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        const tokenObj = await Token.findOne({ token });
        if (!tokenObj) {
            return res.status(404).json({ success: false, message: 'Token not found.' });
        }

        const team = await Combined.findById(tokenObj.userId);

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }

        const { fname, lname, password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required." });
        }

        // Update team details
        team.fname = fname;
        team.lname = lname;
        team.password = password
        team.verified = true;

        await team.save();

        await Token.findByIdAndDelete(tokenObj._id);
        const jwtToken = team.generateAuthToken();
        res.cookie('jwt', jwtToken, {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true,
        });

        res.status(200).json({
            success: true,
            message: 'Email verified. You are now logged in.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.activateToken = async (req, res, next) => {
    try {
        const token = await Token.findOne({ token: req.params.token });
        if (!token) {
            return res.status(404).json({ success: false, message: "Token not found" });
        }

        await Combined.updateOne({ _id: token.userId }, { $set: { verified: true } });
        await Token.findOneAndDelete({ _id: token._id });

        const user = await Combined.findOne({ _id: token.userId });
        const jwtToken = user.getJWTToken();

        res.cookie('jwt', jwtToken, {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true,
        });

        // res.status(200).json({
        //     success: true,
        //     message: "Email verified. You are now logged in.",
        //     isVerified: true

        // });
        res.redirect(`${process.env.FRONTEND_URL}/login?workspace_name=${user.workspace_name}`)



    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred");
    }
};

// exports.loginCombined = async (req, res, next) => {
//     const { email, password, workspace_name, verified, role } = req.body;
//     console.log("bodyLC", req.body)
//     try {
//         if (!email || !password || !workspace_name) {
//             return next(new ErrorHander("Please Enter Email, Password, and Workspace Name", 400));
//         }
//         const userByEmail = await Combined.findOne({ email }).select("+password");
//         if (!userByEmail) {
//             return next(new ErrorHander("Invalid Email", 401));
//         }
//         const user = await Combined.findOne({ email, workspace_name }).select("+password");
//         if (!user) {
//             return next(new ErrorHander("Workspace does not exist", 404));
//         }
//         const isPasswordMatched = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatched) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid Password!",
//             });
//         }

//         if (user.role === 'SUPERADMIN' && !user.verified) {
//             return next(new ErrorHander("Please Verify First", 400));
//         }

//         const jwtToken = user.getJWTToken();
//         console.log("CC", { 'Authorization': `Bearer ${jwtToken}` });

//         res.setHeader('Authorization', `Bearer ${jwtToken}`);
//         res.status(200).json({
//             success: true,
//             message: "Login successful.",
//             token: jwtToken,
//             user
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Internal Server Error");
//     }
// };

exports.loginCombined = async (req, res, next) => {
    const { email, password, workspace_name } = req.body;

    try {
        if (!email || !password || !workspace_name) {
        return next(new ErrorHander("Please enter all required fields", 400));
    }

    const user = await Combined.findOne({ email, workspace_name }).select("+password");

    if (!user) {
        const workspaceExists = await Combined.findOne({ workspace_name }, { _id: 1 }).lean();
        if (!workspaceExists) {
            return res.status(404).json({ success: false, message: "Workspace does not exist" });
        }
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

        if (user.role === 'SUPERADMIN') {
            if (!user.verified) {
                return next(new ErrorHander("Please Verify First", 400));
            }

            // Create trial subscription on first login only — cron owns all subsequent updates
            const existing = await Subscription.findOne({ userId: user._id });
            if (!existing) {
                const currentDate = new Date();
                await Subscription.create({
                    userId: user._id,
                    plans: [{
                        subscribedOn: currentDate,
                        expireOn: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000),
                        status: "trial",
                        maxTeamMembers: 3,
                        days: 15
                    }],
                    totalDaysLeft: 15,
                    workspace_name
                });
            }
        }

        const jwtToken = user.getJWTToken();
        const cookieExpireMs = 4 * 60 * 60 * 1000;

        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: cookieExpireMs,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            expiresAt: Date.now() + cookieExpireMs,
            user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};




exports.logoutCombined = async (req, res, next) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ success: true, message: "Logged Out" });
};

exports.getSuperAdminIdByWorkspace = async (req, res, next) => {
    try {
        const workspace_name = req.params.workspace_name;
        const combined = await Combined.findOne({ workspace_name, role: "SUPERADMIN" });

        if (!combined) {
            return res.status(404).json({ success: false, message: "SuperAdmin not found for this workspace" });
        }

        res.status(200).json({
            success: true,
            superadmin: combined
        });
    } catch (error) {
        console.error("Error fetching superadmin ID:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch superadmin ID" });
    }
};

exports.getAllUnderOne = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const combined = await Combined.find({ workspace_name: combinedWorkSpaceName })
    res.status(200).json({
        success: true,
        combined
    })
}

exports.getAllExceptClient = async (req, res, next) => {
    const combinedId = req.combinedId;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'PROJECTMANAGER', 'ASSIGNEE'];
    const combined = await Combined.find({ role: { $in: allowedRoles }, workspace_name: combinedWorkSpaceName });
    res.status(200).json({
        success: true,
        combined
    })
}

exports.getAllExceptClientForOthers = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'PROJECTMANAGER', 'ASSIGNEE'];

    try {
        
        const combined = await Combined.find(
            { role: { $in: allowedRoles }, workspace_name: combinedWorkSpaceName }, 
            '_id fname lname' 
        ).lean()

        res.status(200).json({
            success: true,
            combined
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving users.',
        });
    }
};

exports.getAllExceptClientForDashboard = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'PROJECTMANAGER', 'ASSIGNEE'];

    try {
        const combined = await Combined.find(
            { role: { $in: allowedRoles }, workspace_name: combinedWorkSpaceName },
            '_id fname lname profile_img role verified'
        ).lean();
        const verifiedCombined = combined.filter(team => team.verified === true);
        res.status(200).json({
            success: true,
            combined: verifiedCombined
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving user data.',
        });
    }
};



exports.getAllSuperAdmin = async (req, res, next) => {
    const combinedId = req.combinedId;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const combined = await Combined.find({ role: 'SUPERADMIN', workspace_name: combinedWorkSpaceName })
    res.status(200).json({
        success: true,
        combined
    })
}
exports.getAllTeam = async (req, res, next) => {
    const combinedId = req.combinedId;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const allowedRoles = ['ADMIN', 'PROJECTMANAGER', 'ASSIGNEE'];
    const combined = await Combined.find({ role: { $in: allowedRoles }, workspace_name: combinedWorkSpaceName });
    res.status(200).json({
        success: true,
        combined
    })
}

exports.getTeamDetails = catchAsyncErrors(async (req, res, next) => {
    const combined = await Combined.findById(req.params.id);
    if (!combined) {
        return next(new ErrorHander("Team not foundaas", 404));
    }
    res.status(200).json({
        success: true,
        combined,
    });
});

exports.getAllClient = async (req, res, next) => {
    const combinedId = req.combinedId;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;

    try {
        const combined = await Combined.find({ role: 'CLIENT', workspace_name: combinedWorkSpaceName })
                                       .sort({ _id: -1 });

        res.status(200).json({
            success: true,
            combined
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getAllClientForOthers = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;

    try {
        const clients = await Combined.find(
            { role: 'CLIENT', workspace_name: combinedWorkSpaceName }, 
            '_id fname lname' 
        ).lean()

        res.status(200).json({
            success: true,
            clients 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving clients.',
        });
    }
};


//get team details
exports.getClientDetails = catchAsyncErrors(async (req, res, next) => {
    const combined = await Combined.findById(req.params.id);
    if (!combined) {
        return next(new ErrorHander("Client not found", 404));
    }
    res.status(200).json({
        success: true,
        combined,
    });
});

//delete members
exports.deleteMembers = async (req, res, next) => {
    try {
        const combined = await Combined.findOne({ _id: req.params.id, workspace_name: req.combinedWorkSpaceName });
        if (!combined) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        const memberRole = combined.role;

        if (memberRole === 'SUPERADMIN') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete a member with superAdmin role."
            });
        }

        await Combined.deleteOne({ _id: req.params.id });
        res.status(200).json({
            success: true,
            message: "Member deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


//update userDetails
exports.updateUserLoggedIn = async (req, res, next) => {
    let combined = await Combined.findById(req.params.id)
    if (!combined) {
        return res.status(500).json({
            success: false,
            message: "User Not Found"
        })
    }
    const oldProfile = combined.profile_img

    if (req.body.profile_img != undefined && req.body.profile_img != null && Object.keys(req.body.profile_img).length !== 0) {
        const base64String = req.body.profile_img.url
        const img_name = req.body.profile_img.name

        const buffer = Buffer.from(base64String.split(",")[1], 'base64');

        try {
            const compressedBuffer = await sharp(buffer)
                .resize(800) // Resize to width 800px, maintaining aspect ratio
                .jpeg({ quality: 80 }) // Convert to JPEG format with 80% quality
                .toBuffer();

            const fileName = `${img_name.toLowerCase()}_${Date.now()}.jpeg`;
            const params = {
                Bucket: process.env.BUCKET,
                Key: `${process.env.DEV}/${combined._id}/profileImage/${fileName}`,
                Body: compressedBuffer,
                ContentType: 'image/jpeg',

            };
            const command = new PutObjectCommand(params);
            const response = await s3Client.send(command);

            const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

            // console.log(response);

            req.body.profile_img = s3Url;

        } catch (error) {
            console.error(error);
            res.status(500).send('Error uploading image.');
        }
    }
    if (req.body.profile_img == null || Object.keys(req.body.profile_img).length === 0 || req.body.profile_img == undefined) {
        req.body.profile_img = oldProfile
    }



    const oldlogo = combined.company_img

    if (req.body.company_img != undefined && req.body.company_img != null && Object.keys(req.body.company_img).length !== 0) {
        const base64String = req.body.company_img.url
        const img_name = req.body.company_img.name

        const buffer = Buffer.from(base64String.split(",")[1], 'base64');

        try {
            const compressedBuffer = await sharp(buffer)
                .resize(800) // Resize to width 800px, maintaining aspect ratio
                .jpeg({ quality: 80 }) // Convert to JPEG format with 80% quality
                .toBuffer();

            const fileName = `${img_name.toLowerCase()}_${Date.now()}.jpeg`;
            const params = {
                Bucket: process.env.BUCKET,
                Key: `${process.env.DEV}/${combined._id}/companyLogo/${fileName}`,
                Body: compressedBuffer,
                ContentType: 'image/jpeg',

            };
            const command = new PutObjectCommand(params);
            const response = await s3Client.send(command);

            const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

            // console.log(response);

            req.body.company_img = s3Url;

        } catch (error) {
            console.error(error);
            res.status(500).send('Error uploading image.');
        }
    }
    if (req.body.company_img == null || Object.keys(req.body.company_img).length === 0 || req.body.company_img == undefined) {
        req.body.company_img = oldlogo
    }


    delete req.body.password;
    combined = await Combined.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        usefindAndModify: false
    });
    res.status(200).json({
        success: true,
        combined
    })
}

//update client
exports.updateClient = async (req, res, next) => {
    let client = await Combined.findById(req.params.id)


    if (!client) {
        return res.status(500).json({
            success: false,
            message: "Client Not Found"
        })
    }
    delete req.body.password;
    client = await Combined.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        usefindAndModify: false
    });
    res.status(200).json({
        success: true,
        client
    })
}

//update team member
exports.updateTeam1 = async (req, res, next) => {
    let combined = await Combined.findById(req.params.id)

    if (!combined) {
        return res.status(500).json({
            success: false,
            message: "Team Member Not Found"
        })
    }
    combined.role = req.body.role;
    if (req.body.role === "") {
        combined.changeAt = Date.now()
    }
    await combined.save({ validateBeforeSave: false });
    res.status(200).json({
        success: true,
        combined
    })
}


//change password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const combined = await Combined.findById(req.combined.id).select("+password");
    const isPasswordMatched = await combined.comaprePassword(req.body.oldPassword)
    if (!isPasswordMatched) {
        res.status(401).json({
            success: false,
            message: "Incorrect Old Password"
        })
        return next(new ErrorHander("Old password is incorrect", 400));
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        res.status(401).json({
            success: false,
            message: "Password does not match"
        })
        return next(new ErrorHander("Password does not match", 400));
    }
    combined.password = req.body.newPassword;
    await combined.save();
    res.status(200).json({
        success: true,
        combined
    })
});


// forgot password
// reset password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const combined = await Combined.findOne({ email: req.body.email, workspace_name: req.body.workspace_name });
    if (!combined) {
        return next(new ErrorHander("Combined Not Found", 404));
    }

    const resetToken = combined.getResetPasswordToken();
    await combined.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const htmlContent = `
         <html>
            <body>
                <div style="font-family: Arial, sans-serif; text-align: left;" >
                    <img src="cid:agencyKinetics" alt="Agency Kinetics Logo" style="max-width: 180px; max-height: 150px; margin-left: 10px;"><br><br>
                    <b >Reset your password</b>
                    <p>You told us you forgot your password. If you really did, click here to choose a new one:</p>
                    <a href="${resetPasswordUrl}" style="display: inline-block; background-color: #7501D4; color: white; padding: 10px 20px; border: none; border-radius: 5px;  text-align: center; text-decoration: none; cursor: pointer; margin-top: 10px;">Reset Password</a><br>
                    <p>If you didn't mean to reset your password, then you can just ignore this email.</p>
                    <p>If you have any questions, we're happy to help. Please reach out to us at <a href="mailto:support@agencykinetics.com">support@agencykinetics.com</a></p>
                    <p>Thanks,<br>Agency Kinetics Team</p>
                </div>
            </body>
        </html>
    `;
    try {
        await resetEmail({
            email: combined.email,
            subject: 'Reset your Password - Agency Kinetics',
            htmlContent
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${combined.email} successfully`,
        });
    } catch (error) {
        combined.resetPasswordToken = undefined;
        combined.resetPasswordExpire = undefined;
        await combined.save({ validateBeforeSave: false });
        return next(new ErrorHander(error.htmlContent, 500));
    }
});

//reset password

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.resetToken)
        .digest("hex");
    const combined = await Combined.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!combined) {
        return next(
            new ErrorHander(
                "Reset Password Token is invalid or has been expired",
                400,
            )
        );
    }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHander("Password does not password", 400));
    }
    combined.password = req.body.password;
    combined.resetPasswordToken = undefined;
    combined.resetPasswordExpire = undefined;
    await combined.save();
    res.status(200).json({
        success: true,
        combined
    })
});