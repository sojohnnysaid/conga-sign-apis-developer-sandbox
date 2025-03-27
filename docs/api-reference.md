# Conga Sign APIs Developer Sandbox - API Reference

This document provides a comprehensive guide to the REST API endpoints available in the Conga Sign APIs Developer Sandbox. Use these endpoints to interact with the sandbox application programmatically.

## Base URL

All API endpoints are prefixed with `/api`. When running locally, the full base URL is:

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication with a valid Conga Sign API token. The token is generated using the `/api/auth/token` endpoint and is automatically included in subsequent requests by the frontend. For external API calls, include the token in the `Authorization` header:

```
Authorization: Bearer {your_token}
```

## API Endpoints

### Configuration Endpoints

#### Get Configuration

```
GET /api/config
```

Returns the current configuration settings, including region, client ID, and authentication status.

**Example Response:**
```json
{
  "region": "US",
  "credentials": {
    "clientId": "your-client-id",
    "userEmail": "your-email@example.com"
  },
  "tokenStatus": "valid",
  "tokenExpiry": "2025-04-03T15:30:45Z"
}
```

#### Update Configuration

```
PUT /api/config
```

Updates the configuration settings.

**Request Body:**
```json
{
  "region": "US",
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "userEmail": "your-email@example.com"
  }
}
```

**Example Response:**
```json
{
  "message": "Configuration updated successfully",
  "region": "US",
  "credentials": {
    "clientId": "your-client-id",
    "userEmail": "your-email@example.com"
  }
}
```

#### Get Available Regions

```
GET /api/config/regions
```

Returns a list of available regions for the Conga Sign API.

**Example Response:**
```json
{
  "regions": [
    {
      "id": "US",
      "name": "United States",
      "baseUrl": "https://preview-rls09.congacloud.com",
      "authUrl": "https://login-rlspreview.congacloud.com",
      "coreappsUrl": "https://coreapps-rlspreview.congacloud.com"
    },
    {
      "id": "EU",
      "name": "Europe",
      "baseUrl": "https://rls-preview.congacloud.eu",
      "authUrl": "https://login-preview.congacloud.eu",
      "coreappsUrl": "https://coreapps-preview.congacloud.eu"
    },
    {
      "id": "AU",
      "name": "Australia",
      "baseUrl": "https://rls-preview.congacloud.au",
      "authUrl": "https://login-preview.congacloud.au",
      "coreappsUrl": "https://coreapps-preview.congacloud.au"
    }
  ]
}
```

#### Test Configuration

```
POST /api/config/test
```

Tests the current configuration by attempting to make a simple API call to Conga Sign.

**Example Response:**
```json
{
  "success": true,
  "message": "Configuration tested successfully"
}
```

### Authentication Endpoints

#### Generate Token

```
POST /api/auth/token
```

Generates a new authentication token using the stored credentials.

**Example Response:**
```json
{
  "success": true,
  "message": "Authentication token generated successfully",
  "tokenStatus": "valid",
  "tokenExpiry": "2025-04-03T15:30:45Z"
}
```

#### Check Token Status

```
GET /api/auth/status
```

Checks the status of the current authentication token.

**Example Response:**
```json
{
  "valid": true,
  "expires": "2025-04-03T15:30:45Z",
  "timeRemaining": "24 hours"
}
```

#### Revoke Token

```
POST /api/auth/revoke
```

Revokes the current authentication token.

**Example Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

### Transaction Endpoints

#### List Transactions

```
GET /api/transactions
```

Returns a list of all transactions.

**Example Response:**
```json
{
  "transactions": [
    {
      "id": "sample-txn-1",
      "name": "Sample Contract 1",
      "status": "SENT",
      "createdAt": "2025-03-27T12:34:56Z",
      "updatedAt": "2025-03-27T12:34:56Z",
      "expiresAt": "2025-04-03T12:34:56Z",
      "documents": [
        {
          "id": "doc-1",
          "name": "Contract.pdf",
          "size": 125000,
          "contentType": "application/pdf"
        }
      ],
      "signers": [
        {
          "id": "signer-1",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "status": "PENDING",
          "order": 1
        },
        {
          "id": "signer-2",
          "name": "Jane Smith",
          "email": "jane.smith@example.com",
          "status": "PENDING",
          "order": 2
        }
      ]
    },
    // Additional transactions...
  ]
}
```

#### Get Transaction

```
GET /api/transactions/:id
```

Returns details for a specific transaction.

