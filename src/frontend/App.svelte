<script>
  // Import pages
  import ConfigPage from './pages/ConfigPage.svelte';
  // Import additional pages as they are developed
  // import AdminDashboard from './pages/AdminDashboard.svelte';
  // import EndUserSimulator from './pages/EndUserSimulator.svelte';
  
  // Simple routing
  let currentPage = 'home';
  
  function navigate(page) {
    currentPage = page;
  }
</script>

<main>
  <header>
    <h1>Conga Sign APIs Developer Sandbox</h1>
    <nav>
      <button on:click={() => navigate('home')}>Home</button>
      <button on:click={() => navigate('config')}>Config</button>
      <button on:click={() => navigate('admin')}>Admin Dashboard</button>
      <button on:click={() => navigate('user')}>End User Simulator</button>
    </nav>
  </header>

  <!-- Page content -->
  <div class="content">
    {#if currentPage === 'home'}
      <div class="home">
        <h2>Welcome to Conga Sign APIs Sandbox</h2>
        <p>This application demonstrates integration with Conga Sign APIs.</p>
        <p>Start by configuring your API credentials in the Config page.</p>
        
        <div class="quick-links">
          <h3>Quick Links</h3>
          <button on:click={() => navigate('config')}>Configure API Credentials</button>
          <button on:click={() => navigate('admin')}>Admin Dashboard</button>
          <button on:click={() => navigate('user')}>Simulate End User</button>
        </div>
      </div>
    {:else if currentPage === 'config'}
      <ConfigPage />
    {:else if currentPage === 'admin'}
      <p>Admin Dashboard (to be implemented)</p>
      <!-- <AdminDashboard /> -->
    {:else if currentPage === 'user'}
      <p>End User Simulator (to be implemented)</p>
      <!-- <EndUserSimulator /> -->
    {/if}
  </div>
</main>

<style>
  main {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }
  
  h1 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
  }
  
  nav {
    display: flex;
    gap: 1rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4a5568;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #2d3748;
  }
  
  .content {
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 4px;
    min-height: 300px;
  }
  
  .home {
    text-align: center;
  }
  
  .quick-links {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quick-links button {
    width: 300px;
  }
</style>