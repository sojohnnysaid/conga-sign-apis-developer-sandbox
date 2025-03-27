import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to data directory
const dataDir = path.join(__dirname, '../../..', 'data');

// Create sample transactions data
router.post('/', (req, res) => {
  try {
    const transactionsPath = path.join(dataDir, 'transactions.json');
    
    // Create sample transaction data
    const sampleTransactions = {
      transactions: [
        {
          id: 'sample-txn-1',
          name: 'Sample Contract 1',
          status: 'SENT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          documents: [
            {
              id: 'doc-1',
              name: 'Contract.pdf',
              size: 125000,
              contentType: 'application/pdf'
            }
          ],
          signers: [
            {
              id: 'signer-1',
              name: 'John Doe',
              email: 'john.doe@example.com',
              status: 'PENDING',
              order: 1
            },
            {
              id: 'signer-2',
              name: 'Jane Smith',
              email: 'jane.smith@example.com',
              status: 'PENDING',
              order: 2
            }
          ]
        },
        {
          id: 'sample-txn-2',
          name: 'Sample Agreement 2',
          status: 'DRAFT',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          documents: [
            {
              id: 'doc-2',
              name: 'Agreement.pdf',
              size: 250000,
              contentType: 'application/pdf'
            },
            {
              id: 'doc-3',
              name: 'Terms.pdf',
              size: 150000,
              contentType: 'application/pdf'
            }
          ],
          signers: [
            {
              id: 'signer-3',
              name: 'Robert Johnson',
              email: 'robert.johnson@example.com',
              status: 'PENDING',
              order: 1
            }
          ]
        },
        {
          id: 'sample-txn-3',
          name: 'Sample Completion',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          documents: [
            {
              id: 'doc-4',
              name: 'Completion.pdf',
              size: 180000,
              contentType: 'application/pdf'
            }
          ],
          signers: [
            {
              id: 'signer-4',
              name: 'Sarah Williams',
              email: 'sarah.williams@example.com',
              status: 'COMPLETED',
              order: 1,
              completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'signer-5',
              name: 'Michael Brown',
              email: 'michael.brown@example.com',
              status: 'COMPLETED',
              order: 2,
              completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      ]
    };
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write sample transactions to file
    fs.writeFileSync(transactionsPath, JSON.stringify(sampleTransactions, null, 2));
    
    res.status(200).json({ message: 'Sample data created successfully' });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ error: 'Failed to create sample data' });
  }
});

export default router;