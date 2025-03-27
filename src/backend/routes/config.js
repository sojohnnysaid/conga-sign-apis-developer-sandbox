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
    res.json(config);
  } catch (error) {
    console.error('Error retrieving config:', error);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

/**
 * POST /api/config
 * Updates the configuration with new values
 */
router.post('/', (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate required fields
    if (newConfig.environment && !newConfig.environment.trim()) {
      return res.status(400).json({ error: 'Environment is required' });
    }
    
    const updatedConfig = configManager.updateConfig(newConfig);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * POST /api/config/reset
 * Resets configuration to defaults
 */
router.post('/reset', (req, res) => {
  try {
    const keepEnvironment = req.body.keepEnvironment !== false; // Default to true
    const resetConfig = configManager.reset(keepEnvironment);
    res.json(resetConfig);
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({ error: 'Failed to reset configuration' });
  }
});

export default router;