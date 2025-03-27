import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CongaApiClient from './CongaApiClient.js';

// Setup __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the transactions file
const TRANSACTIONS_FILE_PATH = path.join(__dirname, '..', '..', '..', 'transactions.json');

class TransactionManager {
  constructor() {
    this.apiClient = new CongaApiClient();
    this.transactions = this.loadTransactions();
  }

  /**
   * Load transactions from JSON file
   * @returns {Array} The transactions array
   */
  loadTransactions() {
    try {
      // Check if file exists
      if (fs.existsSync(TRANSACTIONS_FILE_PATH)) {
        const transactionsData = fs.readFileSync(TRANSACTIONS_FILE_PATH, 'utf8');
        return JSON.parse(transactionsData);
      } else {
        // If file doesn't exist, create it with empty array
        this.saveTransactions([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Return empty array if there's an error
      return [];
    }
  }

  /**
   * Save transactions to JSON file
   * @param {Array} transactions - Transactions array to save
   */
  saveTransactions(transactions) {
    try {
      fs.writeFileSync(
        TRANSACTIONS_FILE_PATH, 
        JSON.stringify(transactions, null, 2), 
        'utf8'
      );
      this.transactions = transactions;
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw new Error('Failed to save transactions');
    }
  }

  /**
   * Get all transactions
   * @returns {Array} List of transactions
   */
  getAllTransactions() {
    return [...this.transactions];
  }

  /**
   * Add or update a transaction
   * @param {Object} transaction - Transaction object to add/update
   * @returns {Array} Updated list of transactions
   */
  updateTransaction(transaction) {
    // Check if transaction already exists
    const index = this.transactions.findIndex(t => t.id === transaction.id);
    
    if (index !== -1) {
      // Update existing transaction
      this.transactions[index] = { ...this.transactions[index], ...transaction };
    } else {
      // Add new transaction
      this.transactions.push(transaction);
    }
    
    this.saveTransactions(this.transactions);
    return this.getAllTransactions();
  }

  /**
   * Get a transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Transaction object or null if not found
   */
  getTransactionById(transactionId) {
    return this.transactions.find(t => t.id === transactionId) || null;
  }

  /**
   * Resend a transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Updated transaction
   */
  async resend(transactionId) {
    try {
      const transaction = this.getTransactionById(transactionId);
      
      if (!transaction) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }
      
      // Check if transaction is in a resendable state
      if (transaction.status === 'CANCELLED' || transaction.status === 'COMPLETED') {
        throw new Error(`Cannot resend transaction with status: ${transaction.status}`);
      }
      
      // Call the API to resend
      await this.apiClient.resendTransaction(transactionId);
      
      // Update local record
      const updatedTransaction = {
        ...transaction,
        resendCount: (transaction.resendCount || 0) + 1,
        lastResent: new Date().toISOString()
      };
      
      this.updateTransaction(updatedTransaction);
      return updatedTransaction;
    } catch (error) {
      console.error(`Error resending transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Updated transaction
   */
  async cancel(transactionId) {
    try {
      const transaction = this.getTransactionById(transactionId);
      
      if (!transaction) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }
      
      // Check if transaction is in a cancellable state
      if (transaction.status === 'CANCELLED' || transaction.status === 'COMPLETED') {
        throw new Error(`Cannot cancel transaction with status: ${transaction.status}`);
      }
      
      // Call the API to cancel
      await this.apiClient.cancelTransaction(transactionId);
      
      // Update local record
      const updatedTransaction = {
        ...transaction,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString()
      };
      
      this.updateTransaction(updatedTransaction);
      return updatedTransaction;
    } catch (error) {
      console.error(`Error cancelling transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a transaction as completed (for simulation)
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Updated transaction
   */
  completeTransaction(transactionId) {
    const transaction = this.getTransactionById(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }
    
    // Check if transaction is in a completable state
    if (transaction.status === 'CANCELLED' || transaction.status === 'COMPLETED') {
      throw new Error(`Cannot complete transaction with status: ${transaction.status}`);
    }
    
    // Update transaction status
    const updatedTransaction = {
      ...transaction,
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    };
    
    this.updateTransaction(updatedTransaction);
    return updatedTransaction;
  }

  /**
   * Reset transactions to empty array
   * @returns {Array} Empty array
   */
  reset() {
    this.saveTransactions([]);
    return this.getAllTransactions();
  }

  /**
   * Create a demo transaction for testing
   * @param {Object} transactionData - Basic transaction data
   * @returns {Object} Created transaction
   */
  createDemoTransaction(transactionData = {}) {
    const demoTransaction = {
      id: `demo-${Date.now()}`,
      name: transactionData.name || 'Demo Contract',
      recipient: transactionData.recipient || 'recipient@example.com',
      status: 'SENT',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      resendCount: 0,
      ...transactionData
    };
    
    this.updateTransaction(demoTransaction);
    return demoTransaction;
  }
}

export default TransactionManager;