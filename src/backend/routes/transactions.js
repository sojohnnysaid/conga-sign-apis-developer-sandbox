import express from 'express';
import TransactionManager from '../services/TransactionManager.js';
import ConfigManager from '../services/ConfigManager.js';

const router = express.Router();
const transactionManager = new TransactionManager();
const configManager = new ConfigManager();

/**
 * Middleware to check if authentication token is valid
 */
const requireAuth = (req, res, next) => {
  if (!configManager.isTokenValid()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please generate a valid authentication token first' 
    });
  }
  next();
};

/**
 * GET /api/transactions
 * Returns list of all transactions
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const transactions = transactionManager.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

/**
 * GET /api/transactions/:id
 * Returns a specific transaction by ID
 */
router.get('/:id', requireAuth, (req, res) => {
  try {
    const transaction = transactionManager.getTransactionById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error(`Error retrieving transaction ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
});

/**
 * POST /api/transactions/:id/resend
 * Resends a transaction invitation
 */
router.post('/:id/resend', requireAuth, async (req, res) => {
  try {
    const updatedTransaction = await transactionManager.resend(req.params.id);
    res.json(updatedTransaction);
  } catch (error) {
    console.error(`Error resending transaction ${req.params.id}:`, error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('status') ? 400 : 500;
    
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/:id/cancel
 * Cancels a transaction
 */
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const updatedTransaction = await transactionManager.cancel(req.params.id);
    res.json(updatedTransaction);
  } catch (error) {
    console.error(`Error cancelling transaction ${req.params.id}:`, error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('status') ? 400 : 500;
    
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/:id/complete
 * Marks a transaction as completed (for simulation purposes)
 */
router.post('/:id/complete', (req, res) => {
  try {
    const updatedTransaction = transactionManager.completeTransaction(req.params.id);
    res.json(updatedTransaction);
  } catch (error) {
    console.error(`Error completing transaction ${req.params.id}:`, error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('status') ? 400 : 500;
    
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/demo
 * Creates a demo transaction for testing
 */
router.post('/demo', requireAuth, (req, res) => {
  try {
    const userEmail = configManager.getConfig().userEmail;
    
    // Create a demo transaction using the authenticated user's email
    const demoData = {
      name: req.body.name || 'Demo Contract',
      recipient: req.body.recipient || userEmail,
      ...req.body
    };
    
    const demoTransaction = transactionManager.createDemoTransaction(demoData);
    res.json(demoTransaction);
  } catch (error) {
    console.error('Error creating demo transaction:', error);
    res.status(500).json({ error: 'Failed to create demo transaction' });
  }
});

/**
 * POST /api/transactions/reset
 * Resets all transactions
 */
router.post('/reset', (req, res) => {
  try {
    const emptyTransactions = transactionManager.reset();
    res.json(emptyTransactions);
  } catch (error) {
    console.error('Error resetting transactions:', error);
    res.status(500).json({ error: 'Failed to reset transactions' });
  }
});

export default router;