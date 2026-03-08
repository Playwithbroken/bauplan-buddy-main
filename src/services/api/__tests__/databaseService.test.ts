import { configService, apiClient } from '../../databaseService';
import { userApiService } from '../userApiService';
import { projectApiService } from '../projectApiService';
import { appointmentApiService } from '../appointmentApiService';
import { documentApiService } from '../documentApiService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ConfigService', () => {
    it('should default to localStorage when API is not configured', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(configService.shouldUseApi()).toBe(false);
    });

    it('should return correct API configuration', () => {
      const config = configService.getApiConfig();
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('timeout');
    });

    it('should return correct database configuration', () => {
      const config = configService.getDatabaseConfig();
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('host');
    });
  });

  describe('API Client', () => {
    it('should create API client with correct configuration', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });
  });

  describe('API Services', () => {
    it('should create user API service', () => {
      expect(userApiService).toBeDefined();
      expect(typeof userApiService.getUsers).toBe('function');
      expect(typeof userApiService.createUser).toBe('function');
    });

    it('should create project API service', () => {
      expect(projectApiService).toBeDefined();
      expect(typeof projectApiService.getProjects).toBe('function');
      expect(typeof projectApiService.createProject).toBe('function');
    });

    it('should create appointment API service', () => {
      expect(appointmentApiService).toBeDefined();
      expect(typeof appointmentApiService.getAppointments).toBe('function');
      expect(typeof appointmentApiService.createAppointment).toBe('function');
    });

    it('should create document API service', () => {
      expect(documentApiService).toBeDefined();
      expect(typeof documentApiService.getDocuments).toBe('function');
      expect(typeof documentApiService.uploadDocument).toBe('function');
    });
  });

  describe('localStorage fallback', () => {
    it('should use localStorage when API is not available', async () => {
      // Test user service localStorage fallback
      const users = await userApiService.getUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const users = await userApiService.getUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });
});