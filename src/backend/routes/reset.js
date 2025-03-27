import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to data directory
const dataDir = path.join(__dirname, '../../..', 'data');

// Reset config to default empty state
router.post('/config', (req, res) => {
  try {
    const configPath = path.join(dataDir, 'config.json');
    
    // Create default empty config
    const defaultConfig = {
      region: 'US',
      credentials: {
        clientId: '',
        clientSecret: ''
      },
      token: null,
      tokenExpiry: null
    };
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write default config to file
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    
    res.status(200).json({ message: 'Configuration reset successfully' });
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({ error: 'Failed to reset configuration' });
  }
});

// Reset transactions to empty state
router.post('/transactions', (req, res) => {
  try {
    const transactionsPath = path.join(dataDir, 'transactions.json');
    
    // Create default empty transactions list
    const defaultTransactions = {
      transactions: []
    };
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write default transactions to file
    fs.writeFileSync(transactionsPath, JSON.stringify(defaultTransactions, null, 2));
    
    res.status(200).json({ message: 'Transactions reset successfully' });
  } catch (error) {
    console.error('Error resetting transactions:', error);
    res.status(500).json({ error: 'Failed to reset transactions' });
  }
});

// Reset all data (both config and transactions)
router.post('/all', (req, res) => {
  try {
    // Reset config
    const configPath = path.join(dataDir, 'config.json');
    const defaultConfig = {
      region: 'US',
      credentials: {
        clientId: '',
        clientSecret: ''
      },
      token: null,
      tokenExpiry: null
    };
    
    // Reset transactions
    const transactionsPath = path.join(dataDir, 'transactions.json');
    const defaultTransactions = {
      transactions: []
    };
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write default data to files
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    fs.writeFileSync(transactionsPath, JSON.stringify(defaultTransactions, null, 2));
    
    res.status(200).json({ message: 'All data reset successfully' });
  } catch (error) {
    console.error('Error resetting all data:', error);
    res.status(500).json({ error: 'Failed to reset all data' });
  }
});

export default router;