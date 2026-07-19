

const { isAuthenticatedUser } = require("../middleware/authentication");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Service = require("../models/serviceModel");
const ErrorHander = require("../utils/errorHander");
// const AWS = require("aws-sdk")
const dotenv = require("dotenv");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require('sharp');
dotenv.config()

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });


exports.createService = (async (req, res, next) => {
    let copiedServices;
    const combinedWorkSpaceName = req.combinedWorkSpaceName
    copiedServices = await Service.find({ workspace_name: combinedWorkSpaceName }).sort({ service_createdAt: -1 });
    
    try{
        const combinedId = req.combinedId
        req.body.service_createdBy = combinedId
        req.body.workspace_name = combinedWorkSpaceName
        console.log(combinedId)
        console.log(combinedWorkSpaceName)
        var base64String;
        var img_name;

        if (req.body.service_cover_img != null && req.body.service_cover_img!= undefined){
            base64String = req.body.service_cover_img.url
            img_name = req.body.service_cover_img.name
            // Convert base64 string to buffer
            const buffer = Buffer.from(base64String.split(",")[1], 'base64');
            try {
                // Compress the image using sharp
                const compressedBuffer = await sharp(buffer)
                    .resize(800) // Resize to width 800px, maintaining aspect ratio
                    .jpeg({ quality: 80 }) // Convert to JPEG format with 80% quality
                    .toBuffer();

                const fileName = `${img_name.toLowerCase()}_${Date.now()}.jpeg`;

                const params = {
                    Bucket: process.env.BUCKET,
                    Key: `${process.env.DEV}/${combinedId}/services/${fileName}`,
                    Body: compressedBuffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read',
                };

                const command = new PutObjectCommand(params);
                const response = await s3Client.send(command);

                const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

                console.log(response);
                console.log(s3Url);

                req.body.service_cover_img = s3Url;
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image.',
                    services: copiedServices
                });
            }
        }
    if (req.body.service_cover_img == null){
        req.body.service_cover_img = null
    }
    const service = await Service.create(req.body);
    console.log("service", service)
    res.status(201).json({
        success: true,
        service,
    })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error creating service',
            services: copiedServices
        });
    }
    
});



//getAll
exports.getAllServices = async (req, res, next) => {
    let copiedServices;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedServices = await Service.find({ workspace_name: combinedWorkSpaceName, service_publish: true }).sort({ service_createdAt: -1 });
    try {
        const combinedId = req.combinedId;
        console.log("getAll service", combinedId, combinedWorkSpaceName);

        const services = await Service.find({ workspace_name: combinedWorkSpaceName, service_publish: true }).sort({ service_createdAt: -1 });
        
        res.status(200).json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Error retrieving services:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving services.',
            services: copiedServices
        });
    }
};


exports.getServiceDetailsForOthers = async (req, res, next) => {
    try {
        const combinedWorkSpaceName = req.combinedWorkSpaceName; 

        const services = await Service.find(
            { workspace_name: combinedWorkSpaceName, service_publish: true },
            '_id service_name'
        ).lean();

        res.status(200).json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Error retrieving services:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving services.',
        });
    }
};

exports.getServiceDetailsForInvoices = async (req, res, next) => {
    try {
        const combinedWorkSpaceName = req.combinedWorkSpaceName; 

        const services = await Service.find(
            { workspace_name: combinedWorkSpaceName, service_publish: true },
            '_id service_name currency'
        ).lean();

        res.status(200).json({
            success: true,
            services
        });
    } catch (error) {
        console.error('Error retrieving services:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving services.',
        });
    }
};


//get service details
exports.getServiceDetails = async (req, res, next) => {
    let copiedServices;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedServices = await Service.find({ workspace_name: combinedWorkSpaceName }).sort({ service_createdAt: -1 });

    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
                services: copiedServices
            });
        }
        res.status(200).json({
            success: true,
            service,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving service details',
            services: copiedServices
        });
    }
};

//update service
exports.updateService = async (req, res, next) => {
    let copiedServices;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedServices = await Service.find({ workspace_name: combinedWorkSpaceName }).sort({ service_createdAt: -1 });

    try{
        let service = await Service.findById(req.params.id)
        if (!service) {
            return res.status(500).json({
                success: false,
                message: "Service Not Found",
                services: copiedServices
            })
        }
        // console.log("file", req.file)
        const oldCoverImg = service.service_cover_img

        if (req.body.service_cover_img != null && req.body.service_cover_img != undefined && Object.keys(req.body.service_cover_img).length !== 0){

            const base64String = req.body.service_cover_img.url
            const img_name = req.body.service_cover_img.name

            const buffer = Buffer.from(base64String.split(",")[1], 'base64');
            try {
                const compressedBuffer = await sharp(buffer)
                    .resize(800) // Resize to width 800px, maintaining aspect ratio
                    .jpeg({ quality: 80 }) // Convert to JPEG format with 80% quality
                    .toBuffer();

                const fileName = `${img_name.toLowerCase()}_${Date.now()}.jpeg`;
                const created_by = service.service_createdBy
                const params = {
                    Bucket: process.env.BUCKET,
                    Key: `${process.env.DEV}/${created_by}/services/${fileName}`,
                    Body: compressedBuffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read',
                };

                const command = new PutObjectCommand(params);
                const response = await s3Client.send(command);

                const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

                console.log(response);
                console.log(s3Url);

                service.service_cover_img = s3Url;


            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image.',
                    services: copiedServices
                });
            }
        }
        if (req.body.service_cover_img == null ||  Object.keys(req.body.service_cover_img).length === 0 || req.body.service_cover_img == undefined){
            service.service_cover_img = oldCoverImg
        }
        service.service_name = req.body.service_name;
        // service.service_amount = req.body.service_amount;
        service.service_desc = req.body.service_desc;
        service.service_pricing_type = req.body.service_pricing_type;
        service.value = req.body.value;
        service.unit = req.body.unit;
        service.currency = req.body.currency;

        // Ensure service_amount is initialized as an object
        if (!service.service_amount) {
            service.service_amount = {}; // Initialize service_amount if it's not already an object
        }

        // Set service amount min and max
        service.service_amount.min = req.body.service_amount?.min || 1;
        service.service_amount.max = req.body.service_amount?.max || 100000;

        await service.save();
        return res.status(200).json({
            success: true,
            service
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating service',
            services: copiedServices
        });
    }
    
}


//delete service
exports.deleteService = async (req, res, next) => {
    let copiedServices;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedServices = await Service.find({ workspace_name: combinedWorkSpaceName }).sort({ service_createdAt: -1 });

    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
                services: copiedServices
            });
        }

        await service.deleteOne();
        res.status(200).json({
            success: true,
            message: "Service deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error deleting service',
            services: copiedServices
        });
    }
};