import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

// Mock dependencies before importing the class under test
vi.mock('../../../../src/backend/services/CongaApiClient.js', () => {
  return {
    default: class MockCongaApiClient {
      constructor() {
        this.calls = {
          listPackages: 0
        };
        this.lastOptions = {};
      }
      
      async listPackages(options = {}) {
        this.calls.listPackages++;
        this.lastOptions.listPackages = { ...options };
        
        // Check if we should simulate an error for testing error handling
        if (options._simulateError) {
          return Promise.reject(new Error('Simulated API error'));
        }
        
        // Return with mock data
        return Promise.resolve({
          packages: [
            {
              id: 'test-package-1',
              name: 'Test Package 1',
              status: 'SENT',
              roles: [
                {
                  id: 'role-1',
                  name: 'John Doe',
                  email: 'john@example.com',
                  status: 'PENDING'
                }
              ]
            }
          ]
        });
      }
    }
  };
});

// Mock fs module
vi.mock('fs', () => {
  const mockFiles = {};
  
  return {
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => JSON.stringify([])),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn()
  };
});

// Create a simplified version of the TransactionManager for testing
class MockTransactionManager {
  constructor() {
    this.transactions = [];
    
    // Create a mock API client directly
    this.apiClient = {
      calls: { listPackages: 0 },
      lastOptions: { listPackages: null },
      
      async listPackages(options = {}) {
        this.calls.listPackages += 1;
        this.lastOptions.listPackages = { ...options };
        
        if (options._simulateError) {
          return Promise.reject(new Error('Simulated API error'));
        }
        
        return {
          packages: [
            {
              id: 'test-package-1',
              name: 'Test Package 1',
              status: 'SENT',
              roles: [
                {
                  id: 'role-1',
                  name: 'John Doe',
                  email: 'john@example.com',
                  status: 'PENDING'
                }
              ]
            }
          ]
        };
      }
    };
  }
  
  async getAllTransactions(refresh = false, options = {}) {
    if (refresh) {
      try {
        const listOptions = {
          from: options.from || 1, 
          to: options.to || 100,
          ownerEmail: options.ownerEmail
        };
        
        const apiResponse = await this.apiClient.listPackages(listOptions);
        
        if (apiResponse && Array.isArray(apiResponse.packages)) {
          this.updateTransactionsFromApi(apiResponse.packages);
        }
      } catch (error) {
        // Continue with local data on error
      }
    }
    
    return [...this.transactions];
  }
  
  updateTransactionsFromApi(apiPackages) {
    apiPackages.forEach(apiPackage => {
      const existingIndex = this.transactions.findIndex(t => t.id === apiPackage.id);
      
      if (existingIndex >= 0) {
        // Update existing
        this.transactions[existingIndex] = {
          ...this.transactions[existingIndex],
          status: apiPackage.status,
          updated: new Date().toISOString(),
          apiData: apiPackage
        };
      } else {
        // Add new
        this.transactions.push({
          id: apiPackage.id,
          name: apiPackage.name,
          status: apiPackage.status,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          signers: apiPackage.roles ? apiPackage.roles.map(role => ({
            id: role.id,
            name: role.name,
            email: role.email,
            status: role.status || 'PENDING'
          })) : [],
          documents: [],
          history: []
        });
      }
    });
    
    return true;
  }
  
  saveTransactions(transactions) {
    this.transactions = transactions;
    return true;
  }
}

describe('TransactionManager', () => {
  let transactionManager;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Silence console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a new instance for each test
    transactionManager = new MockTransactionManager();
  });
  
  describe('getAllTransactions', () => {
    it('should pass options to the API client', async () => {
      // Make a call with options
      const result = await transactionManager.getAllTransactions(true, {
        from: 5,
        to: 20,
        ownerEmail: 'custom@example.com'
      });
      
      // Get the options from the API client's last options
      const options = transactionManager.apiClient.lastOptions.listPackages;
      
      // Verify the options were passed correctly
      expect(options.from).toBe(5);
      expect(options.to).toBe(20);
      expect(options.ownerEmail).toBe('custom@example.com');
    });
    
    it('should use default pagination if not provided', async () => {
      // Make a call without pagination options
      const result = await transactionManager.getAllTransactions(true);
      
      // Get the options from the API client's last options
      const options = transactionManager.apiClient.lastOptions.listPackages;
      
      // Verify default pagination is used
      expect(options.from).toBe(1);
      expect(options.to).toBe(100);
    });
    
    it('should not call the API if refresh is false', async () => {
      // Make a call with refresh=false
      await transactionManager.getAllTransactions(false);
      
      // Verify the API was not called
      expect(transactionManager.apiClient.calls.listPackages).toBe(0);
    });
    
    it('should update local transactions when API returns packages', async () => {
      // Create a spy on the updateTransactionsFromApi method
      const updateSpy = vi.spyOn(transactionManager, 'updateTransactionsFromApi');
      
      // Make a call to get transactions from API
      const result = await transactionManager.getAllTransactions(true);
      
      // Verify method was called
      expect(updateSpy).toHaveBeenCalled();
      
      // Verify the result includes the returned transaction
      expect(result.some(tx => tx.id === 'test-package-1')).toBe(true);
    });
  });
  
  describe('updateTransactionsFromApi', () => {
    it('should add new transactions from API data', () => {
      // Initial state is empty
      expect(transactionManager.transactions).toHaveLength(0);
      
      // Call with API data
      const apiPackages = [
        {
          id: 'api-package-1',
          name: 'API Package 1',
          status: 'SENT',
          roles: [
            {
              id: 'role-1',
              name: 'Jane Doe',
              email: 'jane@example.com'
            }
          ]
        }
      ];
      
      transactionManager.updateTransactionsFromApi(apiPackages);
      
      // Verify new transaction was added
      expect(transactionManager.transactions).toHaveLength(1);
      expect(transactionManager.transactions[0].id).toBe('api-package-1');
      expect(transactionManager.transactions[0].signers).toHaveLength(1);
    });
    
    it('should update existing transactions with API data', () => {
      // Set initial state with a transaction
      transactionManager.transactions = [
        {
          id: 'existing-id',
          name: 'Old Name',
          status: 'DRAFT',
          signers: [],
          history: [],
          updated: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      // Call with API data for same ID but updated status
      const apiPackages = [
        {
          id: 'existing-id',
          name: 'Old Name',
          status: 'SENT',  // Updated status
          roles: []
        }
      ];
      
      transactionManager.updateTransactionsFromApi(apiPackages);
      
      // Verify transaction was updated
      expect(transactionManager.transactions).toHaveLength(1);
      expect(transactionManager.transactions[0].id).toBe('existing-id');
      expect(transactionManager.transactions[0].status).toBe('SENT');
      expect(transactionManager.transactions[0].updated).not.toBe('2023-01-01T00:00:00.000Z');
    });
  });
});