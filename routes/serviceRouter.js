const express = require('express');
const { getAllServices, createService, updateService, deleteService, getServiceDetails, getServiceDetailsForOthers, getServiceDetailsForInvoices } = require('../controller/serviceController');
const { authorizeRoles, isAuthenticatedClient, isAuthenticatedUser, authorizeRolesClient, } = require("../middleware/authentication");
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/services").get(isAuthenticatedUser, getAllServices);
router.route("/services/client").get(isAuthenticatedUser, getAllServices);
router.route("/get/service/:id").get(isAuthenticatedUser, getServiceDetails);
router.route("/get/servicesForOthers").get(isAuthenticatedUser, getServiceDetailsForOthers);
router.route("/get/servicesForInvoices").get(isAuthenticatedUser, getServiceDetailsForInvoices);


router.route("/new/service").post(upload.single('service_cover_img'), isAuthenticatedUser, createService);

router.route("/service/delete/:id").delete(isAuthenticatedUser, deleteService)
router.route("/service/update/:id").put(upload.single('service_cover_img'), isAuthenticatedUser, updateService)
module.exports = router