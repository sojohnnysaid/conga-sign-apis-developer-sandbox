import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import configRoutes from './routes/config.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import sampleDataRoutes from './routes/sample-data.js';

// Setup __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/sample-data', sampleDataRoutes);

// Basic route for testing server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Conga Sign API Sandbox is running' });
});

// Combined reset endpoint
app.post('/api/reset', (req, res) => {
  try {
    // Import managers
    import('./services/ConfigManager.js')
      .then(({ default: ConfigManager }) => {
        return import('./services/TransactionManager.js')
          .then(({ default: TransactionManager }) => {
            const configManager = new ConfigManager();
            const transactionManager = new TransactionManager();
            
            // Reset both config and transactions
            const keepEnvironment = req.body.keepEnvironment !== false;
            configManager.reset(keepEnvironment);
            transactionManager.reset();
            
            res.json({ success: true, message: 'Application state reset successfully' });
          });
      })
      .catch(error => {
        console.error('Error during reset:', error);
        res.status(500).json({ error: 'Failed to reset application state' });
      });
  } catch (error) {
    console.error('Error during reset:', error);
    res.status(500).json({ error: 'Failed to reset application state' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '..', '..', 'dist');
  app.use(express.static(distPath));
  
  // For any route not matched by API routes, serve the Svelte app
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;