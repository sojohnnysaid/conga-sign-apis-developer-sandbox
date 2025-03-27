import { describe, it, expect, vi, beforeEach } from 'vitest';
import CongaApiClient from '../../../../src/backend/services/CongaApiClient.js';

// Mock the fetch module
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Import the mocked fetch
import fetch from 'node-fetch';

// Mock the ConfigManager
vi.mock('../../../../src/backend/services/ConfigManager.js', () => {
  return {
    default: class MockConfigManager {
      isInitialized() {
        return true;
      }
      
      isTokenValid() {
        return true;
      }
      
      getConfig(includeSecret = false) {
        return {
          region: 'us',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          platformEmail: 'test@example.com',
          accessToken: 'mock-token',
          tokenExpiry: new Date(Date.now() + 3600 * 1000).toISOString()
        };
      }
      
      getFullApiUrl() {
        return 'https://coreapps-rlspreview.congacloud.com/api/sign/v1';
      }
      
      getFullAuthUrl() {
        return 'https://login-rlspreview.congacloud.com/api/v1/auth/connect/token';
      }
      
      updateToken() {
        return true;
      }
    }
  };
});

describe('CongaApiClient', () => {
  let apiClient;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock response
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          success: true,
          packages: [
            {
              id: 'test-package-1',
              name: 'Test Package 1',
              status: 'SENT'
            }
          ]
        }),
        text: () => Promise.resolve('OK'),
        headers: {
          get: () => 'application/json'
        }
      })
    );
    
    // Create a new instance for each test
    apiClient = new CongaApiClient();
    
    // Silence console output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  describe('listPackages', () => {
    it('should properly encode email address in URL', async () => {
      // Set up the test with a complex email to encode
      const email = 'test+example@example.com';
      const encodedEmail = encodeURIComponent(email);
      
      // Execute the method with the email
      await apiClient.listPackages({ ownerEmail: email });
      
      // Check the fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Get the first argument of the first call (the URL)
      const url = fetch.mock.calls[0][0];
      
      // Verify the email is properly encoded in the URL
      expect(url).toContain(`ownerEmail=${encodedEmail}`);
      
      // Verify pagination parameters are included
      expect(url).toContain('from=1');
      expect(url).toContain('to=100');
    });
    
    it('should properly encode special characters in email addresses', async () => {
      // Set up the test with various special characters that need encoding
      const emails = [
        'user+tag@example.com',
        'test.user@example.org',
        'test&user@example.net',
        'test=user@example.co.uk',
        'user/dept@example.gov',
        'user with spaces@domain.com',
        'user@domain-with-hyphen.com'
      ];
      
      // Test each email
      for (const email of emails) {
        // Reset mock between calls
        fetch.mockClear();
        
        // The correctly encoded version
        const encodedEmail = encodeURIComponent(email);
        
        // Execute the method
        await apiClient.listPackages({ ownerEmail: email });
        
        // Check the fetch call
        expect(fetch).toHaveBeenCalledTimes(1);
        
        // Get the URL from the call
        const url = fetch.mock.calls[0][0];
        
        // Verify correct encoding in URL
        expect(url).toContain(`ownerEmail=${encodedEmail}`);
        
        // Ensure '@' was properly encoded
        if (email.includes('@')) {
          expect(encodedEmail).toContain('%40');
          expect(url).toContain('%40');
        }
        
        // Ensure '+' was properly encoded
        if (email.includes('+')) {
          expect(encodedEmail).toContain('%2B');
          expect(url).toContain('%2B');
        }
        
        // Ensure spaces were properly encoded
        if (email.includes(' ')) {
          expect(encodedEmail).toContain('%20');
          expect(url).toContain('%20');
        }
      }
    });
    
    it('should use platform email from config if ownerEmail not provided', async () => {
      // Execute the method without an email
      await apiClient.listPackages();
      
      // Check the fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Get the first argument of the first call (the URL)
      const url = fetch.mock.calls[0][0];
      
      // Verify the default email from config is used
      const encodedConfigEmail = encodeURIComponent('test@example.com');
      expect(url).toContain(`ownerEmail=${encodedConfigEmail}`);
    });
    
    it('should support custom pagination parameters', async () => {
      // Execute the method with custom pagination
      await apiClient.listPackages({ from: 10, to: 50 });
      
      // Check the fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Get the first argument of the first call (the URL)
      const url = fetch.mock.calls[0][0];
      
      // Verify pagination parameters are included with custom values
      expect(url).toContain('from=10');
      expect(url).toContain('to=50');
    });
    
    it('should throw an error if platform email is not configured', async () => {
      // Mock the getConfig method to return no email
      apiClient.configManager.getConfig = () => ({
        region: 'us',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        platformEmail: '', // Empty email
        accessToken: 'mock-token'
      });
      
      // Execute the method and expect it to throw
      await expect(apiClient.listPackages()).rejects.toThrow('Platform email not configured');
    });
    
    it('should handle API errors gracefully', async () => {
      // Setup fetch to reject with an error
      fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );
      
      // Execute and expect error to be propagated
      await expect(apiClient.listPackages()).rejects.toThrow('API request failed: Network error');
    });
  });
  
  describe('request', () => {
    it('should build full URL with base URL and endpoint', async () => {
      // Execute the method
      await apiClient.request('/test-endpoint');
      
      // Check the fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Get the first argument of the first call (the URL)
      const url = fetch.mock.calls[0][0];
      
      // Verify the URL is correctly built
      expect(url).toBe('https://coreapps-rlspreview.congacloud.com/api/sign/v1/test-endpoint');
    });
    
    it('should include authorization header with token', async () => {
      // Execute the method
      await apiClient.request('/test-endpoint');
      
      // Check the fetch call
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Get the options from the fetch call
      const options = fetch.mock.calls[0][1];
      
      // Verify the Authorization header is set correctly
      expect(options.headers).toHaveProperty('Authorization', 'Bearer mock-token');
    });
    
    it('should handle non-JSON responses', async () => {
      // Setup fetch to return non-JSON content
      fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error('Invalid JSON')),
          text: () => Promise.resolve('Plain text response'),
          headers: {
            get: () => 'text/plain'
          }
        })
      );
      
      // Execute the method
      const result = await apiClient.request('/test-endpoint');
      
      // Verify result has text content
      expect(result).toHaveProperty('text', 'Plain text response');
      expect(result).toHaveProperty('success', true);
    });
    
    it('should handle HTTP error responses', async () => {
      // Setup fetch to return an error response
      fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Not found'),
          headers: {
            get: () => 'text/plain'
          }
        })
      );
      
      // Execute and expect error
      await expect(apiClient.request('/test-endpoint')).rejects.toThrow('API request failed (404)');
    });
  });
});