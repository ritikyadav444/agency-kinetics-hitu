const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    task_name: {
        type: String,
    },
    subtasks: [
        {
            subtask_name: {type: String},
            status: {
                type: String,
                enum: ["In Progress", "Completed"],
                default: "In Progress"
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Combined',
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    attachments: [
        {
            url: { type: String, required: true },  
            name: { type: String, required: true }, 
            type: { type: String, required: true }, 
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Combined',
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ] || null || undefined,
    comments: [{
        text: {
            type: String,
        },
        taggedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Combined' 
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Combined',
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TaskComment'
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        reactions: [{ 
            emojiName: { type: String }, 
            emojiSrc: { type: String },  
            count: { type: Number, default: 0 },
            users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Combined' }]
        }]
    }],

    workspace_name: {
        type: mongoose.Schema.Types.String,
        ref: 'Combined',
    },

});

commentSchema.index({ workspace_name: 1, taskId: 1 });

module.exports = mongoose.model('TaskComment', commentSchema);