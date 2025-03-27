<script>
  import { onMount } from 'svelte';

  // State variables
  let transactions = [];
  let loading = false;
  let error = null;
  let selectedTransaction = null;
  let detailsLoading = false;
  let message = '';
  let messageType = 'info';
  
  // API URL
  const API_URL = 'http://localhost:3000/api';
  
  // Load all transactions
  export async function loadTransactions(refresh = false) {
    try {
      loading = true;
      error = null;
      
      const url = `${API_URL}/transactions${refresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      transactions = data.transactions || [];
    } catch (err) {
      console.error('Error loading transactions:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  // Load transaction details
  async function loadTransactionDetails(id) {
    try {
      detailsLoading = true;
      error = null;
      
      const response = await fetch(`${API_URL}/transactions/${id}?refresh=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to load transaction details: ${response.statusText}`);
      }
      
      const data = await response.json();
      selectedTransaction = data.transaction;
    } catch (err) {
      console.error(`Error loading transaction ${id}:`, err);
      error = err.message;
    } finally {
      detailsLoading = false;
    }
  }
  
  // Refresh a transaction's status
  async function refreshTransaction(id) {
    try {
      detailsLoading = true;
      error = null;
      
      const response = await fetch(`${API_URL}/transactions/${id}/refresh`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh transaction: ${response.statusText}`);
      }
      
      const data = await response.json();
      selectedTransaction = data.transaction;
      showMessage('Transaction status refreshed', 'success');
      
      // Also refresh the main list
      await loadTransactions();
    } catch (err) {
      console.error(`Error refreshing transaction ${id}:`, err);
      error = err.message;
      showMessage(`Error: ${err.message}`, 'error');
    } finally {
      detailsLoading = false;
    }
  }
  
  // Cancel a transaction
  async function cancelTransaction(id) {
    if (!confirm('Are you sure you want to cancel this transaction? This action cannot be undone.')) {
      return;
    }
    
    try {
      detailsLoading = true;
      error = null;
      
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel transaction: ${response.statusText}`);
      }
      
      showMessage('Transaction cancelled successfully', 'success');
      
      // Refresh both the transaction details and the list
      await loadTransactionDetails(id);
      await loadTransactions();
    } catch (err) {
      console.error(`Error cancelling transaction ${id}:`, err);
      error = err.message;
      showMessage(`Error: ${err.message}`, 'error');
    } finally {
      detailsLoading = false;
    }
  }
  
  // Resend notification to a signer
  async function resendNotification(id, email) {
    try {
      detailsLoading = true;
      error = null;
      
      const response = await fetch(`${API_URL}/transactions/${id}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          message: `Please sign the document (${new Date().toLocaleString()})`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to resend notification: ${response.statusText}`);
      }
      
      showMessage(`Notification resent to ${email}`, 'success');
      
      // Refresh the transaction details
      await loadTransactionDetails(id);
    } catch (err) {
      console.error(`Error resending notification for transaction ${id}:`, err);
      error = err.message;
      showMessage(`Error: ${err.message}`, 'error');
    } finally {
      detailsLoading = false;
    }
  }
  
  // Get signing URL for a signer
  async function getSigningUrl(id, roleId) {
    try {
      detailsLoading = true;
      error = null;
      
      const response = await fetch(`${API_URL}/transactions/${id}/signingUrl/${roleId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get signing URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.url) {
        showMessage('Signing URL generated', 'success');
        window.open(data.url, '_blank');
      } else {
        throw new Error('No signing URL returned');
      }
    } catch (err) {
      console.error(`Error getting signing URL for transaction ${id}:`, err);
      error = err.message;
      showMessage(`Error: ${err.message}`, 'error');
    } finally {
      detailsLoading = false;
    }
  }
  
  // Display a message
  function showMessage(text, type = 'info') {
    message = text;
    messageType = type;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      message = '';
    }, 5000);
  }
  
  // Format date string
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (err) {
      return dateString;
    }
  }
  
  // Select a transaction to view details
  function selectTransaction(transaction) {
    loadTransactionDetails(transaction.id);
  }
  
  // Get status badge color
  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Get signer status badge color
  function getSignerStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Load transactions on component initialization
  onMount(() => {
    loadTransactions();
  });
</script>

