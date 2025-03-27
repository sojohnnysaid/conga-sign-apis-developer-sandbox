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
    
    // Setup default mock response for fetch - return empty transactions
    fetch.mockImplementation(async (url) => {
      return createFetchResponse({ transactions: [] });
    });
  });
  
  it('should render the dashboard', async () => {
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function since onMount might not run
    await component.loadTransactions();
    await tick(); // Let Svelte update
    await tick(); // Additional tick to ensure DOM updates
    
    // Check that dashboard is rendered with expected titles
    expect(screen.getByText('Transaction Administration')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    
    // Check refresh button exists
    expect(screen.getByText('Refresh List')).toBeInTheDocument();
  });
  
  it('should render the empty state when no transactions', async () => {
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Check empty state message is displayed
    expect(screen.getByText('No transactions found')).toBeInTheDocument();
  });
  
  it('should show the empty details state', async () => {
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Check empty details message is displayed
    expect(screen.getByText('Select a transaction to view details')).toBeInTheDocument();
  });
  
  it('should have a refresh button', async () => {
    // Render the component
    render(AdminDashboard);
    
    // Find the refresh button
    const refreshButton = screen.getByText('Refresh List');
    expect(refreshButton).toBeInTheDocument();
  });
  
  it('should export the loadTransactions method', () => {
    // Render the component
    const { component } = render(AdminDashboard);
    
    // Check that the loadTransactions method is exported and is a function
    expect(typeof component.loadTransactions).toBe('function');
  });
});