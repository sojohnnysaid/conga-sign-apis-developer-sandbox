import fetch from 'node-fetch';
import ConfigManager from './ConfigManager.js';

/**
 * CongaApiClient
 * Handles API interactions with Conga Sign
 */
class CongaApiClient {
  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * Authenticate with Conga Sign API
   * @returns {Promise<string>} Auth token
   * @throws {Error} If authentication fails
   */
  async authenticate() {
    if (!this.configManager.isInitialized()) {
      throw new Error('API client not configured. Please set client ID, client secret, and platform email.');
    }

    // Check if we already have a valid token
    if (this.configManager.isTokenValid()) {
      return this.configManager.getConfig(true).accessToken;
    }

    try {
      const config = this.configManager.getConfig(true);
      const authUrl = this.configManager.getFullAuthUrl();

      // Setup auth parameters
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', config.clientId);
      params.append('client_secret', config.clientSecret);

      // Make auth request
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Extract token from response
      const token = data.token || data.access_token;
      const expiresIn = data.expires_in || 3600; // Default 1 hour
      
      if (!token) {
        throw new Error('No token received from authentication service');
      }

      // Store token in config
      this.configManager.updateToken(token, expiresIn);
      
      return token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error(`Failed to authenticate: ${error.message}`);
    }
  }

