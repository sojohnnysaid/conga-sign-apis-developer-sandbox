import express from 'express';
import ConfigManager from '../services/ConfigManager.js';

const router = express.Router();
const configManager = new ConfigManager();

/**
 * GET /api/config
 * Returns the current configuration (without sensitive data)
 */
router.get('/', (req, res) => {
  try {
    const config = configManager.getConfig(false); // Don't include secret
    res.json({
      config,
      initialized: configManager.isInitialized(),
      regionUrls: configManager.getRegionUrls()
    });
  } catch (error) {
    console.error('Error retrieving config:', error);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

/**
 * PUT /api/config
 * Updates the configuration with new values
 */
router.put('/', (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate region if provided
    if (newConfig.region && !['us', 'eu', 'au'].includes(newConfig.region)) {
      return res.status(400).json({ error: 'Invalid region. Must be us, eu, or au' });
    }
    
    const success = configManager.updateConfig(newConfig);
    
    if (success) {
      const config = configManager.getConfig(false); // Don't include secret
      res.json({
        success: true,
        config,
        initialized: configManager.isInitialized(),
        regionUrls: configManager.getRegionUrls()
      });
    } else {
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: `Failed to update configuration: ${error.message}` });
  }
});

/**
 * POST /api/config/test
 * Test current configuration with API
 */
router.post('/test', async (req, res) => {
  try {
    if (!configManager.isInitialized()) {
      return res.status(400).json({
        success: false,
        error: 'Configuration is incomplete. Please add client ID, client secret, and platform email.'
      });
    }
    
    // Import CongaApiClient
    const { default: CongaApiClient } = await import('../services/CongaApiClient.js');
    
    try {
      // Create client and try to authenticate
      const apiClient = new CongaApiClient();
      const token = await apiClient.authenticate();
      
      res.json({
        success: true,
        message: 'API credentials validated successfully',
        token: token ? `${token.substring(0, 15)}...` : null
      });
    } catch (error) {
      console.error('API test failed:', error);
      res.status(400).json({
        success: false,
        error: `API configuration test failed: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Error testing configuration:', error);
    res.status(500).json({ 
      success: false,
      error: `Failed to test configuration: ${error.message}`
    });
  }
});

/**
 * POST /api/config/reset
 * Reset configuration
 */
router.post('/reset', (req, res) => {
  try {
    const keepRegion = req.body.keepRegion !== false; // Default to true
    const success = configManager.reset(keepRegion);
    
    if (success) {
      const config = configManager.getConfig(false); // Don't include secret
      res.json({
        success: true,
        config,
        initialized: configManager.isInitialized(),
        regionUrls: configManager.getRegionUrls()
      });
    } else {
      res.status(500).json({ error: 'Failed to reset configuration' });
    }
  } catch (error) {
    console.error('Error resetting configuration:', error);
    res.status(500).json({ error: `Failed to reset configuration: ${error.message}` });
  }
});

/**
 * GET /api/config/regions
 * Returns the available regions and their URL configurations
 */
router.get('/regions', (req, res) => {
  try {
    res.json({
      regions: ['us', 'eu', 'au'],
      currentRegion: configManager.getConfig().region,
      urls: configManager.getRegionUrls()
    });
  } catch (error) {
    console.error('Error retrieving regions:', error);
    res.status(500).json({ error: 'Failed to retrieve region information' });
  }
});

export default router;