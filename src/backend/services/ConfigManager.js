import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure data directory exists
const dataDir = path.join(__dirname, '..', '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Path to the config file
const CONFIG_FILE_PATH = path.join(dataDir, 'config.json');

// Region URL mapping
const REGIONS = {
  'us': { 
    baseUrl: 'https://preview-rls09.congacloud.com',
    authUrl: 'https://login-rlspreview.congacloud.com',
    coreappsUrl: 'https://coreapps-rlspreview.congacloud.com'
  },
  'eu': { 
    baseUrl: 'https://rls-preview.congacloud.eu',
    authUrl: 'https://login-preview.congacloud.eu',
    coreappsUrl: 'https://coreapps-preview.congacloud.eu'
  },
  'au': { 
    baseUrl: 'https://rls-preview.congacloud.au',
    authUrl: 'https://login-preview.congacloud.au',
    coreappsUrl: 'https://coreapps-preview.congacloud.au'
  }
};

// Default config structure
const DEFAULT_CONFIG = {
  region: 'us',
  clientId: '',
  clientSecret: '',
  platformEmail: '',
  callbackUrl: '',
  accessToken: null,
  tokenExpiry: null,
  initialized: false
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
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
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
   * Get full auth URL including endpoint
   * @returns {string} The complete auth URL
   */
  getFullAuthUrl() {
    const { region } = this.config;
    const urls = REGIONS[region] || REGIONS['us'];
    return `${urls.authUrl}/api/v1/auth/connect/token`;
  }

  /**
   * Get full API URL including endpoint
   * @returns {string} The complete API URL
   */
  getFullApiUrl() {
    const { region } = this.config;
    const urls = REGIONS[region] || REGIONS['us'];
    return `${urls.coreappsUrl}/api/sign/v1`;
  }

  /**
   * Check if the API is configured with valid credentials
   * @returns {boolean} Whether configuration is initialized
   */
  isInitialized() {
    return this.config && this.config.initialized === true;
  }

  /**
   * Update configuration values
   * @param {Object} newConfig - New configuration values to merge
   * @returns {boolean} Success status
   */
  updateConfig(newConfig) {
    try {
      // Validate essential fields
      if (newConfig.clientId && typeof newConfig.clientId !== 'string') {
        throw new Error('Invalid client ID format');
      }
      
      if (newConfig.clientSecret && typeof newConfig.clientSecret !== 'string') {
        throw new Error('Invalid client secret format');
      }

      if (newConfig.platformEmail && typeof newConfig.platformEmail !== 'string') {
        throw new Error('Invalid platform email format');
      }

      // Create updated config
      const updatedConfig = { ...this.config, ...newConfig };
      
      // If client ID or secret changed, clear the token
      if (
        (newConfig.clientId && newConfig.clientId !== this.config.clientId) ||
        (newConfig.clientSecret && newConfig.clientSecret !== this.config.clientSecret)
      ) {
        updatedConfig.accessToken = null;
        updatedConfig.tokenExpiry = null;
      }
      
      // Set initialized to true if all required fields are present
      updatedConfig.initialized = Boolean(
        updatedConfig.clientId && 
        updatedConfig.clientSecret && 
        updatedConfig.platformEmail
      );
      
      return this.saveConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating configuration:', error);
      return false;
    }
  }

  /**
   * Update the auth token
   * @param {string} token - The authentication token
   * @param {number} expiresIn - Token expiry time in seconds
   * @returns {boolean} Success status
   */
  updateToken(token, expiresIn = 3600) {
    try {
      // Calculate expiry time (current time + expires_in - 5 min buffer)
      const expiryTime = new Date(Date.now() + (expiresIn * 1000) - (5 * 60 * 1000));
      
      const updatedConfig = { 
        ...this.config, 
        accessToken: token, 
        tokenExpiry: expiryTime.toISOString()
      };
      
      return this.saveConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating token:', error);
      return false;
    }
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
    
    // If no expiry set, assume token is not valid
    return false;
  }

  /**
   * Get URL configuration for the selected region
   * @returns {Object} Object containing baseUrl, authUrl, and coreappsUrl
   */
  getRegionUrls() {
    const { region } = this.config;
    return REGIONS[region] || REGIONS['us']; // Fallback to US
  }

  /**
   * Reset the configuration to defaults
   * @param {boolean} keepRegion - Whether to keep the current region setting
   * @returns {boolean} Success status
   */
  reset(keepRegion = true) {
    try {
      const resetConfig = { ...DEFAULT_CONFIG };
      
      // Optionally keep the current region setting
      if (keepRegion && this.config.region) {
        resetConfig.region = this.config.region;
      }
      
      return this.saveConfig(resetConfig);
    } catch (error) {
      console.error('Error resetting configuration:', error);
      return false;
    }
  }
}

export default ConfigManager;