import fetch from 'node-fetch';
import ConfigManager from './ConfigManager.js';

class CongaApiClient {
  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * Fetch authentication token from Conga API
   * @param {string} clientId - Client ID
   * @param {string} clientSecret - Client Secret
   * @param {string} userEmail - User's email
   * @param {string} environment - Selected environment
   * @returns {Promise<string>} Authentication token
   */
  async fetchAuthToken(clientId, clientSecret, userEmail, environment) {
    try {
      // Update config with the provided values
      this.configManager.updateConfig({
        clientId,
        clientSecret,
        userEmail,
        environment
      });

      // Get the auth URL for the selected environment
      const { authUrl } = this.configManager.getEnvironmentUrls();
      const tokenEndpoint = `${authUrl}/api/sign/v1/cs-authenticationTokens/user`;

      // Prepare the request headers with authentication
      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ userEmail })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Auth failed: ${response.status} ${errorData.message || response.statusText}`);
      }

      // Extract token from response (exact response format will depend on Conga's API)
      // This is a placeholder - adjust based on actual Conga API response format
      const responseData = await response.json();
      const token = responseData.token || response.headers.get('Conga-Access-Token');
      
      if (!token) {
        throw new Error('No token received from authentication service');
      }

      // Save the token in config
      // If the response includes an expiry, we would extract and save that too
      const expiry = responseData.expiresAt || null;
      this.configManager.updateToken(token, expiry);

      return token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated API call to Conga
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} [body] - Request body
   * @returns {Promise<Object>} Response data
   */
  async callApi(endpoint, method = 'GET', body = null) {
    try {
      // Get current configuration
      const config = this.configManager.getConfig(true);
      
      // Check if we have a valid token
      if (!this.configManager.isTokenValid()) {
        throw new Error('No valid authentication token. Please authenticate first.');
      }

      // Get the base URL for the selected environment
      const { baseUrl } = this.configManager.getEnvironmentUrls();
      const apiUrl = `${baseUrl}${endpoint}`;

      // Prepare request options
      const requestOptions = {
        method,
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Accept': 'application/json'
        }
      };

      // Add body if provided
      if (body) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(body);
      }

      // Make the API call
      const response = await fetch(apiUrl, requestOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API call failed: ${response.status} ${errorData.message || response.statusText}`);
      }

      // Parse the response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error calling Conga API at ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get a list of transactions
   * @returns {Promise<Array>} List of transactions
   */
  async getTransactions() {
    // This endpoint will need to be adjusted based on Conga's actual API
    const endpoint = '/api/sign/v1/cs-packages';
    return this.callApi(endpoint);
  }

  /**
   * Resend a transaction invitation
   * @param {string} packageId - Transaction/package ID
   * @returns {Promise<Object>} Response data
   */
  async resendTransaction(packageId) {
    const endpoint = `/api/sign/v1/cs-packages/${packageId}/resend`;
    return this.callApi(endpoint, 'POST');
  }

  /**
   * Cancel a transaction
   * @param {string} packageId - Transaction/package ID
   * @returns {Promise<Object>} Response data
   */
  async cancelTransaction(packageId) {
    const endpoint = `/api/sign/v1/cs-packages/${packageId}/cancel`;
    return this.callApi(endpoint, 'POST');
  }

  /**
   * Get details of a specific transaction
   * @param {string} packageId - Transaction/package ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(packageId) {
    const endpoint = `/api/sign/v1/cs-packages/${packageId}`;
    return this.callApi(endpoint);
  }
}

export default CongaApiClient;