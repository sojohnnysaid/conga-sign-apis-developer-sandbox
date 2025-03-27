<script>
  import ResetComponent from '../components/ResetComponent.svelte';
  import { onMount } from 'svelte';
  
  let appVersion = '0.1.0';  // Default version
  let healthStatus = 'Checking...';
  let healthMessage = '';
  let healthError = false;
  
  // Check server health
  async function checkHealth() {
    try {
      healthStatus = 'Checking...';
      healthError = false;
      
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        healthStatus = data.status || 'ok';
        healthMessage = data.message || 'Server is running';
        healthError = false;
      } else {
        healthStatus = 'error';
        healthMessage = data.error || 'Failed to connect to server';
        healthError = true;
      }
    } catch (err) {
      console.error('Error checking health:', err);
      healthStatus = 'error';
      healthMessage = 'Server connection failed';
      healthError = true;
    }
  }
  
  // Create sample data for demo purposes
  async function createSampleData() {
    try {
      const response = await fetch('/api/sample-data', {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Sample data created successfully');
      } else {
        alert('Failed to create sample data');
      }
    } catch (err) {
      console.error('Error creating sample data:', err);
      alert('Error creating sample data');
    }
  }
  
  onMount(() => {
    checkHealth();
  });
</script>

<div class="system-utils-container">
  <h1>System Utilities</h1>
  
  <div class="system-info">
    <h2>System Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Application Version:</span>
        <span class="value">{appVersion}</span>
      </div>
      <div class="info-item">
        <span class="label">Server Status:</span>
        <span class="value" class:error={healthError}>{healthStatus}</span>
      </div>
      <div class="info-item">
        <span class="label">Status Message:</span>
        <span class="value">{healthMessage}</span>
      </div>
    </div>
    
    <button on:click={checkHealth} class="refresh-button">
      Refresh Status
    </button>
  </div>
  
  <div class="reset-section">
    <ResetComponent />
  </div>
  
  <div class="sample-data-section">
    <h2>Sample Data</h2>
    <p>Create sample data for demonstration purposes.</p>
    <button on:click={createSampleData} class="sample-button">
      Create Sample Data
    </button>
  </div>
</div>

<style>
  .system-utils-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    color: #333;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  
  h2 {
    color: #444;
    margin-top: 0;
  }
  
  .system-info {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .label {
    font-weight: bold;
    color: #666;
  }
  
  .value {
    font-family: monospace;
    font-size: 1.1em;
  }
  
  .value.error {
    color: #dc3545;
  }
  
  .refresh-button {
    background-color: #6c757d;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .refresh-button:hover {
    background-color: #5a6268;
  }
  
  .reset-section {
    margin-bottom: 30px;
  }
  
  .sample-data-section {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .sample-button {
    background-color: #28a745;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .sample-button:hover {
    background-color: #218838;
  }
</style>