const cron = require('node-cron');
const Combined = require('./models/combinedModel');
const Subscription = require('./models/subscriptionModel');  // Subscription model

// Function to check and expire plans based on subscription model
const checkAndExpirePlans = async () => {
    try {
        const now = new Date();

        // All userIds that have at least one expired plan (1 query)
        const expiredUserIds = await Subscription.distinct('userId', {
            'plans.expireOn': { $lte: now },
        });
        if (!expiredUserIds.length) return;

        // Of those, which ones still have at least one active plan (1 query)
        const activeUserIds = await Subscription.distinct('userId', {
            userId: { $in: expiredUserIds },
            'plans.expireOn': { $gt: now },
        });
        const activeSet = new Set(activeUserIds.map(String));

        // Batch-update all affected users in one write
        const bulkOps = expiredUserIds.map(userId => ({
            updateOne: {
                filter: { _id: userId },
                update: { $set: { status: activeSet.has(String(userId)) ? 'active' : 'inactive' } },
            },
        }));

        const result = await Combined.bulkWrite(bulkOps);
        console.log(`checkAndExpirePlans: updated ${result.modifiedCount} users.`);
    } catch (error) {
        console.error('Error in checkAndExpirePlans:', error);
    }
};

// Schedule the check to run daily (or adjust the schedule as needed)
cron.schedule('0 0 * * *', checkAndExpirePlans, {
    timezone: 'UTC'
});
console.log('Cron job initialized: Checking plan expirations daily.');

// Function to sync team members' status based on super admin's active plan
const syncTeamMembersStatus = async () => {
    console.log("Running cron job to sync team members' status.");
    try {
        const workspaces = await Combined.aggregate([
            {
                $match: {
                    role: 'SUPERADMIN',
                },
            },
            {
                $group: {
                    _id: '$workspace_name',
                    superAdminId: { $first: '$_id' },
                },
            },
        ]);

        for (const workspace of workspaces) {
            // Find the super admin's active subscription
            const superAdminSubscriptions = await Subscription.find({
                userId: workspace.superAdminId,
                'plans.expireOn': { $gt: new Date() },
            });

            const newStatus = superAdminSubscriptions.length > 0 ? 'active' : 'inactive';

            // Update all team members in the workspace to reflect the super admin's status
            const result = await Combined.updateMany(
                { workspace_name: workspace._id, role: { $in: ['CLIENT', 'ADMIN', 'ASSIGNEE', 'PROJECTMANAGER'] } },
                { status: newStatus }
            );

            console.log(`Updated ${result.modifiedCount} team members in workspace "${workspace._id}" to status "${newStatus}".`);
        }
    } catch (error) {
        console.error('Error in syncing team members:', error);
    }
};

// Schedule the sync to run daily (or adjust the schedule as needed)
cron.schedule('0 0 * * *', syncTeamMembersStatus, {
    timezone: 'UTC'
});
console.log('Cron job initialized: Syncing team members status based on super admin plan status.');
