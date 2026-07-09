const axios = require('axios');

const KNOCK_API_KEY = process.env.KNOCK_SECRET_API_KEY;

const knockClient = KNOCK_API_KEY ? axios.create({
  baseURL: 'https://api.knock.app/v1',
  headers: {
    'Authorization': `Bearer ${KNOCK_API_KEY}`,
    'Content-Type': 'application/json'
  }
}) : null;

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
    await knockClient.post(`/workflows/${workflowKey}/trigger`, {
      recipients: [recipientId],
      data: data,
    });
    console.log(`Knock notification [${workflowKey}] sent to ${recipientId}`);
  } catch (error) {
    console.error("Failed to trigger Knock notification:", error.response?.data || error.message);
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
    await knockClient.put(`/users/${userId}`, traits);
  } catch (error) {
    console.error("Failed to identify Knock user:", error.response?.data || error.message);
  }
}

module.exports = {
  knockClient,
  triggerNotification,
  identifyUser,
};
