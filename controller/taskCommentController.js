const TaskComment = require("../models/taskCommentModel");
const Combined = require('../models/combinedModel')
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHander = require("../utils/errorHander");
const Task = require("../models/taskModel");
const dotenv = require("dotenv");
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
dotenv.config()


const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });

async function handleImage(attachment, taskId, combinedId) {
    if (!attachment) {
        throw new Error('No image provided.');
    }

    const base64String = attachment.url
    const img_name = attachment.name.split('.').slice(0, -1).join('.');
    const type = attachment.type

    // Convert base64 string to buffer
    const buffer = Buffer.from(base64String.split(",")[1], 'base64');
    try {
        const compressedBuffer = await sharp(buffer)
            .resize(800) // Resize to width 800px, maintaining aspect ratio
            .jpeg({ quality: 80 }) // Convert to JPEG format with 80% quality
            .toBuffer();

        const fileName = `${img_name.toLowerCase()}.jpeg`;

        // Upload the compressed image to S3
        const params = {
            Bucket: process.env.BUCKET,
            Key: `${process.env.DEV}/${combinedId}/taskComment/${taskId}/${fileName}`,
            Body: compressedBuffer,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
        };

        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);

        // Generate the S3 URL
        const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

        console.log(s3Url, fileName);

        return {s3Url, fileName};
    } catch (error) {
        console.error(error);
        throw new Error('Error uploading image.');
    }
}


async function handleDocuments(attachment, taskId, combinedId) {
    if (!attachment) {
        throw new Error('No document provided.');
    }

    const base64String = attachment.url
    const img_name = attachment.name.split('.').slice(0, -1).join('.');
    const type = attachment.type

    // Convert base64 string to buffer
    const buffer = Buffer.from(base64String.split(",")[1], 'base64');
    try {
        const contentType = attachment.type;
        const fileName = attachment.name
        const params = {
            Bucket: process.env.BUCKET,
            Key: `${process.env.DEV}/${combinedId}/taskComment/${taskId}/${fileName}`,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
        };

        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);

        // Generate the S3 URL
        const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

        console.log(s3Url);

        return {s3Url, fileName};
    } catch (error) {
        console.error(error);
        throw new Error('Error uploading document.');
    }
}