<div class="admin-dashboard">
  <h2>Transaction Administration</h2>
  
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}
  
  <div class="dashboard-layout">
    <!-- Transaction List -->
    <div class="transaction-list-container">
      <div class="list-header">
        <h3>Transactions</h3>
        <button 
          on:click={() => loadTransactions(true)} 
          disabled={loading}
          class="refresh-btn"
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>
      
      {#if loading}
        <div class="loading">Loading transactions...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else if transactions.length === 0}
        <div class="empty-state">
          <p>No transactions found</p>
          <p class="empty-action">Transactions created via the API will appear here</p>
        </div>
      {:else}
        <div class="transaction-list">
          {#each transactions as transaction (transaction.id)}
            <div 
              class="transaction-item" 
              class:selected={selectedTransaction && selectedTransaction.id === transaction.id}
              on:click={() => selectTransaction(transaction)}
            >
              <div class="item-header">
                <span class="item-title">{transaction.name}</span>
                <span class="status-badge {getStatusColor(transaction.status)}">
                  {transaction.status || 'Unknown'}
                </span>
              </div>
              <div class="item-details">
                <div class="item-meta">ID: {transaction.id}</div>
                <div class="item-meta">
                  Created: {formatDate(transaction.created)}
                </div>
                <div class="item-meta">
                  Updated: {formatDate(transaction.updated)}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Transaction Details -->
    <div class="transaction-details-container">
      {#if detailsLoading}
        <div class="loading">Loading transaction details...</div>
      {:else if !selectedTransaction}
        <div class="empty-state details-empty-state">
          <p>Select a transaction to view details</p>
        </div>
      {:else}
        <div class="details-header">
          <h3>{selectedTransaction.name}</h3>
          <div class="details-actions">
            <button 
              on:click={() => refreshTransaction(selectedTransaction.id)}
              disabled={detailsLoading}
              class="action-btn refresh-btn"
            >
              Refresh Status
            </button>
            {#if selectedTransaction.status !== 'CANCELED' && selectedTransaction.status !== 'COMPLETED'}
              <button 
                on:click={() => cancelTransaction(selectedTransaction.id)}
                disabled={detailsLoading}
                class="action-btn cancel-btn"
              >
                Cancel Transaction
              </button>
            {/if}
          </div>
        </div>
        
        <div class="details-meta">
          <div class="meta-item">
            <span class="meta-label">Status:</span>
            <span class="status-badge {getStatusColor(selectedTransaction.status)}">
              {selectedTransaction.status || 'Unknown'}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">ID:</span>
            <span>{selectedTransaction.id}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created:</span>
            <span>{formatDate(selectedTransaction.created)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Updated:</span>
            <span>{formatDate(selectedTransaction.updated)}</span>
          </div>
        </div>
        
        <!-- Signers -->
        <div class="details-section">
          <h4>Signers</h4>
          {#if !selectedTransaction.signers || selectedTransaction.signers.length === 0}
            <p class="empty-info">No signers have been added to this transaction</p>
          {:else}
            <div class="signers-list">
              {#each selectedTransaction.signers as signer (signer.id)}
                <div class="signer-item">
                  <div class="signer-info">
                    <div class="signer-name">{signer.name}</div>
                    <div class="signer-email">{signer.email}</div>
                    <div class="signer-status">
                      <span class="status-badge small {getSignerStatusColor(signer.status)}">
                        {signer.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div class="signer-actions">
                    {#if selectedTransaction.status !== 'CANCELED' && selectedTransaction.status !== 'COMPLETED' && signer.status !== 'COMPLETED'}
                      <button 
                        on:click={() => resendNotification(selectedTransaction.id, signer.email)}
                        disabled={detailsLoading}
                        class="small-btn"
                      >
                        Resend Email
                      </button>
                      <button 
                        on:click={() => getSigningUrl(selectedTransaction.id, signer.role)}
                        disabled={detailsLoading}
                        class="small-btn"
                      >
                        Signing URL
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Documents -->
        <div class="details-section">
          <h4>Documents</h4>
          {#if !selectedTransaction.documents || selectedTransaction.documents.length === 0}
            <p class="empty-info">No documents have been added to this transaction</p>
          {:else}
            <div class="documents-list">
              {#each selectedTransaction.documents as document (document.id)}
                <div class="document-item">
                  <div class="document-icon">📄</div>
                  <div class="document-info">
                    <div class="document-name">{document.name}</div>
                    <div class="document-type">{document.type}</div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- History -->
        <div class="details-section">
          <h4>History</h4>
          {#if !selectedTransaction.history || selectedTransaction.history.length === 0}
            <p class="empty-info">No history available for this transaction</p>
          {:else}
            <div class="history-list">
              {#each selectedTransaction.history as event (event.timestamp)}
                <div class="history-item">
                  <div class="history-time">{formatDate(event.timestamp)}</div>
                  <div class="history-action">{event.action}</div>
                  <div class="history-details">{event.details}</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .admin-dashboard {
    width: 100%;
  }
  
  h2 {
    margin-bottom: 1.5rem;
  }
  
  .dashboard-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1.5rem;
  }
  
  /* Mobile responsive layout */
  @media (max-width: 768px) {
    .dashboard-layout {
      grid-template-columns: 1fr;
    }
  }
  
  /* Transactions List */
  .transaction-list-container {
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    overflow: hidden;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .list-header h3 {
    margin: 0;
  }
  
  .transaction-list {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .transaction-item {
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    background: #f9f9f9;
    cursor: pointer;
    border-left: 3px solid transparent;
  }
  
  .transaction-item:hover {
    background: #f0f0f0;
  }
  
  .transaction-item.selected {
    border-left-color: #4a5568;
    background: #edf2f7;
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .item-title {
    font-weight: bold;
    flex: 1;
  }
  
  .item-details {
    font-size: 0.85rem;
    color: #666;
  }
  
  .item-meta {
    margin-bottom: 0.25rem;
  }
  
  /* Transaction Details */
  .transaction-details-container {
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    overflow: hidden;
  }
  
  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .details-header h3 {
    margin: 0;
  }
  
  .details-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .details-meta {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: #f9f9f9;
    padding: 0.75rem;
    border-radius: 4px;
  }
  
  .meta-item {
    display: flex;
    flex-direction: column;
  }
  
  .meta-label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .details-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .details-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .details-section h4 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1.1rem;
  }
  
  /* Signers */
  .signers-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .signer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 4px;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .signer-info {
    flex: 1;
    min-width: 200px;
  }
  
  .signer-name {
    font-weight: bold;
  }
  
  .signer-email {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .signer-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  /* Documents */
  .documents-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .document-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 4px;
  }
  
  .document-icon {
    font-size: 1.5rem;
    margin-right: 0.75rem;
  }
  
  .document-name {
    font-weight: bold;
  }
  
  .document-type {
    font-size: 0.85rem;
    color: #666;
  }
  
  /* History */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .history-item {
    padding: 0.5rem;
    background: #f9f9f9;
    border-radius: 4px;
    display: grid;
    grid-template-columns: 180px auto;
    grid-template-areas:
      "time action"
      "details details";
    gap: 0.25rem;
  }
  
  .history-time {
    grid-area: time;
    font-size: 0.8rem;
    color: #666;
  }
  
  .history-action {
    grid-area: action;
    font-weight: bold;
  }
  
  .history-details {
    grid-area: details;
    font-size: 0.9rem;
  }
  
  /* Buttons */
  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  }
  
  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .refresh-btn {
    background: #4a5568;
    color: white;
  }
  
  .refresh-btn:hover:not(:disabled) {
    background: #2d3748;
  }
  
  .cancel-btn {
    background: #e53e3e;
    color: white;
  }
  
  .cancel-btn:hover:not(:disabled) {
    background: #c53030;
  }
  
  .small-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    border: none;
    border-radius: 4px;
    background: #4a5568;
    color: white;
    cursor: pointer;
  }
  
  .small-btn:hover:not(:disabled) {
    background: #2d3748;
  }
  
  .small-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Status badges */
  .status-badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .status-badge.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  /* Status badge colors defined in the script section using getStatusColor */
  .bg-blue-100 { background-color: #ebf8ff; }
  .bg-yellow-100 { background-color: #fffff0; }
  .bg-green-100 { background-color: #f0fff4; }
  .bg-red-100 { background-color: #fff5f5; }
  .bg-gray-100 { background-color: #f7fafc; }
  
  .text-blue-800 { color: #2c5282; }
  .text-yellow-800 { color: #975a16; }
  .text-green-800 { color: #276749; }
  .text-red-800 { color: #9b2c2c; }
  .text-gray-800 { color: #2d3748; }
  
  /* Messages */
  .message {
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .message.success {
    background-color: #f0fff4;
    color: #276749;
    border: 1px solid #c6f6d5;
  }
  
  .message.error {
    background-color: #fff5f5;
    color: #9b2c2c;
    border: 1px solid #fed7d7;
  }
  
  .message.info {
    background-color: #ebf8ff;
    color: #2c5282;
    border: 1px solid #bee3f8;
  }
  
  /* Loading and empty states */
  .loading {
    padding: 2rem;
    text-align: center;
    color: #666;
  }
  
  .error {
    padding: 1rem;
    color: #e53e3e;
    background: #fff5f5;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #666;
    background: #f9f9f9;
    border-radius: 4px;
  }
  
  .details-empty-state {
    padding: 4rem 2rem;
  }
  
  .empty-action {
    font-size: 0.9rem;
    color: #888;
    margin-top: 0.5rem;
  }
  
  .empty-info {
    color: #666;
    font-style: italic;
  }
</style>