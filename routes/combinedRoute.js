const express = require('express');
const { activateToken, verifyTeamEmail, loginCombined, getAllClient, getAllSuperAdmin, getAllTeam, logoutCombined, register, invite, createClient, deleteMembers, getAllUnderOne, updateClient, getClientDetails, updateTeam1, getTeamDetails, updatePassword, forgotPassword, resetPassword, getAllExceptClient, updateUserLoggedIn, getSuperAdminIdByWorkspace, getAllClientForOrders, getAllExceptClientForOrders, getAllClientForOthers, getAllExceptClientForOthers, getAllExceptClientForDashboard } = require('../controller/combinedController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authentication');
const { signupValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, inviteTeamValidator, createClientValidator } = require('../middleware/validators');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();


// router.route("/combined/newUser").post(register);
router.route("/signup").post(signupValidator, register);

router.route("/combined/confirm/:token").get(activateToken)
router.route("/combined/newTeam").post(isAuthenticatedUser, inviteTeamValidator, invite, authorizeRoles('SUPERADMIN'));
router.route("/combined/newClient").post(isAuthenticatedUser, createClientValidator, createClient, authorizeRoles('SUPERADMIN'));
router.route("/combined/getAllClient").get(isAuthenticatedUser, getAllClient)
router.route("/combined/getAllClientForOthers").get(isAuthenticatedUser, getAllClientForOthers)

router.route("/client/update/:id").put(upload.single('profile_img'), isAuthenticatedUser, updateClient)
router.route("/get/client/:id").get(isAuthenticatedUser, getClientDetails)
router.route("/getAll").get(isAuthenticatedUser, getAllUnderOne)
router.route("/getAllExceptClient").get(isAuthenticatedUser, getAllExceptClient)
router.route("/getAllExceptClientForOthers").get(isAuthenticatedUser, getAllExceptClientForOthers)
router.route("/getAllExceptClientForDashboard").get(isAuthenticatedUser, getAllExceptClientForDashboard)


router.route("/combined/getAllSuperAdmin").get(isAuthenticatedUser, getAllSuperAdmin)
router.route("/combined/verifyTeam/:token").put(verifyTeamEmail)
router.route("/combined/getAllTeam").get(isAuthenticatedUser, getAllTeam)
router.route("/team/update/:id").put(upload.single('profile_img'), isAuthenticatedUser, updateTeam1)
router.route("/get/team/:id").get(isAuthenticatedUser, getTeamDetails)
router.route("/member/delete/:id").delete(isAuthenticatedUser, deleteMembers)
// router.route("/combined/login").post(loginCombined);
router.route("/login").post(loginValidator, loginCombined);

router.route("/combined/logout").get(logoutCombined);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/password/forgot").post(forgotPasswordValidator, forgotPassword);
router.route("/password/reset/:resetToken").put(resetPasswordValidator, resetPassword);
router.route("/combined/updateUserLoggedIn/:id").put(upload.fields([
    { name: 'profile_img', maxCount: 1 },
    { name: 'company_img', maxCount: 1 }
  ]), isAuthenticatedUser, updateUserLoggedIn);
router.route("/combined/superAdminId/:workspace_name").get(isAuthenticatedUser, getSuperAdminIdByWorkspace);



module.exports = router