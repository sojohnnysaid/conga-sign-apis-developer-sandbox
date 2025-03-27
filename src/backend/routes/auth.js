import express from 'express';
import ConfigManager from '../services/ConfigManager.js';
import CongaApiClient from '../services/CongaApiClient.js';

const router = express.Router();
const configManager = new ConfigManager();
const apiClient = new CongaApiClient();

/**
 * POST /api/auth/token
 * Generates an authentication token using the stored configuration
 */
router.post('/token', async (req, res) => {
  try {
    // Check if we have the necessary credentials
    if (!configManager.isInitialized()) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing credentials. Please configure Client ID, Client Secret, and Platform Email first.' 
      });
    }
    
    // Generate token
    const token = await apiClient.authenticate();
    
    // Return success response with masked token
    const maskedToken = token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : null;
    
    res.json({ 
      success: true, 
      message: 'Authentication token generated successfully',
      token: maskedToken,
      expiresAt: configManager.getConfig().tokenExpiry
    });
  } catch (error) {
    console.error('Error generating auth token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate authentication token', 
      message: error.message
    });
  }
});

/**
 * GET /api/auth/status
 * Checks if the current token is valid
 */
router.get('/status', (req, res) => {
  try {
    const isValid = configManager.isTokenValid();
    const config = configManager.getConfig();
    
    res.json({ 
      valid: isValid,
      initialized: configManager.isInitialized(),
      expiresAt: config.tokenExpiry ? new Date(config.tokenExpiry).toISOString() : null
    });
  } catch (error) {
    console.error('Error checking token status:', error);
    res.status(500).json({ error: 'Failed to check token status' });
  }
});

/**
 * POST /api/auth/revoke
 * Revokes the current token
 */
router.post('/revoke', (req, res) => {
  try {
    // Update config with null token
    const success = configManager.updateConfig({
      accessToken: null,
      tokenExpiry: null
    });
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Token revoked successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to revoke token' 
      });
    }
  } catch (error) {
    console.error('Error revoking token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to revoke token',
      message: error.message
    });
  }
});

export default router;