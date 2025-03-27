/**
 * ConfigManager.test.js
 * Unit tests for the ConfigManager service
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfigManager from '../../../../src/backend/services/ConfigManager.js';

// Mock url module
vi.mock('url', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fileURLToPath: vi.fn().mockReturnValue('/mock/path/ConfigManager.js')
  };
});

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
  };
});

// Mock path module
vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    dirname: vi.fn().mockReturnValue('/mock/directory'),
    join: vi.fn().mockReturnValue('/mock/directory/config.json')
  };
});

describe('ConfigManager', () => {
  let configManager;
  const mockConfig = {
    region: 'us',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    platformEmail: 'test@example.com',
    callbackUrl: 'https://example.com/callback',
    accessToken: 'test-token',
    tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
    initialized: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock file existence and content
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
    
    configManager = new ConfigManager();
  });

  afterEach(() => {
    configManager = null;
  });

  describe('constructor and loadConfig', () => {
    it('should load config from file if it exists', () => {
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(configManager.config).toEqual(mockConfig);
    });

    it('should create default config if file does not exist', () => {
      fs.existsSync.mockReset();
      fs.existsSync.mockImplementation((path) => {
        return path !== '/mock/directory/config.json';
      });
      
      configManager = new ConfigManager();
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(configManager.config.clientId).toBe('');
      expect(configManager.config.initialized).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return config without secret when includeSecret is false', () => {
      const config = configManager.getConfig(false);
      
      expect(config).not.toHaveProperty('clientSecret');
      expect(config).toHaveProperty('clientId', 'test-client-id');
    });

    it('should return config with secret when includeSecret is true', () => {
      const config = configManager.getConfig(true);
      
      expect(config).toHaveProperty('clientSecret', 'test-client-secret');
      expect(config).toHaveProperty('clientId', 'test-client-id');
    });
  });

  describe('getFullAuthUrl', () => {
    it('should return correct auth URL for US region', () => {
      configManager.config.region = 'us';
      
      expect(configManager.getFullAuthUrl()).toBe(
        'https://login-rlspreview.congacloud.com/api/v1/auth/connect/token'
      );
    });

    it('should return correct auth URL for EU region', () => {
      configManager.config.region = 'eu';
      
      expect(configManager.getFullAuthUrl()).toBe(
        'https://login-preview.congacloud.eu/api/v1/auth/connect/token'
      );
    });
  });

  describe('getFullApiUrl', () => {
    it('should return correct API URL for US region', () => {
      configManager.config.region = 'us';
      
      expect(configManager.getFullApiUrl()).toBe(
        'https://coreapps-rlspreview.congacloud.com/api/sign/v1'
      );
    });

    it('should return correct API URL for AU region', () => {
      configManager.config.region = 'au';
      
      expect(configManager.getFullApiUrl()).toBe(
        'https://coreapps-preview.congacloud.au/api/sign/v1'
      );
    });
  });

  describe('isInitialized', () => {
    it('should return true when config is initialized', () => {
      configManager.config.initialized = true;
      
      expect(configManager.isInitialized()).toBe(true);
    });

    it('should return false when config is not initialized', () => {
      configManager.config.initialized = false;
      
      expect(configManager.isInitialized()).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update config values', () => {
      const newConfig = {
        clientId: 'new-client-id',
        platformEmail: 'new@example.com'
      };
      
      configManager.updateConfig(newConfig);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(configManager.config.clientId).toBe('new-client-id');
      expect(configManager.config.platformEmail).toBe('new@example.com');
      expect(configManager.config.clientSecret).toBe('test-client-secret'); // Keeps existing values
    });

    it('should update URLs when region is changed', () => {
      const newConfig = { region: 'eu' };
      
      configManager.updateConfig(newConfig);
      
      expect(configManager.getRegionUrls().authUrl).toBe('https://login-preview.congacloud.eu');
      expect(configManager.getRegionUrls().coreappsUrl).toBe('https://coreapps-preview.congacloud.eu');
    });

    it('should clear token when clientId or clientSecret changes', () => {
      configManager.config.accessToken = 'existing-token';
      configManager.config.tokenExpiry = 'existing-expiry';
      
      configManager.updateConfig({ clientId: 'new-client-id' });
      
      expect(configManager.config.accessToken).toBeNull();
      expect(configManager.config.tokenExpiry).toBeNull();
    });

    it('should set initialized to true when all required fields are present', () => {
      configManager.config = {
        clientId: '',
        clientSecret: '',
        platformEmail: '',
        initialized: false
      };
      
      configManager.updateConfig({
        clientId: 'new-id',
        clientSecret: 'new-secret',
        platformEmail: 'email@example.com'
      });
      
      expect(configManager.config.initialized).toBe(true);
    });

    it('should set initialized to false when required fields are missing', () => {
      configManager.config = {
        clientId: 'id',
        clientSecret: 'secret',
        platformEmail: 'email',
        initialized: true
      };
      
      configManager.updateConfig({ platformEmail: '' });
      
      expect(configManager.config.initialized).toBe(false);
    });
  });

  describe('updateToken', () => {
    it('should update token and expiry time', () => {
      const token = 'new-token';
      const expiresIn = 7200; // 2 hours
      
      configManager.updateToken(token, expiresIn);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(configManager.config.accessToken).toBe('new-token');
      expect(configManager.config.tokenExpiry).toBeDefined();
      
      // Verify that expiry is roughly 2 hours minus 5 minutes from now
      const expiry = new Date(configManager.config.tokenExpiry);
      const expectedExpiry = new Date(Date.now() + (expiresIn * 1000) - (5 * 60 * 1000));
      expect(Math.abs(expiry - expectedExpiry)).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token with future expiry', () => {
      configManager.config.accessToken = 'token';
      configManager.config.tokenExpiry = new Date(Date.now() + 3600000).toISOString();
      
      expect(configManager.isTokenValid()).toBe(true);
    });

    it('should return false for token with expired time', () => {
      configManager.config.accessToken = 'token';
      configManager.config.tokenExpiry = new Date(Date.now() - 3600000).toISOString();
      
      expect(configManager.isTokenValid()).toBe(false);
    });

    it('should return false when no token exists', () => {
      configManager.config.accessToken = null;
      configManager.config.tokenExpiry = new Date(Date.now() + 3600000).toISOString();
      
      expect(configManager.isTokenValid()).toBe(false);
    });

    it('should return false when no expiry exists', () => {
      configManager.config.accessToken = 'token';
      configManager.config.tokenExpiry = null;
      
      expect(configManager.isTokenValid()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset config to defaults but keep region if specified', () => {
      configManager.config.region = 'eu';
      configManager.config.clientId = 'test-id';
      
      configManager.reset(true);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(configManager.config.clientId).toBe('');
      expect(configManager.config.region).toBe('eu');
    });

    it('should reset config including region if specified', () => {
      configManager.config.region = 'eu';
      configManager.config.clientId = 'test-id';
      
      configManager.reset(false);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(configManager.config.clientId).toBe('');
      expect(configManager.config.region).toBe('us');
    });
  });
});