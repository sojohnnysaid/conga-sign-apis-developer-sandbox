import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CongaApiClient from './CongaApiClient.js';

// Setup __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure data directory exists
const dataDir = path.join(__dirname, '..', '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Path to the transactions storage file
const TRANSACTIONS_FILE_PATH = path.join(dataDir, 'transactions.json');

/**
 * TransactionManager
 * Manages signing transactions and their lifecycle
 */
class TransactionManager {
  constructor() {
    this.apiClient = new CongaApiClient();
    // Initialize with empty array as fallback
    this.transactions = [];
    // Load from storage
    try {
      this.transactions = this.loadTransactions();
    } catch (error) {
      console.error('Error initializing transactions:', error);
      // Keep the empty array if loading fails
    }
  }

  /**
   * Load transactions from storage
   * @returns {Array} Loaded transactions
   */
  loadTransactions() {
    try {
      if (fs.existsSync(TRANSACTIONS_FILE_PATH)) {
        const data = fs.readFileSync(TRANSACTIONS_FILE_PATH, 'utf8');
        const parsed = JSON.parse(data);
        // Make sure we return an array, even if data is corrupted
        return Array.isArray(parsed) ? parsed : [];
      } else {
        // Initialize with empty array if file doesn't exist
        this.saveTransactions([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  /**
   * Save transactions to storage
   * @param {Array} transactions - Transactions to save
   * @returns {boolean} Success status
   */
  saveTransactions(transactions) {
    try {
      fs.writeFileSync(
        TRANSACTIONS_FILE_PATH,
        JSON.stringify(transactions, null, 2),
        'utf8'
      );
      this.transactions = transactions;
      return true;
    } catch (error) {
      console.error('Error saving transactions:', error);
      return false;
    }
  }

  /**
   * Get all transactions
   * @param {boolean} refresh - Whether to refresh from API
   * @param {Object} options - Additional options for fetching transactions
   * @returns {Promise<Array>} All transactions
   */
  async getAllTransactions(refresh = false, options = {}) {
    // Initialize transactions if undefined
    if (!this.transactions) {
      this.transactions = [];
    }
    
    if (refresh) {
      try {
        // Make sure we're passing the proper options with URL-encoded email
        const listOptions = {
          from: options.from || 1,
          to: options.to || 100,
          // Email will be URL-encoded in the CongaApiClient.listPackages method
          ownerEmail: options.ownerEmail // If not provided, will use the platform email from config
        };
        
        console.log('Fetching transactions with options:', listOptions);
        const apiResponse = await this.apiClient.listPackages(listOptions);
        
        // Handle different response formats - the API could return packages or results array
        let packagesData = null;
        if (apiResponse && Array.isArray(apiResponse.packages)) {
          packagesData = apiResponse.packages;
          console.log(`Found ${packagesData.length} packages from API (packages array)`);
        } else if (apiResponse && Array.isArray(apiResponse.results)) {
          packagesData = apiResponse.results;
          console.log(`Found ${packagesData.length} packages from API (results array)`);
        } else {
          console.warn('API response did not contain packages or results array:', apiResponse);
          return [...this.transactions]; // Early return with current data
        }
        
        // Update local records with API data
        this.updateTransactionsFromApi(packagesData);
      } catch (error) {
        console.error('Error refreshing transactions from API:', error);
        // Continue with local data on error
      }
    }
    
    return [...this.transactions];
  }

  /**
   * Update local transaction records with data from API
   * @param {Array} apiPackages - Packages from API
   */
  updateTransactionsFromApi(apiPackages) {
    // Safety check
    if (!Array.isArray(apiPackages)) {
      console.error('updateTransactionsFromApi received non-array data:', apiPackages);
      return false;
    }
    
    // Make sure we have an array to work with
    const updatedTransactions = Array.isArray(this.transactions) ? [...this.transactions] : [];
    
    apiPackages.forEach(apiPackage => {
      // Log the structure of the first package to help debug
      if (apiPackages.indexOf(apiPackage) === 0) {
        console.log('Processing API package with structure:', 
          Object.keys(apiPackage).join(', '));
      }
      
      const existingIndex = updatedTransactions.findIndex(t => t.id === apiPackage.id);
      
      if (existingIndex >= 0) {
        // Update existing transaction
        updatedTransactions[existingIndex] = {
          ...updatedTransactions[existingIndex],
          status: apiPackage.status || apiPackage.typeAsString || 'UNKNOWN',
          updated: new Date().toISOString(),
          apiData: apiPackage
        };
      } else {
        // Add new transaction if we don't have it locally
        const signers = [];
        
        // Handle roles/signers data which might be in different formats
        if (apiPackage.roles && Array.isArray(apiPackage.roles)) {
          apiPackage.roles.forEach(role => {
            signers.push({
              id: role.id || role.uid || `role-${Math.random().toString(36).substring(2, 9)}`,
              name: role.name || `${role.firstName || ''} ${role.lastName || ''}`.trim() || 'Unknown',
              email: role.email || 'unknown@example.com',
              status: role.status || 'PENDING'
            });
          });
        }
        
        updatedTransactions.push({
          id: apiPackage.id,
          name: apiPackage.name || 'Unnamed Package',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: apiPackage.status || apiPackage.typeAsString || 'UNKNOWN',
          signers: signers,
          documents: [],
          apiData: apiPackage,
          history: [
            {
              action: 'DISCOVERED',
              timestamp: new Date().toISOString(),
              details: 'Transaction discovered from API'
            }
          ]
        });
      }
    });
    
    // Save updated transactions
    try {
      this.saveTransactions(updatedTransactions);
      return true;
    } catch (error) {
      console.error('Error saving updated transactions:', error);
      return false;
    }
  }

  /**
   * Get a transaction by ID
   * @param {string} id - Transaction ID
   * @param {boolean} refresh - Whether to refresh from API
   * @returns {Promise<Object|null>} The transaction or null if not found
   */
  async getTransactionById(id, refresh = false) {
    const localTransaction = this.transactions.find(t => t.id === id);
    
    if (refresh || !localTransaction) {
      try {
        // Try to get details from API
        const apiResponse = await this.apiClient.getTransactionDetails(id);
        
        if (apiResponse) {
          if (localTransaction) {
            // Update existing transaction
            const updatedTransaction = {
              ...localTransaction,
              status: apiResponse.status,
              updated: new Date().toISOString(),
              apiData: apiResponse
            };
            
            // Update transaction in the array
            const updatedTransactions = this.transactions.map(t => 
              t.id === id ? updatedTransaction : t
            );
            
            this.saveTransactions(updatedTransactions);
            return updatedTransaction;
          } else {
            // Create new transaction record
            const newTransaction = {
              id: apiResponse.id,
              name: apiResponse.name,
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              status: apiResponse.status,
              signers: apiResponse.roles ? apiResponse.roles.map(role => ({
                id: role.id,
                name: role.name,
                email: role.email,
                status: role.status || 'PENDING'
              })) : [],
              documents: [],
              apiData: apiResponse,
              history: [
                {
                  action: 'DISCOVERED',
                  timestamp: new Date().toISOString(),
                  details: 'Transaction discovered from API'
                }
              ]
            };
            
            // Add to transactions array
            const updatedTransactions = [...this.transactions, newTransaction];
            this.saveTransactions(updatedTransactions);
            return newTransaction;
          }
        }
      } catch (error) {
        console.error(`Error getting transaction ${id} from API:`, error);
        // Continue with local data on error
      }
    }
    
    return localTransaction || null;
  }

  /**
   * Create a new signature transaction
   * @param {Object} packageData - Package data
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(packageData) {
    try {
      const response = await this.apiClient.createPackage(packageData);
      
      // Create transaction record
      const transaction = {
        id: response.id,
        name: packageData.name || 'Signature Package',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: 'CREATED',
        signers: [],
        documents: [],
        apiData: response,
        history: [
          {
            action: 'CREATE',
            timestamp: new Date().toISOString(),
            details: 'Transaction created'
          }
        ]
      };
      
      // Save to transactions array
      const updatedTransactions = [...this.transactions, transaction];
      this.saveTransactions(updatedTransactions);
      
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Add a signer to a transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} signerData - Signer data
   * @returns {Promise<Object>} Updated transaction
   */
  async addSigner(transactionId, signerData) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Add signer via API
      const response = await this.apiClient.addSigner(transactionId, signerData);
      
      if (response && response.signers && response.signers.length > 0) {
        const apiSigner = response.signers[0];
        
        // Create signer record
        const signer = {
          id: apiSigner.id,
          name: `${signerData.firstName} ${signerData.lastName}`,
          email: signerData.email,
          role: apiSigner.id,
          status: 'PENDING',
          apiData: apiSigner
        };
        
        // Update transaction
        transaction.signers.push(signer);
        transaction.updated = new Date().toISOString();
        transaction.history.push({
          action: 'ADD_SIGNER',
          timestamp: new Date().toISOString(),
          details: `Added signer: ${signerData.firstName} ${signerData.lastName} (${signerData.email})`
        });
        
        // Save updated transaction
        const updatedTransactions = this.transactions.map(t =>
          t.id === transactionId ? transaction : t
        );
        this.saveTransactions(updatedTransactions);
      }
      
      return transaction;
    } catch (error) {
      console.error(`Error adding signer to transaction ${transactionId}:`, error);
      throw new Error(`Failed to add signer: ${error.message}`);
    }
  }

  /**
   * Add a document to a transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} file - Document file
   * @returns {Promise<Object>} Result with transaction and document ID
   */
  async addDocument(transactionId, file) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Add document via API
      const response = await this.apiClient.addDocument(transactionId, file);
      
      if (response && response.id) {
        // Create document record
        const document = {
          id: response.id,
          name: file.name || file.originalname || 'Document',
          type: file.type || file.mimetype || 'application/pdf',
          size: file.size,
          status: 'ADDED',
          apiData: response
        };
        
        // Update transaction
        transaction.documents.push(document);
        transaction.updated = new Date().toISOString();
        transaction.history.push({
          action: 'ADD_DOCUMENT',
          timestamp: new Date().toISOString(),
          details: `Added document: ${document.name} (ID: ${document.id})`
        });
        
        // Save updated transaction
        const updatedTransactions = this.transactions.map(t =>
          t.id === transactionId ? transaction : t
        );
        this.saveTransactions(updatedTransactions);
        
        return {
          transaction,
          documentId: document.id
        };
      } else {
        throw new Error('Invalid response from API when adding document');
      }
    } catch (error) {
      console.error(`Error adding document to transaction ${transactionId}:`, error);
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  /**
   * Add a signature field to a document
   * @param {string} transactionId - Transaction ID
   * @param {string} documentId - Document ID
   * @param {string} roleId - Role ID of the signer
   * @param {Object} fieldOptions - Field options
   * @returns {Promise<Object>} Updated transaction
   */
  async addSignatureField(transactionId, documentId, roleId, fieldOptions) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Verify document exists
      const documentExists = transaction.documents.some(doc => doc.id === documentId);
      if (!documentExists) {
        throw new Error(`Document not found in transaction: ${documentId}`);
      }
      
      // Verify role exists
      const signerExists = transaction.signers.some(signer => signer.role === roleId);
      if (!signerExists) {
        throw new Error(`Signer role not found in transaction: ${roleId}`);
      }
      
      // Add signature field via API
      await this.apiClient.addSignatureField(transactionId, documentId, roleId, fieldOptions);
      
      // Update transaction
      transaction.updated = new Date().toISOString();
      transaction.history.push({
        action: 'ADD_SIGNATURE_FIELD',
        timestamp: new Date().toISOString(),
        details: `Added signature field to document ${documentId} for role ${roleId}`
      });
      
      // Save updated transaction
      const updatedTransactions = this.transactions.map(t =>
        t.id === transactionId ? transaction : t
      );
      this.saveTransactions(updatedTransactions);
      
      return transaction;
    } catch (error) {
      console.error(`Error adding signature field to document ${documentId}:`, error);
      throw new Error(`Failed to add signature field: ${error.message}`);
    }
  }

  /**
   * Send a transaction for signing
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Updated transaction
   */
  async sendTransaction(transactionId) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Send package via API
      await this.apiClient.sendPackage(transactionId);
      
      // Update transaction
      transaction.status = 'SENT';
      transaction.updated = new Date().toISOString();
      transaction.history.push({
        action: 'SEND',
        timestamp: new Date().toISOString(),
        details: 'Transaction sent for signing'
      });
      
      // Save updated transaction
      const updatedTransactions = this.transactions.map(t =>
        t.id === transactionId ? transaction : t
      );
      this.saveTransactions(updatedTransactions);
      
      return transaction;
    } catch (error) {
      console.error(`Error sending transaction ${transactionId}:`, error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  /**
   * Refresh a transaction's status from the API
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Updated transaction
   */
  async refreshTransactionStatus(transactionId) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Get signing status from API
      const statusResponse = await this.apiClient.getSigningStatus(transactionId);
      
      if (statusResponse) {
        // Update transaction status
        const previousStatus = transaction.status;
        transaction.status = statusResponse.status || transaction.status;
        
        // Update signers status
        if (statusResponse.signers) {
          statusResponse.signers.forEach(apiSigner => {
            const signer = transaction.signers.find(s => s.id === apiSigner.id);
            if (signer) {
              signer.status = apiSigner.status || signer.status;
            }
          });
        }
        
        transaction.updated = new Date().toISOString();
        transaction.history.push({
          action: 'REFRESH_STATUS',
          timestamp: new Date().toISOString(),
          details: `Status updated from '${previousStatus}' to '${transaction.status}'`
        });
        
        // Save updated transaction
        const updatedTransactions = this.transactions.map(t =>
          t.id === transactionId ? transaction : t
        );
        this.saveTransactions(updatedTransactions);
      }
      
      return transaction;
    } catch (error) {
      console.error(`Error refreshing transaction status for ${transactionId}:`, error);
      throw new Error(`Failed to refresh transaction status: ${error.message}`);
    }
  }

  /**
   * Resend notification to a signer
   * @param {string} transactionId - Transaction ID
   * @param {string} email - Signer email
   * @param {string} message - Custom message
   * @returns {Promise<Object>} Updated transaction
   */
  async resendNotification(transactionId, email, message) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Check if signer exists
      const signer = transaction.signers.find(s => s.email === email);
      if (!signer) {
        throw new Error(`Signer with email ${email} not found in transaction`);
      }
      
      // Resend notification via API
      await this.apiClient.resendNotification(transactionId, {
        email,
        message: message || `Please sign ${transaction.name}`
      });
      
      // Update transaction
      transaction.updated = new Date().toISOString();
      transaction.history.push({
        action: 'RESEND_NOTIFICATION',
        timestamp: new Date().toISOString(),
        details: `Notification resent to ${email}`
      });
      
      // Save updated transaction
      const updatedTransactions = this.transactions.map(t =>
        t.id === transactionId ? transaction : t
      );
      this.saveTransactions(updatedTransactions);
      
      return transaction;
    } catch (error) {
      console.error(`Error resending notification for transaction ${transactionId}:`, error);
      throw new Error(`Failed to resend notification: ${error.message}`);
    }
  }

  /**
   * Cancel (delete) a transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelTransaction(transactionId) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Cancel package via API
      await this.apiClient.cancelPackage(transactionId);
      
      // Update transaction
      transaction.status = 'CANCELED';
      transaction.updated = new Date().toISOString();
      transaction.history.push({
        action: 'CANCEL',
        timestamp: new Date().toISOString(),
        details: 'Transaction canceled'
      });
      
      // Save updated transaction
      const updatedTransactions = this.transactions.map(t =>
        t.id === transactionId ? transaction : t
      );
      this.saveTransactions(updatedTransactions);
      
      return true;
    } catch (error) {
      console.error(`Error canceling transaction ${transactionId}:`, error);
      throw new Error(`Failed to cancel transaction: ${error.message}`);
    }
  }

  /**
   * Get signing URL for a signer
   * @param {string} transactionId - Transaction ID
   * @param {string} roleId - Role ID
   * @returns {Promise<string>} Signing URL
   */
  async getSigningUrl(transactionId, roleId) {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }
      
      // Check if role exists
      const signer = transaction.signers.find(s => s.role === roleId);
      if (!signer) {
        throw new Error(`Signer role ${roleId} not found in transaction`);
      }
      
      // Get signing URL from API
      const response = await this.apiClient.getSigningUrl(transactionId, roleId);
      
      if (response && response.url) {
        // Update transaction history
        transaction.updated = new Date().toISOString();
        transaction.history.push({
          action: 'GET_SIGNING_URL',
          timestamp: new Date().toISOString(),
          details: `Generated signing URL for role ${roleId}`
        });
        
        // Save updated transaction
        const updatedTransactions = this.transactions.map(t =>
          t.id === transactionId ? transaction : t
        );
        this.saveTransactions(updatedTransactions);
        
        return response.url;
      } else {
        throw new Error('Signing URL not found in API response');
      }
    } catch (error) {
      console.error(`Error getting signing URL for transaction ${transactionId}:`, error);
      throw new Error(`Failed to get signing URL: ${error.message}`);
    }
  }

  /**
   * Reset all transactions data
   * @returns {boolean} Success status
   */
  reset() {
    return this.saveTransactions([]);
  }
}

export default TransactionManager;