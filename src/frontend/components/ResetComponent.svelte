<script>
  import { onMount } from 'svelte';
  
  let resetting = false;
  let message = '';
  let error = '';
  let keepEnvironment = true;
  
  // Reset application state
  async function resetApplication() {
    try {
      resetting = true;
      error = '';
      message = '';
      
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keepEnvironment })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        message = data.message || 'Application reset successfully';
        // Reload the page after a brief delay to reflect the reset state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        error = data.error || 'Failed to reset application';
      }
    } catch (err) {
      console.error('Error during reset:', err);
      error = 'An error occurred during reset';
    } finally {
      resetting = false;
    }
  }
</script>

<div class="reset-container">
  <h2>Reset Application</h2>
  
  <div class="options">
    <label class="checkbox-label">
      <input type="checkbox" bind:checked={keepEnvironment}>
      Keep environment settings (region selection)
    </label>
  </div>
  
  <button 
    on:click={resetApplication} 
    disabled={resetting}
    class="danger-button"
  >
    {resetting ? 'Resetting...' : 'Reset Application Data'}
  </button>
  
  {#if message}
    <div class="success-message">{message}</div>
  {/if}
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  <div class="warning-box">
    <p><strong>Warning:</strong> This will reset all application data including:</p>
    <ul>
      <li>API credentials {keepEnvironment ? '(keeping region selection)' : ''}</li>
      <li>Authentication tokens</li>
      <li>All transaction records</li>
    </ul>
    <p>This action cannot be undone.</p>
  </div>
</div>

<style>
  .reset-container {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  
  h2 {
    margin-top: 0;
    color: #333;
  }
  
  .options {
    margin-bottom: 15px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .danger-button {
    background-color: #dc3545;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .danger-button:hover {
    background-color: #c82333;
  }
  
  .danger-button:disabled {
    background-color: #e9a8ad;
    cursor: not-allowed;
  }
  
  .success-message {
    margin-top: 15px;
    padding: 10px;
    background-color: #d4edda;
    color: #155724;
    border-radius: 4px;
  }
  
  .error-message {
    margin-top: 15px;
    padding: 10px;
    background-color: #f8d7da;
    color: #721c24;
    border-radius: 4px;
  }
  
  .warning-box {
    margin-top: 20px;
    padding: 15px;
    background-color: #fff3cd;
    color: #856404;
    border-radius: 4px;
  }
  
  .warning-box ul {
    margin: 8px 0;
    padding-left: 20px;
  }
</style>