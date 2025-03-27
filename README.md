# Conga Sign APIs Developer Sandbox

A development sandbox application built with Svelte (frontend) and Express (backend) for testing and learning about Conga Sign's eSignature APIs.

## Features

- Configure Conga Sign API credentials and environments
- View, resend, and cancel eSignature transactions
- Simulate the recipient's signing experience
- Test-driven development approach with unit and e2e tests

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v7 or higher)
- Conga Sign API credentials (client ID, client secret, and platform email)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Configuration

1. Start the application (see Development section below)
2. Navigate to the Config page
3. Enter your Conga Sign API credentials:
   - Region: Select your Conga Sign region (US, EU, or AU)
   - Client ID: Your Conga Sign client ID
   - Client Secret: Your Conga Sign client secret
   - Platform Email: The email address of your Conga Sign user
   - Callback URL (optional): URL for webhook notifications
4. Click "Save Configuration" to save your credentials
5. Click "Generate Token" to authenticate with the Conga Sign API
6. Click "Test Config" to verify your credentials work correctly

### Development

Start both the frontend and backend development servers:

```bash
npm run dev
```

This will start:
- Svelte frontend on http://localhost:5173
- Express backend on http://localhost:3000

The frontend is configured to proxy API requests to the backend automatically.

### Features

- **Configuration Page**: Setup and manage your Conga Sign API credentials
- **Admin Dashboard**: View, resend, and cancel eSignature transactions
- **End User Simulator**: Generate signing URLs and simulate the recipient experience

### Testing

Run unit tests:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

### Building for Production

Build the application for production deployment:

```bash
npm run build:all
```

Start the production server:

```bash
npm start
```

## Project Structure

```
├── docs/              # Documentation files
├── public/            # Static assets
├── src/
│   ├── backend/       # Express backend
│   │   ├── routes/    # API routes
│   │   └── services/  # Business logic and data access
│   └── frontend/      # Svelte frontend
│       ├── components/ # Reusable UI components
│       ├── lib/       # Frontend utilities
│       └── pages/     # Page components
└── tests/             # Test files
    ├── unit/          # Unit tests
    └── e2e/           # End-to-end tests
```

## Documentation

See the `docs` folder for more detailed documentation:

- [Start Here](./docs/START_HERE.md) - Introduction and navigation
- [Development Guide](./docs/development-guide.md) - Comprehensive blueprint

## License

This project is proprietary and not for public distribution.
