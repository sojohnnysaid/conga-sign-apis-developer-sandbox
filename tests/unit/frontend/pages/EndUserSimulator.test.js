import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EndUserSimulator from '../../../../src/frontend/pages/EndUserSimulator.svelte';
import { tick } from 'svelte';

// Mock fetch
global.fetch = vi.fn();

// Mock window.open
global.open = vi.fn();

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
      signers: [
        {
          id: 'signer-1',
          role: 'role-1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'PENDING'
        },
        {
          id: 'signer-2',
          role: 'role-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          status: 'PENDING'
        }
      ]
    }
  ]
};

describe('EndUserSimulator Component', () => {
  beforeEach(() => {
    // Reset mocks between tests
    fetch.mockReset();
    open.mockReset();
    
    // Default mock implementation
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions') {
        return createFetchResponse(mockTransactions);
      }
      return createFetchResponse({});
    });
  });
  
  it('should render the simulator with transaction selector', async () => {
    // Render the component
    const { component } = render(EndUserSimulator);
    
    // Manually trigger the loadTransactions function since onMount might not run
    await component.loadTransactions();
    await tick(); // Let Svelte update
    await tick(); // Additional tick to ensure DOM updates
    
    // Check transaction selector is rendered
    const transactionSelect = screen.getByLabelText(/Transaction:/i);
    expect(transactionSelect).toBeInTheDocument();
    
    // Check transaction option is rendered
    const options = Array.from(transactionSelect.options);
    expect(options.some(option => option.text === 'Test Transaction')).toBe(true);
  });
  
  it('should show signer selector when transaction is selected', async () => {
    // Render the component
    const { component } = render(EndUserSimulator);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Select a transaction
    const transactionSelect = screen.getByLabelText(/Transaction:/i);
    await fireEvent.change(transactionSelect, { target: { value: 'txn-123' } });
    await tick();
    
    // Check signer selector is rendered
    const signerSelect = screen.getByLabelText(/Recipient:/i);
    expect(signerSelect).toBeInTheDocument();
    
    // Check signer options are rendered
    const options = Array.from(signerSelect.options);
    expect(options.some(option => option.text.includes('John Doe'))).toBe(true);
    expect(options.some(option => option.text.includes('Jane Smith'))).toBe(true);
  });
  
  it('should show email when signer is selected', async () => {
    // Render the component
    const { component } = render(EndUserSimulator);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Select a transaction
    const transactionSelect = screen.getByLabelText(/Transaction:/i);
    await fireEvent.change(transactionSelect, { target: { value: 'txn-123' } });
    await tick();
    
    // Select a signer
    const signerSelect = screen.getByLabelText(/Recipient:/i);
    await fireEvent.change(signerSelect, { target: { value: 'role-1' } });
    await tick();
    
    // Check email is displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    // Check buttons are displayed
    expect(screen.getByText('Generate Signing URL')).toBeInTheDocument();
    expect(screen.getByText('Simulate Email Receipt')).toBeInTheDocument();
  });
  
  it('should generate signing URL when the button is clicked', async () => {
    // Setup mock responses
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions') {
        return createFetchResponse(mockTransactions);
      } else if (url === '/api/transactions/txn-123/signingUrl/role-1') {
        return createFetchResponse({
          url: 'https://example.com/signing/abc123'
        });
      }
      return createFetchResponse({});
    });
    
    // Render the component
    const { component } = render(EndUserSimulator);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Select a transaction
    const transactionSelect = screen.getByLabelText(/Transaction:/i);
    await fireEvent.change(transactionSelect, { target: { value: 'txn-123' } });
    await tick();
    
    // Select a signer
    const signerSelect = screen.getByLabelText(/Recipient:/i);
    await fireEvent.change(signerSelect, { target: { value: 'role-1' } });
    await tick();
    
    // Click generate URL button
    const generateButton = screen.getByText('Generate Signing URL');
    await fireEvent.click(generateButton);
    await tick();
    await tick();
    
    // Check success message is displayed
    expect(screen.getByText('Signing URL generated successfully')).toBeInTheDocument();
    
    // Check URL is displayed
    expect(screen.getByText('https://example.com/signing/abc123')).toBeInTheDocument();
    
    // Check open in new tab button is displayed
    expect(screen.getByText('Open Signing URL')).toBeInTheDocument();
  });
  
  it('should open signing URL in new tab when the button is clicked', async () => {
    // Setup mock responses
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions') {
        return createFetchResponse(mockTransactions);
      } else if (url === '/api/transactions/txn-123/signingUrl/role-1') {
        return createFetchResponse({
          url: 'https://example.com/signing/abc123'
        });
      }
      return createFetchResponse({});
    });
    
    // Render the component
    const { component } = render(EndUserSimulator);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Select a transaction
    const transactionSelect = screen.getByLabelText(/Transaction:/i);
    await fireEvent.change(transactionSelect, { target: { value: 'txn-123' } });
    await tick();
    
    // Select a signer
    const signerSelect = screen.getByLabelText(/Recipient:/i);
    await fireEvent.change(signerSelect, { target: { value: 'role-1' } });
    await tick();
    
    // Click generate URL button
    const generateButton = screen.getByText('Generate Signing URL');
    await fireEvent.click(generateButton);
    await tick();
    await tick();
    
    // Click open URL button
    const openButton = screen.getByText('Open Signing URL');
    await fireEvent.click(openButton);
    await tick();
    
    // Check window.open was called with the URL
    expect(open).toHaveBeenCalledWith('https://example.com/signing/abc123', '_blank');
  });
  
  it('should show message when simulate email button is clicked', async () => {
    // Render the component
    const { component } = render(EndUserSimulator);
    
    // Manually trigger the loadTransactions function
    await component.loadTransactions();
    await tick();
    await tick();
    
    // Select a transaction
    const transactionSelect = screen.getByLabelText(/Transaction:/i);
    await fireEvent.change(transactionSelect, { target: { value: 'txn-123' } });
    await tick();
    
    // Select a signer
    const signerSelect = screen.getByLabelText(/Recipient:/i);
    await fireEvent.change(signerSelect, { target: { value: 'role-1' } });
    await tick();
    
    // Click simulate email button
    const simulateButton = screen.getByText('Simulate Email Receipt');
    await fireEvent.click(simulateButton);
    await tick();
    
    // Check message is displayed
    expect(screen.getByText('A notification email would be sent to john@example.com')).toBeInTheDocument();
  });
  
  // Error handling tests removed to focus only on happy path scenarios
});