  /**
   * Make API request to Conga Sign API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, options = {}) {
    try {
      // Get auth token first
      const token = await this.authenticate();
      
      // Build full URL and request options
      const baseApiUrl = this.configManager.getFullApiUrl();
      const url = `${baseApiUrl}${endpoint}`;
      
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // For FormData, let the browser set the Content-Type
      if (options.body instanceof FormData) {
        delete requestOptions.headers['Content-Type'];
      }

      // Make API request
      const response = await fetch(url, requestOptions);
      
      // Handle different response types
      if (response.status === 204) {
        // No content
        return { success: true };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Handle non-JSON responses
        return { 
          success: true, 
          text: await response.text(),
          status: response.status
        };
      }
    } catch (error) {
      console.error('API request error:', error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Set up callbacks for API events
   * @param {Object} options - Callback options
   * @returns {Promise<Object>} API response
   */
  async registerCallbacks(options = {}) {
    const config = this.configManager.getConfig();
    if (!config.callbackUrl) {
      throw new Error('Callback URL not configured');
    }

    const events = options.events || [
      'PACKAGE_CREATE',
      'DOCUMENT_VIEWED',
      'SIGNER_COMPLETE',
      'DOCUMENT_SIGNED',
      'PACKAGE_COMPLETE',
      'PACKAGE_DECLINE',
      'EMAIL_BOUNCE'
    ];

    const requestBody = {
      events,
      authType: options.authType || 'NO_AUTH',
      url: config.callbackUrl
    };

    return this.request('/cs-callback', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Create a new signing package
   * @param {Object} packageData - Package details
   * @returns {Promise<Object>} Created package
   */
  async createPackage(packageData = {}) {
    const config = this.configManager.getConfig();
    
    // Create package data with defaults
    const requestBody = {
      name: packageData.name || 'Signature Package',
      type: 'PACKAGE',
      autocomplete: true,
      sender: {
        email: packageData.senderEmail || config.platformEmail
      },
      ...packageData
    };

    return this.request('/cs-packages', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Add a signer role to a package
   * @param {string} packageId - Package ID
   * @param {Object} signerData - Signer details
   * @returns {Promise<Object>} API response
   */
  async addSigner(packageId, signerData) {
    // Create signer data with defaults
    const signer = {
      name: `${signerData.firstName} ${signerData.lastName}`,
      company: signerData.company || '',
      delivery: {
        email: true
      },
      firstName: signerData.firstName,
      lastName: signerData.lastName,
      email: signerData.email,
      signerType: 'EXTERNAL_SIGNER',
      ...signerData
    };

    const requestBody = {
      signers: [signer]
    };

    return this.request(`/cs-packages/${packageId}/roles`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Add a document to a package
   * @param {string} packageId - Package ID
   * @param {File|Blob|Object} file - Document file
   * @returns {Promise<Object>} API response
   */
  async addDocument(packageId, file) {
    const formData = new FormData();
    
    // Handle different file types
    if (file instanceof Blob) {
      formData.append('file', file, file.name || 'document.pdf');
    } else if (file.buffer) {
      // Handle Node.js Buffer from multer or similar
      const blob = new Blob([file.buffer], { type: file.mimetype || 'application/pdf' });
      formData.append('file', blob, file.originalname || file.name || 'document.pdf');
    } else {
      throw new Error('Invalid file format');
    }

    return this.request(`/cs-packages/${packageId}/documents`, {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Add signature field to a document
   * @param {string} packageId - Package ID
   * @param {string} documentId - Document ID
   * @param {string} roleId - Signer role ID
   * @param {Object} fieldOptions - Field options
   * @returns {Promise<Object>} API response
   */
  async addSignatureField(packageId, documentId, roleId, fieldOptions = {}) {
    // Default field options
    const field = {
      type: 'SIGNATURE',
      page: fieldOptions.page || 0,
      left: fieldOptions.left || 100,
      top: fieldOptions.top || 100,
      width: fieldOptions.width || 200,
      height: fieldOptions.height || 50,
      ...fieldOptions
    };

    const requestBody = {
      fields: [field],
      role: roleId
    };

    return this.request(`/cs-packages/${packageId}/documents/${documentId}/approvals`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Send package for signing
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} API response
   */
  async sendPackage(packageId) {
    const requestBody = {
      status: 'SENT'
    };

    return this.request(`/cs-packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * List packages for current user
   * @param {Object} options - List options
   * @returns {Promise<Object>} API response
   */
  async listPackages(options = {}) {
    const config = this.configManager.getConfig();
    
    if (!config.platformEmail) {
      throw new Error('Platform email not configured');
    }
    
    // Make sure email is properly URL encoded
    const ownerEmail = encodeURIComponent(options.ownerEmail || config.platformEmail);
    const from = options.from || 1;
    const to = options.to || 100;
    
    // Construct the URL with required parameters
    const url = `/cs-packages?ownerEmail=${ownerEmail}&from=${from}&to=${to}`;
    
    console.log(`Sending request to: ${url}`);
    
    try {
      const response = await this.request(url, {
        method: 'GET'
      });
      
      // Log information about the shape of the response
      if (response.packages) {
        console.log(`Got API response for packages: ${response.packages.length} packages found`);
      } else if (response.results) {
        console.log(`Got API response for packages: ${response.results.length} results found`);
      } else {
        console.log('No packages or results array in response');
      }
      
      return response;
    } catch (error) {
      console.error(`Error listing packages:`, error);
      throw error;
    }
  }

  /**
   * Get signing status of a package
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} API response
   */
  async getSigningStatus(packageId) {
    return this.request(`/cs-packages/${packageId}/signingStatus`, {
      method: 'GET'
    });
  }

  /**
   * Get audit report for a package
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} API response
   */
  async getAuditReport(packageId) {
    return this.request(`/cs-packages/${packageId}/audit`, {
      method: 'GET'
    });
  }

  /**
   * Resend notification to a signer
   * @param {string} packageId - Package ID
   * @param {Object} notificationData - Notification details
   * @returns {Promise<Object>} API response
   */
  async resendNotification(packageId, notificationData) {
    const requestBody = {
      email: notificationData.email,
      message: notificationData.message || 'Please sign the document'
    };

    return this.request(`/cs-packages/${packageId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Cancel (delete) a package
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} API response
   */
  async cancelPackage(packageId) {
    return this.request(`/cs-packages/${packageId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get signing URL for a signer
   * @param {string} packageId - Package ID
   * @param {string} roleId - Role ID
   * @returns {Promise<Object>} API response
   */
  async getSigningUrl(packageId, roleId) {
    return this.request(`/cs-packages/${packageId}/roles/${roleId}/signingUrl`, {
      method: 'GET'
    });
  }

  /**
   * Create a sender authentication token
   * @param {string} packageId - Package ID
   * @returns {Promise<Object>} API response
   */
  async createSenderToken(packageId) {
    const requestBody = {
      packageId
    };

    return this.request('/cs-authenticationTokens/sender', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Create a signer authentication token
   * @param {string} packageId - Package ID
   * @param {string} signerId - Signer ID
   * @returns {Promise<Object>} API response
   */
  async createSignerToken(packageId, signerId) {
    const requestBody = {
      packageId,
      signerId
    };

    return this.request('/cs-authenticationTokens/signer/singleUse', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }
}

export default CongaApiClient;