**Example Response:**
```json
{
  "id": "sample-txn-1",
  "name": "Sample Contract 1",
  "status": "SENT",
  "createdAt": "2025-03-27T12:34:56Z",
  "updatedAt": "2025-03-27T12:34:56Z",
  "expiresAt": "2025-04-03T12:34:56Z",
  "documents": [
    {
      "id": "doc-1",
      "name": "Contract.pdf",
      "size": 125000,
      "contentType": "application/pdf"
    }
  ],
  "signers": [
    {
      "id": "signer-1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "status": "PENDING",
      "order": 1
    },
    {
      "id": "signer-2",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "status": "PENDING",
      "order": 2
    }
  ]
}
```

#### Resend Transaction

```
POST /api/transactions/:id/resend
```

Resends notifications for a specific transaction.

**Example Response:**
```json
{
  "success": true,
  "message": "Transaction notifications resent successfully",
  "transaction": {
    "id": "sample-txn-1",
    "name": "Sample Contract 1",
    "status": "SENT",
    "resendCount": 1,
    "lastResentAt": "2025-03-27T14:45:30Z"
    // Additional transaction details...
  }
}
```

#### Cancel Transaction

```
POST /api/transactions/:id/cancel
```

Cancels a specific transaction.

**Example Response:**
```json
{
  "success": true,
  "message": "Transaction cancelled successfully",
  "transaction": {
    "id": "sample-txn-1",
    "name": "Sample Contract 1",
    "status": "CANCELLED",
    "cancelledAt": "2025-03-27T15:10:22Z"
    // Additional transaction details...
  }
}
```

#### Get Signing URL

```
GET /api/transactions/:id/signers/:signerId/url
```

Generates a signing URL for a specific signer in a transaction.

**Example Response:**
```json
{
  "success": true,
  "signingUrl": "https://preview-rls09.congacloud.com/sign/document/sample-txn-1?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-03-28T12:34:56Z"
}
```

#### Simulate Email Notification

```
POST /api/transactions/:id/signers/:signerId/notify
```

Simulates sending an email notification to a specific signer.

**Example Response:**
```json
{
  "success": true,
  "message": "Email notification simulated successfully",
  "sentTo": "john.doe@example.com"
}
```

### System Utilities

#### Health Check

```
GET /api/health
```

Checks the health of the application.

**Example Response:**
```json
{
  "status": "ok",
  "message": "Conga Sign API Sandbox is running"
}
```

#### Reset Application

```
POST /api/reset
```

Resets the application state.

**Request Body:**
```json
{
  "keepEnvironment": true  // Optional, defaults to true
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Application state reset successfully"
}
```

#### Create Sample Data

```
POST /api/sample-data
```

Creates sample transaction data for demonstration purposes.

**Example Response:**
```json
{
  "message": "Sample data created successfully"
}
```

## Using the API with cURL

Here are some practical examples of using the API with cURL:

### 1. Configure the Application

```bash
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "region": "US",
    "credentials": {
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "userEmail": "your-email@example.com"
    }
  }'
```

### 2. Generate an Authentication Token

```bash
curl -X POST http://localhost:3000/api/auth/token
```

### 3. List All Transactions

```bash
curl -X GET http://localhost:3000/api/transactions
```

### 4. Resend Transaction Notifications

```bash
curl -X POST http://localhost:3000/api/transactions/sample-txn-1/resend
```

### 5. Generate a Signing URL

```bash
curl -X GET http://localhost:3000/api/transactions/sample-txn-1/signers/signer-1/url
```

### 6. Create Sample Data

```bash
curl -X POST http://localhost:3000/api/sample-data
```

### 7. Reset Application State

```bash
curl -X POST http://localhost:3000/api/reset \
  -H "Content-Type: application/json" \
  -d '{
    "keepEnvironment": true
  }'
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in case of failure. Error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common error status codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Webhook Simulation

The application includes webhook simulation to emulate Conga Sign's callback functionality. In a real implementation, Conga Sign would send callbacks to a registered URL when events occur, such as a signer completing a transaction.

To simulate a webhook callback:

```bash
curl -X POST http://localhost:3000/api/callback \
  -H "Content-Type: application/json" \
  -d '{
    "event": "COMPLETED",
    "packageId": "sample-txn-1",
    "signerId": "signer-1",
    "timestamp": "2025-03-27T15:30:45Z"
  }'
```

This allows testing callback handling without requiring an actual Conga Sign integration.