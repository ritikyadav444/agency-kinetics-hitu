const catchAsyncErrors = require("./catchAsyncErrors");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const ErrorHander = require("../utils/errorHander");
const Client = require("../models/clientModel");
const Combined = require("../models/combinedModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const userToken = req.cookies.token;

    if (!userToken) {
        return next(new ErrorHander("Please login to access this resource", 401));
    }
    try {
        const decodedData = jwt.verify(userToken, process.env.JWT_SECRET);
        req.combined = await Combined.findById(decodedData.id);

        req.combinedId = req.combined._id;
        req.combinedEmail = req.combined.email;
        req.combinedWorkSpaceName = req.combined.workspace_name;
        req.SuperFname = req.combined.fname;
        req.SuperLname = req.combined.lname
        // console.log("Id and workspace name from auth", req.combined._id, req.combined.workspace_name, req.combined.fname, req.combined.lname)


        next();
    } catch (error) {
        return next(new ErrorHander("Invalid Token. Please Login again", 401));
    }
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.combined.role)) {
            return next(
                new ErrorHander(
                    `Role: ${req.combined.role} is not allowed to access this resouce `,
                    403
                )
            );
        }
        next();
    };
};

// exports.authorizeRolesClient = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.client.role)) {
//             return next(
//                 new ErrorHander(
//                     `Role: ${req.client.role} is not allowed to access this resouce `,
//                     403
//                 )
//             );
//         }
//         next();
//     };
// };