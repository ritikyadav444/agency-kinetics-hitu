const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Quote = require("../models/quoteModel");
const ErrorHander = require("../utils/errorHander");
const Service = require("../models/serviceModel");
const dotenv = require("dotenv");
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Combined = require("../models/combinedModel");
dotenv.config()
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });

exports.createQuote = (async (req, res, next) => {
    let copiedQuotes;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedQuotes = await Quote.find({ workspace_name: combinedWorkSpaceName }).sort({quoteId: -1});

    try {
        const body = req.body
        const servicePresent = await Service.exists({ _id: body.serviceId });
        const combinedId = req.combinedId
        body.createdBy = combinedId
        body.workspace_name = combinedWorkSpaceName
        body.serviceId = req.body.serviceId

        console.log(combinedId)
        console.log(combinedWorkSpaceName)
        // console.log(req.file)
        const clientPresentInCombined = await Combined.exists({ _id: body.clientId })
        if (!clientPresentInCombined) {
            return res.status(400).json({
                success: false,
                message: 'Client not found. Unable to create the proposal.',
                quotes: copiedQuotes 
            });
        }

        
        if (req.body.attachment != null && req.body.attachment != undefined){
            const attachment = req.body.attachment
            if (!attachment || !attachment.url || !attachment.name) {
                body.attachment = null;
            }
            const buffer = Buffer.from(attachment.url.split(",")[1], 'base64');
            try {
                const contentType = attachment.type;
                const filename = attachment.name
                const params = {
                    Bucket: process.env.BUCKET,
                    Key: `${process.env.DEV}/${combinedId}/proposals/${filename.toLowerCase()}`,
                    Body: buffer,
                    ContentType: contentType,
                    ACL: 'public-read',
                };

                const command = new PutObjectCommand(params);
                const response = await s3Client.send(command);

                const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

                // console.log(response);
                console.log(s3Url);

                body.attachment = s3Url;


            } catch (error) {
                console.error(error);
                res.status(500).json({
                    success: false,
                    message: 'Error uploading file',
                    quotes: copiedQuotes
                })
            }

            if (!servicePresent) {
                return res.status(400).json({
                    success: false,
                    message: 'Service not found. Unable to create the order.'
                });
            }
        }
        if (req.body.attachment == null){
            body.attachment = null;
        }

        console.log('--------------CreateQuote--------------');
        // Generate quoteId for the specific `workspace_name`
        const lastQuote = await Quote.findOne(
            { workspace_name: body.workspace_name }, // Filter by workspace_name
            {},
            { sort: { quoteId: -1 } }
        );
        body.quoteId = lastQuote ? lastQuote.quoteId + 1 : 1;

        // Create the quote
        const quote = await Quote.create(body);

        res.status(201).json({
            success: true,
            quote,
        });
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating quote.',
            quotes: copiedQuotes 
        });
    }
});


//getAll
exports.getAllQuotes = async (req, res) => {
    let copiedQuotes;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedQuotes = await Quote.find({ workspace_name: combinedWorkSpaceName }).sort({quoteId: -1});
    
    try {
        const quotes = await Quote.find({ workspace_name: combinedWorkSpaceName }).sort({quoteId: -1});
        res.status(200).json({
            success: true,
            quotes
        });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching quotes.',
            quotes: copiedQuotes
        });
    }
};


exports.getQuoteDetails = async (req, res, next) => {
    let copiedQuotes;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedQuotes = await Quote.find({ workspace_name: combinedWorkSpaceName }).sort({quoteId: -1});

    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
                quotes: copiedQuotes // Send copied quotes in case of failure
            });
        }

        res.status(200).json({
            success: true,
            quote
        });
        console.log(quote);
    } catch (error) {
        console.error('Error fetching quote details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            quotes: copiedQuotes // Send copied quotes in case of error
        });
    }
};



//update quote
exports.updateQuote = async (req, res, next) => {
    let copiedQuotes;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedQuotes = await Quote.find({ workspace_name: combinedWorkSpaceName }).sort({quoteId: -1});
    
    try{
        let quote = await Quote.findById(req.params.id)

        if (!quote) {
            return res.selected(500).json({
                success: false,
                message: "Quote Not Found",
                quotes: copiedQuotes

            })
        }
        const combinedId = req.combinedId
        const old = quote.attachment
        console.log(req.body, quote.attachment)

        // console.log("********", req.body.attachment)
        if (req.body.attachment != null && req.body.attachment != undefined && Object.keys(req.body.attachment).length !== 0){
            const attachment = req.body.attachment
            if (!attachment || !attachment.url || !attachment.name) {
                req.body.attachment = null;
            }
            const buffer = Buffer.from(attachment.url.split(",")[1], 'base64');
            try {
                const contentType = attachment.type;
                const filename = attachment.name
                const params = {
                    Bucket: process.env.BUCKET,
                    Key: `${process.env.DEV}/${combinedId}/proposals/${filename.toLowerCase()}`,
                    Body: buffer,
                    ContentType: contentType,
                    ACL: 'public-read',
                };

                const command = new PutObjectCommand(params);
                const response = await s3Client.send(command);

                const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

                // console.log(response);
                console.log(s3Url);

                req.body.attachment = s3Url;
                console.log("****", quote)

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    success: false,
                    message: 'Error uploading file',
                    quotes: copiedQuotes
                });
            }
        }
        if (req.body.attachment == null||  Object.keys(req.body.attachment).length === 0 || req.body.attachment == undefined){
            req.body.attachment = old;
        }

        
        if (quote.selected === "Accepted") {
            return next(new ErrorHander("You have Accepted This Quote"))
        }
        if (quote.selected === "Rejected") {
            return next(new ErrorHander("You have Rejected This Quote"))
        }
        quote.selected = req.body.selected;
        if (req.body.selected === "") {
            quote.createdAt = Date.now()
        }

        quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            usefindAndModify: false
        });
        console.log(quote)
        res.status(200).json({
            success: true,
            quote
        })
    } catch (error) {
        console.error('Error updating quote:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating quote.',
            quotes: copiedQuotes
        });
    }
}

//delete quote
exports.deleteQuote = async (req, res, next) => {
    let copiedQuotes;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    copiedQuotes = await Quote.find({ workspace_name: combinedWorkSpaceName }).sort({quoteId: -1});

    try {
        const quote = await Quote.findById(req.params.id);

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: "Quote not found",
                quotes: copiedQuotes // Send copied quotes in case of failure
            });
        }

        await quote.deleteOne();
        res.status(200).json({
            success: true,
            message: "Quote deleted successfully",
            
        });
    } catch (error) {
        console.error('Error deleting quote:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            quotes: copiedQuotes // Send copied quotes in case of error
        });
    }
};