exports.createComment = async (req, res, next) => {
    try {
        const combinedId = req.combinedId;
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        req.body.createdBy = combinedId;
        req.body.workspace_name = combinedWorkSpaceName;
        var taggedUserIds = req.body.taggedUsers || [];
        if (Object.keys(taggedUserIds).length === 0) {
            req.body.taggedUsers = [];
        } else {
            const taggedUsers = await Combined.find({ _id: { $in: taggedUserIds } });
            if (!taggedUsers) {
                return res.status(400).json({
                    success: false,
                    message: 'Tagged user not found. Unable to create the comment.'
                });
            }
        }

        // Parallel S3 uploads (Issue 4)
        const attachmentUrls = [];
        if (req.body.attachments && req.body.attachments.length > 0) {
            const uploaded = await Promise.all(
                req.body.attachments.map(attachment => {
                    if (attachment.type.startsWith('image/')) {
                        return handleImage(attachment, req.body.taskId, combinedId)
                            .then(({ s3Url, fileName }) => ({ url: s3Url, name: fileName, type: attachment.type, createdBy: combinedId }));
                    }
                    if (attachment.type.startsWith('application/')) {
                        return handleDocuments(attachment, req.body.taskId, combinedId)
                            .then(({ s3Url, fileName }) => ({ url: s3Url, name: fileName, type: attachment.type, createdBy: combinedId }));
                    }
                    return Promise.resolve(null);
                })
            );
            attachmentUrls.push(...uploaded.filter(Boolean));
            req.body.attachments = attachmentUrls;
        }

        let taskComment = await TaskComment.findOne({ taskId: req.body.taskId });
        if (taskComment) {
            const newComment = {
                text: req.body.commentText,
                taggedUsers: req.body.taggedUsers || [],
                createdBy: combinedId,
                parentComment: req.body.parentCommentId || null
            };
            if (newComment.text) {
                taskComment.comments.push(newComment);
            }
            taskComment.attachments = [...taskComment.attachments, ...attachmentUrls];
            if (req.body.subtask_name) {
                taskComment.subtasks.push({
                    subtask_name: req.body.subtask_name,
                    status: req.body.subtask_status || "In Progress",
                    createdBy: combinedId
                });
            }
            taskComment = await taskComment.save();
        } else {
            // Only fetch task_name when creating the document for the first time (Issue 5)
            const taskPresent = await Task.findById(req.body.taskId);
            taskComment = await TaskComment.create({
                taskId: req.body.taskId,
                task_name: taskPresent?.task_name,
                comments: req.body.commentText ? [{
                    text: req.body.commentText,
                    taggedUsers: req.body.taggedUsers || [],
                    createdBy: combinedId,
                    parentComment: req.body.parentCommentId || null
                }] : [],
                subtasks: req.body.subtask_name ? [{
                    subtask_name: req.body.subtask_name,
                    status: req.body.status || "In Progress",
                    createdBy: combinedId
                }] : [],
                attachments: attachmentUrls,
                workspace_name: req.body.workspace_name,
            });
        }
        res.status(201).json({
            success: true,
            comment: taskComment,
        });

    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};



exports.getAllComments = async (req, res) => {
    const combinedId = req.combinedId;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const comments = await TaskComment.find({
        workspace_name: combinedWorkSpaceName,
    });
    console.log(comments)
    res.status(200).json({
        success: true,
        comments
    });

}

// exports.getCommentByTaskId = async (req, res) => {
//     const combinedId = req.combinedId;
//     const combinedWorkSpaceName = req.combinedWorkSpaceName;
//     const taskComment = await TaskComment.find({
//         // workspace_name: combinedWorkSpaceName,
//         taskId: req.params.id
//     });
//     console.log(combinedWorkSpaceName)
//     console.log("TCCCC",taskComment)
//     res.status(200).json({
//         success: true,
//         taskComment
//     });
    
// }
exports.getCommentByTaskId = async (req, res) => {
    try {
        const combinedId = req.combinedId;
        const combinedWorkSpaceName = req.combinedWorkSpaceName;

        // Use findOne instead of find
        const taskComment = await TaskComment.findOne({
            workspace_name: combinedWorkSpaceName,
            taskId: req.params.id
        }).populate('comments.createdBy', 'fname lname profile_img role');

        if (!taskComment) {
            return res.status(404).json({
                success: false,
                message: 'Task comment not found',
            });
        }

        console.log("tc----------------", taskComment);
        res.status(200).json({
            success: true,
            taskComment
        });
    } catch (error) {
        console.error('Error fetching comment by task ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

exports.getCommentDetails = catchAsyncErrors(async (req, res, next) => {
    const comment = await TaskComment.findById(req.params.id);
    if (!comment) {
        return next(new ErrorHander("Comment not found", 404));
    }
    res.status(200).json({
        success: true,
        comment,
    });
    console.log(comment);
});

// Update taskComment
exports.updateComment = catchAsyncErrors(async (req, res, next) => {
    let taskComment = await TaskComment.findById(req.params.id);

    if (!taskComment) {
        return res.status(404).json({
            success: false,
            message: "Invoice not found"
        });
    }

    taskComment = await TaskComment.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        usefindAndModify: false
    });

    res.status(200).json({
        success: true,
        taskComment
    });
});


// Delete a specific subtask by subtaskId
exports.deleteSubtask = async (req, res) => {
    const { taskId, subtaskId } = req.params;
    try {
        const result = await TaskComment.findOneAndUpdate(
            { taskId, 'subtasks._id': subtaskId },
            { $pull: { subtasks: { _id: subtaskId } } }
        );
        if (!result) return res.status(404).json({ message: 'Subtask not found' });
        res.status(200).json({ message: 'Subtask deleted successfully', success: true });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Delete a specific attachment by attachmentId
exports.deleteAttachment = async (req, res) => {
    const { taskId, attachmentId } = req.params;
    try {
        const result = await TaskComment.findOneAndUpdate(
            { taskId, 'attachments._id': attachmentId },
            { $pull: { attachments: { _id: attachmentId } } }
        );
        if (!result) return res.status(404).json({ message: 'Attachment not found' });
        res.status(200).json({ message: 'Attachment deleted successfully', success: true });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Delete a specific comment
exports.deleteComment = async (req, res) => {
    const { taskId, commentId } = req.params;
    try {
        const result = await TaskComment.findOneAndUpdate(
            { taskId, 'comments._id': commentId },
            { $pull: { comments: { _id: commentId } } }
        );
        if (!result) return res.status(404).json({ message: 'Comment not found' });
        res.status(200).json({ message: 'Comment deleted successfully', success: true });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};




// Update a specific subtask by subtaskId
exports.updateSubtask = async (req, res) => {
    const { taskId, subtaskId } = req.params;
    const { status, subtask_name } = req.body;
    const $set = {};
    if (status)       $set['subtasks.$[s].status']       = status;
    if (subtask_name) $set['subtasks.$[s].subtask_name'] = subtask_name;
    try {
        const result = await TaskComment.findOneAndUpdate(
            { taskId, 'subtasks._id': subtaskId },
            { $set },
            { arrayFilters: [{ 's._id': subtaskId }], new: true }
        );
        if (!result) return res.status(404).json({ message: 'Subtask not found' });
        res.status(200).json({ message: 'Subtask updated successfully', success: true });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
  


// adding emoji reaction
exports.addEmojiReaction = async (req, res) => {
    const { commentId } = req.params;
    const { emojiName, emojiSrc } = req.body;
    const userId = req.combinedId;
    console.log(emojiName, emojiSrc)
    try {
        const taskComment = await TaskComment.findOne({ "comments._id": commentId });
        if (!taskComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const comment = taskComment.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Find existing reaction
        const reaction = comment.reactions.find(r => r.emojiName === emojiName);

        if (reaction) {
            console.log('---------------------------------in')
                reaction.count += 1;
                reaction.users.push(userId);
        } else {
            comment.reactions.push({ emojiName:emojiName, emojiSrc:emojiSrc, count: 1, users: [userId] });
            console.log("-----coment", comment.reactions)
        }

        await taskComment.save();
        // console.log(taskComment)
        res.status(200).json({ message: 'Emoji reaction added successfully', success: true, taskComment });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};