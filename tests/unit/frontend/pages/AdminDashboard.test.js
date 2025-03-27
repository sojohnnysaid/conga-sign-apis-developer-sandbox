import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AdminDashboard from '../../../../src/frontend/pages/AdminDashboard.svelte';
import { tick } from 'svelte';

// Mock fetch
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn();

function createFetchResponse(data) {
  return { 
    json: () => Promise.resolve(data),
    ok: true
  };
}

// Sample transaction data
const mockTransactions = {
  transactions: [
    {
      id: 'txn-123',
      name: 'Test Transaction',
      status: 'SENT',
      created: '2024-03-25T10:00:00Z',
      updated: '2024-03-25T10:05:00Z',
      signers: [
        {
          id: 'signer-1',
          role: 'role-1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'PENDING'
        }
      ],
      documents: [
        {
          id: 'doc-1',
          name: 'Contract.pdf',
          type: 'application/pdf'
        }
      ],
      history: [
        {
          action: 'CREATE',
          timestamp: '2024-03-25T10:00:00Z',
          details: 'Transaction created'
        },
        {
          action: 'SEND',
          timestamp: '2024-03-25T10:05:00Z',
          details: 'Transaction sent for signing'
        }
      ]
    }
  ]
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    // Reset mocks between tests
    fetch.mockReset();
    confirm.mockReset();
    
    // Setup default mock response for fetch
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions' && !options) {
        return createFetchResponse(mockTransactions);
      }
      return createFetchResponse({});
    });
  });
  
  it('should render the dashboard with transaction list', async () => {
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function since onMount might not run
    await component.loadTransactions();
    await tick(); // Let Svelte update
    await tick(); // Additional tick to ensure DOM updates
    
    // Check that transaction list is rendered
    expect(screen.getByText('Test Transaction')).toBeInTheDocument();
    expect(screen.getByText('SENT')).toBeInTheDocument();
  });
  
  it('should load transaction details when a transaction is clicked', async () => {
    // Setup more specific mock responses
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions' && !options) {
        return createFetchResponse(mockTransactions);
      } else if (url === '/api/transactions/txn-123?refresh=true') {
        return createFetchResponse({
          transaction: mockTransactions.transactions[0]
        });
      }
      return createFetchResponse({});
    });
    
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function 
    await component.loadTransactions();
    await tick(); // Let Svelte update
    await tick(); // Additional tick to ensure DOM updates
    
    // Find and click on a transaction
    const transactionItem = screen.getByText('Test Transaction');
    await fireEvent.click(transactionItem);
    await tick();
    await tick();
    
    // Check details are displayed
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Signers')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
  });
  
  it('should refresh transaction status when refresh button is clicked', async () => {
    // Setup more detailed mock responses
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions' && !options) {
        return createFetchResponse(mockTransactions);
      } else if (url === '/api/transactions/txn-123?refresh=true') {
        return createFetchResponse({
          transaction: mockTransactions.transactions[0]
        });
      } else if (url === '/api/transactions/txn-123/refresh' && options?.method === 'POST') {
        return createFetchResponse({
          transaction: {
            ...mockTransactions.transactions[0],
            status: 'COMPLETED'
          }
        });
      } else if (url === '/api/transactions' && options?.method === 'GET') {
        return createFetchResponse({
          transactions: [
            {
              ...mockTransactions.transactions[0],
              status: 'COMPLETED'
            }
          ]
        });
      }
      return createFetchResponse({});
    });
    
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Find and click on a transaction
    const transactionItem = screen.getByText('Test Transaction');
    await fireEvent.click(transactionItem);
    await tick();
    await tick();
    
    // Find and click the refresh button
    const refreshButton = screen.getByText('Refresh Status');
    await fireEvent.click(refreshButton);
    await tick();
    await tick();
    
    // Check success message is displayed
    expect(screen.getByText('Transaction status refreshed')).toBeInTheDocument();
  });
  
  it('should cancel transaction when cancel button is clicked and confirmed', async () => {
    // Setup mock responses
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions' && !options) {
        return createFetchResponse(mockTransactions);
      } else if (url === '/api/transactions/txn-123?refresh=true') {
        return createFetchResponse({
          transaction: mockTransactions.transactions[0]
        });
      } else if (url === '/api/transactions/txn-123' && options?.method === 'DELETE') {
        return createFetchResponse({
          success: true,
          message: 'Transaction cancelled successfully'
        });
      } else if (url === '/api/transactions/txn-123' && !options?.method) {
        return createFetchResponse({
          transaction: {
            ...mockTransactions.transactions[0],
            status: 'CANCELED'
          }
        });
      }
      return createFetchResponse({});
    });
    
    // Mock confirm to return true (user confirms)
    confirm.mockReturnValueOnce(true);
    
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Find and click on a transaction
    const transactionItem = screen.getByText('Test Transaction');
    await fireEvent.click(transactionItem);
    await tick();
    await tick();
    
    // Find and click the cancel button
    const cancelButton = screen.getByText('Cancel Transaction');
    await fireEvent.click(cancelButton);
    await tick();
    await tick();
    
    // Check confirm was called
    expect(confirm).toHaveBeenCalled();
    
    // Check success message is displayed
    expect(screen.getByText('Transaction cancelled successfully')).toBeInTheDocument();
  });
  
  it('should not cancel transaction when cancel button is clicked but not confirmed', async () => {
    // Setup mock responses
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions' && !options) {
        return createFetchResponse(mockTransactions);
      } else if (url === '/api/transactions/txn-123?refresh=true') {
        return createFetchResponse({
          transaction: mockTransactions.transactions[0]
        });
      }
      return createFetchResponse({});
    });
    
    // Mock confirm to return false (user cancels)
    confirm.mockReturnValueOnce(false);
    
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Find and click on a transaction
    const transactionItem = screen.getByText('Test Transaction');
    await fireEvent.click(transactionItem);
    await tick();
    await tick();
    
    // Spy on fetch to ensure it's not called for DELETE
    const fetchSpy = vi.spyOn(global, 'fetch');
    
    // Find and click the cancel button
    const cancelButton = screen.getByText('Cancel Transaction');
    await fireEvent.click(cancelButton);
    await tick();
    
    // Check confirm was called
    expect(confirm).toHaveBeenCalled();
    
    // Verify DELETE request was not made
    expect(
      fetchSpy.mock.calls.find(
        call => call[0] === '/api/transactions/txn-123' && 
        call[1]?.method === 'DELETE'
      )
    ).toBeFalsy();
  });
});