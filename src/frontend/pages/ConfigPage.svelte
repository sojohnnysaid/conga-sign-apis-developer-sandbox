<script>
  // Configuration page component
  let region = 'us';
  let clientId = '';
  let clientSecret = '';
  let platformEmail = '';
  let callbackUrl = '';
  let loading = false;
  let message = '';
  let tokenStatus = 'none'; // 'none', 'valid', 'invalid'

  // Region options with display names
  const regions = [
    { value: 'us', display: 'US Region' },
    { value: 'eu', display: 'EU Region' },
    { value: 'au', display: 'AU Region' }
  ];

  // API endpoints
  const API_URL = '/api';

  // Load current configuration on component mount
  export async function loadConfig() {
    try {
      const response = await fetch(`${API_URL}/config`);
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      
      const data = await response.json();
      const config = data.config || {};
      
      // Update form fields with existing config
      region = config.region || 'us';
      clientId = config.clientId || '';
      platformEmail = config.platformEmail || '';
      callbackUrl = config.callbackUrl || '';
      // Don't populate clientSecret for security
      
      // Check token status
      tokenStatus = config.accessToken ? 'valid' : (data.initialized ? 'invalid' : 'none');
    } catch (error) {
      console.error('Error loading config:', error);
      message = `Error: ${error.message}`;
    }
  }

  // Save configuration without generating token
  async function saveConfig() {
    try {
      loading = true;
      message = '';
      
      const response = await fetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          region,
          clientId,
          clientSecret,
          platformEmail,
          callbackUrl
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save config: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        message = 'Configuration saved successfully';
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      message = `Error: ${error.message}`;
    } finally {
      loading = false;
    }
  }

  // Generate authentication token
  async function generateToken() {
    try {
      loading = true;
      message = '';
      
      // First save the config
      await saveConfig();
      
      // Then request token generation
      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate token: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        message = 'Authentication token generated successfully';
        tokenStatus = 'valid';
      } else {
        throw new Error(result.error || 'Failed to generate token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      message = `Error: ${error.message}`;
      tokenStatus = 'invalid';
    } finally {
      loading = false;
    }
  }
  
  // Test API configuration
  async function testConfig() {
    try {
      loading = true;
      message = '';
      
      const response = await fetch(`${API_URL}/config/test`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        message = 'API configuration test successful';
      } else {
        throw new Error(result.error || 'API configuration test failed');
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
      message = `Error: ${error.message}`;
    } finally {
      loading = false;
    }
  }

  // Load configuration on component initialization
  import { onMount } from 'svelte';
  
  onMount(() => {
    loadConfig();
  });
</script>

<div class="config-page">
  <h2>Configuration</h2>
  
  <form on:submit|preventDefault={saveConfig}>
    <div class="form-group">
      <label for="region">Region:</label>
      <select id="region" bind:value={region}>
        {#each regions as reg}
          <option value={reg.value}>{reg.display}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="clientId">Conga Client ID:</label>
      <input 
        type="text" 
        id="clientId" 
        bind:value={clientId} 
        placeholder="Enter your Conga client ID"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="clientSecret">Conga Client Secret:</label>
      <input 
        type="password" 
        id="clientSecret" 
        bind:value={clientSecret} 
        placeholder="Enter your Conga client secret"
        required
      />
      <small>Your client secret will not be displayed after saving</small>
    </div>
    
    <div class="form-group">
      <label for="platformEmail">Platform Email:</label>
      <input 
        type="email" 
        id="platformEmail" 
        bind:value={platformEmail} 
        placeholder="Enter platform email"
        required
      />
      <small>This is the email of the Conga Sign user on whose behalf API calls are made</small>
    </div>
    
    <div class="form-group">
      <label for="callbackUrl">Callback URL (Optional):</label>
      <input 
        type="url" 
        id="callbackUrl" 
        bind:value={callbackUrl} 
        placeholder="Enter callback URL for webhooks"
      />
      <small>URL for receiving webhook notifications from Conga Sign</small>
    </div>
    
    <div class="button-group">
      <button type="submit" disabled={loading}>Save Configuration</button>
      <button 
        type="button" 
        on:click={generateToken} 
        disabled={loading || !clientId || !clientSecret || !platformEmail}
      >
        Generate Token
      </button>
      <button
        type="button"
        on:click={testConfig}
        disabled={loading || !clientId || !clientSecret || !platformEmail}
      >
        Test Config
      </button>
    </div>
  </form>
  
  {#if message}
    <div class="message {message.includes('Error') ? 'error' : 'success'}">
      {message}
    </div>
  {/if}
  
  <div class="token-status">
    <h3>Authentication Status</h3>
    {#if tokenStatus === 'valid'}
      <div class="status valid">✓ Token is valid</div>
    {:else if tokenStatus === 'invalid'}
      <div class="status invalid">✗ Token is invalid or expired</div>
    {:else}
      <div class="status none">No token generated yet</div>
    {/if}
  </div>
</div>

<style>
  .config-page {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  small {
    display: block;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4a5568;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
    min-width: 150px;
  }
  
  button:hover:not(:disabled) {
    background: #2d3748;
  }
  
  button:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
  
  .message {
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 4px;
  }
  
  .success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .token-status {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  .status {
    padding: 0.5rem;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .valid {
    background: #d4edda;
    color: #155724;
  }
  
  .invalid {
    background: #f8d7da;
    color: #721c24;
  }
  
  .none {
    background: #e2e3e5;
    color: #383d41;
  }
</style>