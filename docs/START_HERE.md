# Conga Sign APIs Developer Sandbox - Start Here

## Introduction

Welcome to the Conga Sign APIs Developer Sandbox! This project creates a test-driven development environment for learning and experimenting with Conga Sign's eSignature APIs. The sandbox demonstrates how to integrate eSignature flows into your custom applications using Conga Sign APIs.

## Quick Navigation

- [Development Guide](./development-guide.md) - Comprehensive blueprint for the application architecture
- [API Reference](./api-reference.md) - Documentation of the Express API endpoints
- [Component Reference](./component-reference.md) - Documentation of Svelte components (TODO)
- [Testing Guide](./testing-guide.md) - Guide to the test suite (TODO)

## Project Overview

This sandbox implements a lightweight application with:

1. **Configuration UI** - Setup Conga Sign API credentials and environment
2. **Admin Dashboard** - View, resend, and cancel signature transactions
3. **End-User Simulator** - Simulate the recipient's signing experience

## Development Checklist

### Milestone 1: Project Setup & Documentation

- [x] Create project documentation structure
- [x] Setup basic .gitignore file
- [x] Initialize package.json with dependencies
- [x] Setup basic folder structure for Svelte and Express
- [x] Create configuration files (tsconfig.json, vite.config.js, etc.)

### Milestone 2: Backend Implementation

- [x] Implement ConfigManager class
- [x] Implement CongaApiClient class
- [x] Implement TransactionManager class
- [x] Create Express API routes
- [x] Write unit tests for backend classes

### Milestone 3: Frontend Implementation

- [x] Create ConfigPage component
- [x] Create AdminDashboard component
- [x] Create EndUserSimulator component
- [x] Implement supporting UI components
- [x] Connect frontend to Express API

### Milestone 4: Testing & Refinement

- [x] Write E2E tests for main user flows
- [x] Implement reset functionality
- [x] Create sample data for demonstrations
- [x] Document API usage with examples

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v7 or higher)
- Conga Sign API credentials (client ID, client secret, and platform email)

### Quick Start

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser to http://localhost:5173
5. Navigate to the Configuration page to set up your Conga Sign API credentials
6. Use the Admin Dashboard to view and manage transactions
7. Use the End User Simulator to generate signing URLs and simulate the recipient experience
8. Use the System Utilities page to reset the application or generate sample data

### Testing

Run the test suite:
```
npm test
```

Run end-to-end tests:
```
npm run test:e2e
```

For more detailed instructions, see the [README.md](../README.md) file.

## Resources

- [Conga Sign API Documentation](https://documentation.conga.com/sign/)
- [Svelte Documentation](https://svelte.dev/docs)
- [Express Documentation](https://expressjs.com/)