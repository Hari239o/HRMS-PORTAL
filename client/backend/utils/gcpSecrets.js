const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize the Secret Manager client
const client = new SecretManagerServiceClient();

/**
 * Accesses a secret from Google Secret Manager
 * @param {string} secretName - The name of the secret (e.g. 'projects/my-project/secrets/my-secret/versions/latest')
 * @returns {Promise<string>} - The plaintext secret payload
 */
const accessSecret = async (secretName) => {
  try {
    const [version] = await client.accessSecretVersion({
      name: secretName,
    });

    const payload = version.payload.data.toString('utf8');
    return payload;
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw error;
  }
};

/**
 * Convenience function to fetch multiple secrets and assign them to process.env
 * @param {string} projectId - Google Cloud Project ID
 * @param {Array<string>} secretKeys - Array of secret names to fetch
 */
const loadSecretsIntoEnv = async (projectId, secretKeys) => {
  try {
    const promises = secretKeys.map(async (key) => {
      const secretName = `projects/${projectId}/secrets/${key}/versions/latest`;
      const secretValue = await accessSecret(secretName);
      process.env[key] = secretValue;
    });

    await Promise.all(promises);
    console.log('Successfully loaded secrets into environment variables.');
  } catch (error) {
    console.error('Failed to load secrets into env:', error);
  }
};

module.exports = {
  accessSecret,
  loadSecretsIntoEnv,
};
