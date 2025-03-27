import express from 'express';
import ConfigManager from '../services/ConfigManager.js';
import CongaApiClient from '../services/CongaApiClient.js';

const router = express.Router();
const configManager = new ConfigManager();
const apiClient = new CongaApiClient();

/**
 * POST /api/auth
 * Generates an authentication token using the stored configuration
 */
router.post('/', async (req, res) => {
  try {
    // Get the current configuration (including secret)
    const config = configManager.getConfig(true);
    
    // Check if we have the necessary credentials
    if (!config.clientId || !config.clientSecret || !config.userEmail) {
      return res.status(400).json({ 
        error: 'Missing credentials. Please configure Client ID, Client Secret, and User Email first.' 
      });
    }
    
    // Generate token
    const token = await apiClient.fetchAuthToken(
      config.clientId,
      config.clientSecret,
      config.userEmail,
      config.environment
    );
    
    // Return success response (don't include the token itself for security)
    res.json({ 
      success: true, 
      message: 'Authentication token generated successfully',
      status: 'valid'
    });
  } catch (error) {
    console.error('Error generating auth token:', error);
    res.status(500).json({ 
      error: 'Failed to generate authentication token', 
      message: error.message,
      status: 'invalid' 
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
    res.json({ 
      valid: isValid,
      status: isValid ? 'valid' : 'invalid'
    });
  } catch (error) {
    console.error('Error checking token status:', error);
    res.status(500).json({ error: 'Failed to check token status' });
  }
});

export default router;