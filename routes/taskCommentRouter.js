const express = require('express');
const { isAuthenticatedUser } = require('../middleware/authentication');
const { createComment, getAllComments, getCommentDetails, getCommentByTaskId, deleteComment, updateComment, deleteSubtask, deleteAttachment, updateSubtask, addEmojiReaction } = require('../controller/taskCommentController');
const multer = require('multer');
const storage = multer.memoryStorage();
const router = express.Router();
const upload = multer({ storage: storage });



router.route("/new/comment").post(isAuthenticatedUser, createComment);
router.route("/comments").get(isAuthenticatedUser, getAllComments)
router.route("/get/comment/:id").get(isAuthenticatedUser, getCommentDetails)
router.route("/comment/task/:id").get(isAuthenticatedUser, getCommentByTaskId)
router.route("/comment/update/:id").put(isAuthenticatedUser, updateComment)
router.route("/comment/delete/:taskId/subtasks/:subtaskId").delete(isAuthenticatedUser, deleteSubtask)
router.route("/comment/delete/:taskId/attachments/:attachmentId").delete(isAuthenticatedUser, deleteAttachment)
router.route("/comment/delete/:taskId/comments/:commentId").delete(isAuthenticatedUser, deleteComment)
router.route("/comment/update/:taskId/subtasks/:subtaskId").put(isAuthenticatedUser, updateSubtask)
router.route('/comments/:commentId/reactions').post(isAuthenticatedUser, addEmojiReaction);


module.exports = router;