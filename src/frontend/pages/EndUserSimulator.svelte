<script>
  import { onMount } from 'svelte';
  
  // State variables
  let transactionId = '';
  let signerId = '';
  let signerEmail = '';
  let loading = false;
  let error = null;
  let message = '';
  let messageType = 'info';
  let signingUrl = '';
  let signingFrame = null;
  let transactions = [];
  
  // API URL
  const API_URL = '/api';
  
  // Load all transactions for selection
  export async function loadTransactions() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`${API_URL}/transactions`);
      
      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      transactions = data.transactions || [];
      
      // Filter for only active transactions
      transactions = transactions.filter(t => 
        t.status === 'SENT' || t.status === 'CREATED'
      );
    } catch (err) {
      console.error('Error loading transactions:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  // Handle transaction selection
  function handleTransactionChange(event) {
    transactionId = event.target.value;
    signerId = '';
    signerEmail = '';
    signingUrl = '';
    
    // Find the selected transaction
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction && transaction.signers && transaction.signers.length > 0) {
      // Pre-select the first signer
      const firstSigner = transaction.signers[0];
      signerId = firstSigner.role || firstSigner.id;
      signerEmail = firstSigner.email;
    }
  }
  
  // Handle signer selection
  function handleSignerChange(event) {
    signerId = event.target.value;
    
    // Find the selected transaction and signer
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction && transaction.signers) {
      const signer = transaction.signers.find(s => s.role === signerId || s.id === signerId);
      if (signer) {
        signerEmail = signer.email;
      }
    }
  }
  
  // Get signing URL
  async function getSigningUrl() {
    try {
      if (!transactionId || !signerId) {
        showMessage('Please select a transaction and signer', 'error');
        return;
      }
      
      loading = true;
      error = null;
      signingUrl = '';
      
      const response = await fetch(`${API_URL}/transactions/${transactionId}/signingUrl/${signerId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get signing URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.url) {
        signingUrl = data.url;
        showMessage('Signing URL generated successfully', 'success');
      } else {
        throw new Error('No signing URL returned');
      }
    } catch (err) {
      console.error('Error getting signing URL:', err);
      error = err.message;
      showMessage(`Error: ${err.message}`, 'error');
    } finally {
      loading = false;
    }
  }
  
  // Simulate direct email receipt
  function simulateDirectEmail() {
    if (!transactionId || !signerId) {
      showMessage('Please select a transaction and signer', 'error');
      return;
    }
    
    showMessage(`A notification email would be sent to ${signerEmail}`, 'info');
  }
  
  // Open the signing URL in a new tab
  function openSigningUrl() {
    if (signingUrl) {
      window.open(signingUrl, '_blank');
    } else {
      showMessage('No signing URL available. Generate one first.', 'error');
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
  
  // Load transactions on component initialization
  onMount(() => {
    loadTransactions();
  });
</script>

<div class="end-user-simulator">
  <h2>End User Simulator</h2>
  <p class="description">
    This tool helps you simulate how end users interact with Conga Sign. 
    You can generate signing URLs and view the signing experience.
  </p>
  
  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}
  
  <div class="simulator-container">
    <div class="simulator-controls">
      <h3>Recipient Setup</h3>
      
      {#if loading}
        <div class="loading">Loading transactions...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else}
        <form on:submit|preventDefault={getSigningUrl}>
          <div class="form-group">
            <label for="transaction">Transaction:</label>
            <select 
              id="transaction" 
              bind:value={transactionId}
              on:change={handleTransactionChange}
              required
            >
              <option value="">-- Select Transaction --</option>
              {#each transactions as transaction (transaction.id)}
                <option value={transaction.id}>{transaction.name}</option>
              {/each}
            </select>
            {#if transactions.length === 0}
              <small>No active transactions available. Create a transaction first.</small>
            {/if}
          </div>
          
          {#if transactionId}
            <div class="form-group">
              <label for="signer">Recipient:</label>
              <select 
                id="signer" 
                bind:value={signerId}
                on:change={handleSignerChange}
                required
              >
                <option value="">-- Select Recipient --</option>
                {#each transactions.find(t => t.id === transactionId)?.signers || [] as signer (signer.id)}
                  <option value={signer.role || signer.id}>
                    {signer.name} ({signer.email})
                  </option>
                {/each}
              </select>
              {#if transactions.find(t => t.id === transactionId)?.signers?.length === 0}
                <small>No signers available for this transaction.</small>
              {/if}
            </div>
          {/if}
          
          {#if signerId}
            <div class="form-group">
              <label>Recipient Email:</label>
              <div class="email-display">{signerEmail}</div>
            </div>
            
            <div class="button-group">
              <button type="submit" disabled={loading}>
                Generate Signing URL
              </button>
              <button 
                type="button" 
                on:click={simulateDirectEmail}
                disabled={loading}
              >
                Simulate Email Receipt
              </button>
            </div>
          {/if}
        </form>
        
        {#if signingUrl}
          <div class="signing-url-container">
            <h4>Signing URL Generated</h4>
            <div class="signing-url-actions">
              <button 
                on:click={openSigningUrl}
                class="primary-btn"
              >
                Open Signing URL
              </button>
            </div>
            <div class="signing-url">
              <code>{signingUrl}</code>
            </div>
          </div>
        {/if}
      {/if}
    </div>
    
    <div class="signing-experience">
      <h3>Signing Experience Preview</h3>
      
      {#if signingUrl}
        <div class="iframe-container">
          <div class="iframe-overlay">
            <p>Due to security restrictions, the signing experience can't be embedded.</p>
            <button 
              on:click={openSigningUrl}
              class="open-btn"
            >
              Open in New Tab
            </button>
          </div>
          <!-- Placeholder for the signing experience -->
          <div class="iframe-placeholder">
            <div class="placeholder-header">
              <div class="placeholder-logo">Conga Sign</div>
              <div class="placeholder-steps">
                <div class="step active">1. Review</div>
                <div class="step">2. Sign</div>
                <div class="step">3. Complete</div>
              </div>
            </div>
            <div class="placeholder-content">
              <div class="document-preview">
                <div class="document-page">
                  <div class="page-content">
                    <div class="text-line"></div>
                    <div class="text-line"></div>
                    <div class="text-line short"></div>
                    <div class="text-line"></div>
                    <div class="text-line"></div>
                    <div class="text-line short"></div>
                    <div class="signature-field">
                      <span>Sign Here</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <p>Generate a signing URL to preview the signing experience</p>
          <p class="empty-hint">The actual signing experience will open in a new tab</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .end-user-simulator {
    width: 100%;
  }
  
  h2 {
    margin-bottom: 0.5rem;
  }
  
  .description {
    margin-bottom: 1.5rem;
    color: #666;
  }
  
  .simulator-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1.5rem;
  }
  
  /* Mobile responsive layout */
  @media (max-width: 768px) {
    .simulator-container {
      grid-template-columns: 1fr;
    }
  }
  
  .simulator-controls {
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }
  
  .signing-experience {
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.75rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
  }
  
  small {
    display: block;
    margin-top: 0.5rem;
    color: #666;
    font-size: 0.85rem;
  }
  
  .email-display {
    padding: 0.5rem;
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 4px;
    font-family: monospace;
  }
  
  .button-group {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4a5568;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    flex: 1;
    min-width: 150px;
  }
  
  button:hover:not(:disabled) {
    background: #2d3748;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .primary-btn {
    background: #3182ce;
  }
  
  .primary-btn:hover:not(:disabled) {
    background: #2c5282;
  }
  
  .signing-url-container {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }
  
  .signing-url-container h4 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .signing-url {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    word-break: break-all;
    max-height: 100px;
    overflow-y: auto;
  }
  
  .signing-url-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .message {
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
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
    padding: 4rem 2rem;
    text-align: center;
    color: #666;
    background: #f9f9f9;
    border-radius: 4px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .empty-hint {
    font-size: 0.9rem;
    color: #888;
    margin-top: 0.5rem;
  }
  
  /* Iframe and placeholder styles */
  .iframe-container {
    flex: 1;
    position: relative;
    border: 1px solid #eee;
    border-radius: 4px;
    overflow: hidden;
    min-height: 400px;
  }
  
  .iframe-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    text-align: center;
    z-index: 2;
    padding: 1rem;
  }
  
  .iframe-overlay p {
    margin-bottom: 1.5rem;
    max-width: 400px;
  }
  
  .open-btn {
    background: #38a169;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  }
  
  .open-btn:hover {
    background: #2f855a;
  }
  
  /* Signing experience placeholder */
  .iframe-placeholder {
    position: relative;
    z-index: 1;
    height: 100%;
    background: white;
    display: flex;
    flex-direction: column;
  }
  
  .placeholder-header {
    padding: 1rem;
    background: #f0f4f8;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .placeholder-logo {
    font-weight: bold;
    color: #2c5282;
  }
  
  .placeholder-steps {
    display: flex;
    gap: 1rem;
  }
  
  .step {
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    background: #edf2f7;
    color: #4a5568;
    font-size: 0.85rem;
  }
  
  .step.active {
    background: #4a5568;
    color: white;
    font-weight: bold;
  }
  
  .placeholder-content {
    flex: 1;
    padding: 1.5rem;
    display: flex;
    justify-content: center;
    overflow: auto;
  }
  
  .document-preview {
    max-width: 100%;
    max-height: 100%;
  }
  
  .document-page {
    background: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    width: 595px;
    height: 842px;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .page-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  
  .text-line {
    height: 12px;
    background: #edf2f7;
    margin-bottom: 16px;
    border-radius: 4px;
  }
  
  .text-line.short {
    width: 70%;
  }
  
  .signature-field {
    margin-top: auto;
    padding: 2rem;
    border: 2px dashed #4a5568;
    border-radius: 4px;
    text-align: center;
    color: #4a5568;
    margin-bottom: 2rem;
  }
</style>