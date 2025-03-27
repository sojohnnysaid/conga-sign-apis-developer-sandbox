import express from 'express';
import multer from 'multer';
import TransactionManager from '../services/TransactionManager.js';

const router = express.Router();
const transactionManager = new TransactionManager();

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/**
 * GET /api/transactions
 * Get all transactions, optionally refreshed from API
 * 
 * Query parameters:
 * - refresh=true|false - Whether to refresh from API
 * - from=N - Starting index for pagination (default: 1)
 * - to=N - Ending index for pagination (default: 100)
 * - ownerEmail=email - Owner email to filter packages (default: platform email from config)
 */
router.get('/', async (req, res) => {
  try {
    const { refresh, from, to, ownerEmail } = req.query;
    
    // Filter out undefined values
    const options = {
      ...(from && { from: parseInt(from, 10) }),
      ...(to && { to: parseInt(to, 10) }),
      ...(ownerEmail && { ownerEmail })
    };
    
    console.log('Transaction list request with options:', options, 'refresh:', refresh === 'true');
    
    const transactions = await transactionManager.getAllTransactions(
      refresh === 'true',
      options
    );
    
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
});

/**
 * GET /api/transactions/:id
 * Get a transaction by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const refresh = req.query.refresh === 'true';
    
    const transaction = await transactionManager.getTransactionById(id, refresh);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ transaction });
  } catch (error) {
    console.error(`Error fetching transaction ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post('/', async (req, res) => {
  try {
    const packageData = req.body;
    
    // Validate name
    if (!packageData.name) {
      return res.status(400).json({ error: 'Transaction name is required' });
    }
    
    const transaction = await transactionManager.createTransaction(packageData);
    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: `Failed to create transaction: ${error.message}` });
  }
});

/**
 * POST /api/transactions/:id/signers
 * Add a signer to a transaction
 */
router.post('/:id/signers', async (req, res) => {
  try {
    const { id } = req.params;
    const signerData = req.body;
    
    // Validate required fields
    if (!signerData.firstName || !signerData.lastName || !signerData.email) {
      return res.status(400).json({ 
        error: 'Signer first name, last name, and email are required' 
      });
    }
    
    const transaction = await transactionManager.addSigner(id, signerData);
    res.json({ transaction });
  } catch (error) {
    console.error(`Error adding signer to transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to add signer: ${error.message}` });
    }
  }
});

/**
 * POST /api/transactions/:id/documents
 * Add a document to a transaction
 */
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await transactionManager.addDocument(id, req.file);
    res.json(result);
  } catch (error) {
    console.error(`Error adding document to transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to add document: ${error.message}` });
    }
  }
});

/**
 * POST /api/transactions/:id/documents/:documentId/fields
 * Add a signature field to a document
 */
router.post('/:id/documents/:documentId/fields', async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const { roleId, ...fieldOptions } = req.body;
    
    // Validate required field
    if (!roleId) {
      return res.status(400).json({ error: 'Signer role ID is required' });
    }
    
    const transaction = await transactionManager.addSignatureField(
      id, documentId, roleId, fieldOptions
    );
    
    res.json({ transaction });
  } catch (error) {
    console.error(`Error adding signature field to document:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to add signature field: ${error.message}` });
    }
  }
});

/**
 * POST /api/transactions/:id/send
 * Send a transaction for signing
 */
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionManager.sendTransaction(id);
    res.json({ transaction });
  } catch (error) {
    console.error(`Error sending transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to send transaction: ${error.message}` });
    }
  }
});

/**
 * POST /api/transactions/:id/refresh
 * Refresh a transaction's status from the API
 */
router.post('/:id/refresh', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionManager.refreshTransactionStatus(id);
    res.json({ transaction });
  } catch (error) {
    console.error(`Error refreshing transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to refresh transaction: ${error.message}` });
    }
  }
});

/**
 * POST /api/transactions/:id/notifications
 * Resend notification to a signer
 */
router.post('/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Signer email is required' });
    }
    
    const transaction = await transactionManager.resendNotification(id, email, message);
    res.json({ transaction });
  } catch (error) {
    console.error(`Error resending notification for transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to resend notification: ${error.message}` });
    }
  }
});

/**
 * DELETE /api/transactions/:id
 * Cancel a transaction
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await transactionManager.cancelTransaction(id);
    
    if (success) {
      res.json({ success: true, message: 'Transaction canceled successfully' });
    } else {
      res.status(500).json({ error: 'Failed to cancel transaction' });
    }
  } catch (error) {
    console.error(`Error canceling transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to cancel transaction: ${error.message}` });
    }
  }
});

/**
 * GET /api/transactions/:id/signingUrl/:roleId
 * Get signing URL for a signer
 */
router.get('/:id/signingUrl/:roleId', async (req, res) => {
  try {
    const { id, roleId } = req.params;
    const url = await transactionManager.getSigningUrl(id, roleId);
    res.json({ url });
  } catch (error) {
    console.error(`Error getting signing URL for transaction ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to get signing URL: ${error.message}` });
    }
  }
});

/**
 * POST /api/transactions/reset
 * Reset all transactions
 */
router.post('/reset', (req, res) => {
  try {
    const success = transactionManager.reset();
    
    if (success) {
      res.json({ success: true, message: 'All transactions have been reset' });
    } else {
      res.status(500).json({ error: 'Failed to reset transactions' });
    }
  } catch (error) {
    console.error('Error resetting transactions:', error);
    res.status(500).json({ error: `Failed to reset transactions: ${error.message}` });
  }
});

export default router;