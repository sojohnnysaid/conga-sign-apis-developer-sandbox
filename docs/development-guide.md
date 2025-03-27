# Development Blueprint: Test-Driven Svelte & Express Conga Sign Sandbox

## Current Status & Progress Update

**As of March 27, 2025:**

- **Milestone 1 (Project Setup)**: ✅ COMPLETED
  - All project structure and configuration files are in place
  - Dependencies installed and development environment set up

- **Milestone 2 (Backend Implementation)**: ✅ COMPLETED 
  - Implemented core backend services (ConfigManager, CongaApiClient, TransactionManager)
  - Created API routes for auth, config, and transactions
  - Basic unit tests for ConfigManager
  - Documentation updated with implementation details

- **Milestone 3 (Frontend Implementation)**: ✅ COMPLETED
  - ConfigPage implemented with form for managing API credentials
  - AdminDashboard implemented for viewing and managing transactions
  - EndUserSimulator implemented for generating signing URLs
  - All components connected to their respective backend APIs
  - Unit tests passing for all components

- **Milestone 4 (Testing & Refinement)**: 🔄 IN PROGRESS
  - Basic test suite implemented with Vitest and Testing Library
  - More comprehensive test coverage needed for edge cases
  - E2E tests still need to be implemented

## Overview

This blueprint outlines a test-driven development (TDD) sandbox application built with Svelte (frontend) and Express (backend). It is inspired by the "Resend or Cancel a Transaction Using Conga Sign APIs" and "Integrate UI Pages Using Sign APIs" modules, focusing on implementing those features in a lightweight, local development app. The application will demonstrate how Conga Sign's API can be used to embed and manage eSignature transactions within a custom app.

The scope is deliberately constrained to the happy path – assuming the API credentials work and focusing on core Conga Sign API features.

## Key User Flows

1. **Configuration & Authentication Flow**: Setup API credentials and generate tokens
2. **Viewing and Managing Transactions**: Resend or cancel transactions from admin dashboard
3. **End-User Simulation Flow**: Simulate the recipient's experience receiving and completing signature requests

## Major Components and Classes

### Frontend Components (Svelte UI)

- ConfigPage.svelte - Configuration UI for entering credentials and generating tokens
- AdminDashboard.svelte - Admin view for managing transactions (resend/cancel)
- EndUserSimulator.svelte - UI simulating a recipient's view of signature requests
- Additional components for navigation, modals, etc.

### Backend Components (Express API & Services)

- ConfigManager class - Manages configuration data (environment, credentials, tokens)
- CongaApiClient class - Handles direct communication with Conga Sign's REST API
- TransactionManager class - Manages the lifecycle of transactions
- Express Routes - RESTful API endpoints for the frontend

## State Management and Reset

All application state is stored in two JSON files:
- config.json - Stores credentials, environment selection, and auth tokens
- transactions.json - Stores transaction data and status

A reset mechanism allows clearing state to quickly return to a clean starting point.

## Technical Notes

- Built with Svelte (frontend) and Express (backend)
- Uses JSON files for storage instead of a database for simplicity
- Implements simulated signing experience instead of a full integration
- Follows test-driven development practices with unit and e2e tests

## Implementation Details

### Backend Service Implementation

1. **ConfigManager**
   - **Status**: ✅ Implemented and tested
   - **Purpose**: Manages API configuration, credentials, and token storage
   - **Key Features**:
     - Region-specific URL configurations (US, EU, AU)
     - Secure storage of credentials
     - Token management and validation

2. **CongaApiClient**
   - **Status**: ✅ Implemented
   - **Purpose**: Handles all API interactions with Conga Sign
   - **Key Methods**:
     - Authentication with token handling
     - Package creation and management
     - Document and signature field operations
     - Notification resending and status tracking

3. **TransactionManager**
   - **Status**: ✅ Implemented
   - **Purpose**: Manages signature transaction lifecycle
   - **Key Features**:
     - Local transaction tracking with history
     - Status synchronization with API
     - Document and signer management

### API Routes

1. **Auth Routes** (`/api/auth`)
   - **Status**: ✅ Implemented
   - **Endpoints**:
     - `POST /api/auth/token` - Generate authentication token
     - `GET /api/auth/status` - Check token status
     - `POST /api/auth/revoke` - Revoke current token

2. **Config Routes** (`/api/config`)
   - **Status**: ✅ Implemented
   - **Endpoints**:
     - `GET /api/config` - Get current configuration
     - `PUT /api/config` - Update configuration
     - `POST /api/config/test` - Test configuration
     - `POST /api/config/reset` - Reset configuration
     - `GET /api/config/regions` - Get available regions

3. **Transaction Routes** (`/api/transactions`)
   - **Status**: ✅ Implemented
   - **Endpoints**:
     - `GET /api/transactions` - List all transactions
     - `GET /api/transactions/:id` - Get specific transaction
     - `POST /api/transactions` - Create transaction
     - Multiple endpoints for managing documents, signers, and fields
     - Endpoints for sending, refreshing, resending notifications

## Developer Notes

### Testing Approach

- **IMPORTANT**: All tests MUST pass before committing to the repository
- Test frequently in small increments rather than large batches
- Run `npm test` to run all tests
- The focus is on unit testing service classes first

### Environment Configuration

The application supports three regional environments:

1. **US Region** (Default)
   - Base URL: `https://preview-rls09.congacloud.com`
   - Auth URL: `https://login-rlspreview.congacloud.com`
   - Coreapps URL: `https://coreapps-rlspreview.congacloud.com`

2. **EU Region**
   - Base URL: `https://rls-preview.congacloud.eu`
   - Auth URL: `https://login-preview.congacloud.eu`
   - Coreapps URL: `https://coreapps-preview.congacloud.eu`

3. **AU Region**
   - Base URL: `https://rls-preview.congacloud.au`
   - Auth URL: `https://login-preview.congacloud.au`
   - Coreapps URL: `https://coreapps-preview.congacloud.au`

### Next Development Steps

1. Improve test coverage for edge cases:
   - Add more comprehensive tests for ConfigManager error handling
   - Create tests for CongaApiClient API interactions
   - Add tests for TransactionManager lifecycle methods
   
2. Implement E2E tests for key user flows:
   - Configuration and authentication flow
   - Transaction creation and management flow
   - Signature URL generation and recipient simulation
   
3. Create sample data for demonstration purposes:
   - Provide sample documents for testing
   - Create demo transactions with sample signers
   
4. Implement reset functionality to easily clear application state:
   - Add UI control to reset configuration
   - Add UI control to reset transactions
   - Add comprehensive data reset capability