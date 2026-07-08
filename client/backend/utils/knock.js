const { Knock } = require("@knocklabs/node");

let knockClient = null;

if (process.env.KNOCK_SECRET_API_KEY) {
  knockClient = new Knock(process.env.KNOCK_SECRET_API_KEY);
}

/**
 * Triggers a Knock workflow for a specific user.
 * @param {string} workflowKey - The key of the workflow to trigger.
 * @param {string} recipientId - The user ID to receive the notification.
 * @param {object} data - Any data payload to pass to the notification template.
 */
async function triggerNotification(workflowKey, recipientId, data = {}) {
  if (!knockClient) {
    console.warn(`Knock is not initialized. Notification [${workflowKey}] for ${recipientId} skipped.`);
    return;
  }

  try {
    await knockClient.workflows.trigger(workflowKey, {
      recipients: [recipientId],
      data: data,
    });
    console.log(`Knock notification [${workflowKey}] sent to ${recipientId}`);
  } catch (error) {
    console.error("Failed to trigger Knock notification:", error);
  }
}

/**
 * Identifies a user in Knock to sync their profile data.
 * @param {string} userId - The user's ID
 * @param {object} traits - Profile traits (name, email, avatar, etc.)
 */
async function identifyUser(userId, traits = {}) {
  if (!knockClient) return;
  try {
    await knockClient.users.identify(userId, traits);
  } catch (error) {
    console.error("Failed to identify Knock user:", error);
  }
}

module.exports = {
  knockClient,
  triggerNotification,
  identifyUser,
};
