import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the config file
const CONFIG_FILE_PATH = path.join(__dirname, '..', '..', '..', 'config.json');

// Environment URL mapping
const ENVIRONMENTS = {
  'Preview US': { 
    baseUrl: 'https://preview-rls09.congacloud.com', 
    authUrl: 'https://login-rls09.congacloud.com' 
  },
  'Preview EU': { 
    baseUrl: 'https://preview-rls09.congacloud.eu', 
    authUrl: 'https://login-rls09.congacloud.eu' 
  },
  'Preview AU': { 
    baseUrl: 'https://preview-rls09.congacloud.com.au', 
    authUrl: 'https://login-rls09.congacloud.com.au' 
  },
  'Production US': { 
    baseUrl: 'https://prod-rls.congacloud.com', 
    authUrl: 'https://login.congacloud.com' 
  },
  'Production EU': { 
    baseUrl: 'https://prod-rls.congacloud.eu', 
    authUrl: 'https://login.congacloud.eu' 
  },
  'Production AU': { 
    baseUrl: 'https://prod-rls.congacloud.com.au', 
    authUrl: 'https://login.congacloud.com.au' 
  }
};

// Default config structure
const DEFAULT_CONFIG = {
  environment: 'Preview US',
  clientId: '',
  clientSecret: '',
  userEmail: '',
  accessToken: null,
  tokenExpiry: null
};

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load config from JSON file
   * @returns {Object} The configuration object
   */
  loadConfig() {
    try {
      // Check if file exists
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        return JSON.parse(configData);
      } else {
        // If file doesn't exist, create it with default config
        this.saveConfig(DEFAULT_CONFIG);
        return { ...DEFAULT_CONFIG };
      }
    } catch (error) {
      console.error('Error loading config:', error);
      // Return default config if there's an error
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save config to JSON file
   * @param {Object} config - Configuration object to save
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(
        CONFIG_FILE_PATH, 
        JSON.stringify(config, null, 2), 
        'utf8'
      );
      this.config = config;
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Get the current configuration
   * @param {boolean} includeSecret - Whether to include the client secret
   * @returns {Object} The current configuration
   */
  getConfig(includeSecret = false) {
    // Optionally remove client secret for security
    if (!includeSecret) {
      const { clientSecret, ...safeConfig } = this.config;
      return safeConfig;
    }
    return { ...this.config };
  }

  /**
   * Update configuration values
   * @param {Object} newConfig - New configuration values to merge
   * @returns {Object} The updated configuration
   */
  updateConfig(newConfig) {
    const updatedConfig = { ...this.config, ...newConfig };
    
    // If client ID or secret changed, clear the token
    if (
      (newConfig.clientId && newConfig.clientId !== this.config.clientId) ||
      (newConfig.clientSecret && newConfig.clientSecret !== this.config.clientSecret)
    ) {
      updatedConfig.accessToken = null;
      updatedConfig.tokenExpiry = null;
    }
    
    this.saveConfig(updatedConfig);
    return this.getConfig();
  }

  /**
   * Update the auth token
   * @param {string} token - The authentication token
   * @param {string|null} expiry - Token expiry timestamp (optional)
   * @returns {Object} The updated configuration
   */
  updateToken(token, expiry = null) {
    const updatedConfig = { 
      ...this.config, 
      accessToken: token, 
      tokenExpiry: expiry 
    };
    
    this.saveConfig(updatedConfig);
    return this.getConfig();
  }

  /**
   * Check if the token is valid (exists and not expired)
   * @returns {boolean} Whether the token is valid
   */
  isTokenValid() {
    const { accessToken, tokenExpiry } = this.config;
    
    if (!accessToken) return false;
    
    // If expiry is set, check if token is expired
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      const now = new Date();
      return expiryDate > now;
    }
    
    // If no expiry set, assume token is valid
    return true;
  }

  /**
   * Get base URL and auth URL for the selected environment
   * @returns {Object} Object containing baseUrl and authUrl
   */
  getEnvironmentUrls() {
    const env = this.config.environment;
    return ENVIRONMENTS[env] || ENVIRONMENTS['Preview US']; // Fallback to Preview US
  }

  /**
   * Reset the configuration to defaults
   * @param {boolean} keepEnvironment - Whether to keep the current environment setting
   */
  reset(keepEnvironment = true) {
    const resetConfig = { ...DEFAULT_CONFIG };
    
    // Optionally keep the current environment setting
    if (keepEnvironment && this.config.environment) {
      resetConfig.environment = this.config.environment;
    }
    
    this.saveConfig(resetConfig);
    return this.getConfig();
  }
}

export default ConfigManager;