import cadBimIntegrationService, {
  CadBimProvider,
  CadBimProject,
  CadBimDrawing,
  BimModel,
  SyncHistoryEntry
} from '../cadBimIntegrationService';

// Mock File API
global.File = jest.fn() as any;

describe('CadBimIntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Management', () => {
    test('should get all available providers', () => {
      const providers = cadBimIntegrationService.getProviders();
      
      expect(providers).toHaveLength(4);
      expect(providers.map(p => p.id)).toEqual([
        'autocad_default',
        'revit_default',
        'bim360_default',
        'bentley_default'
      ]);
    });

    test('should connect to a provider', async () => {
      const result = await cadBimIntegrationService.connectProvider('autocad', {
        apiKey: 'test-key',
        serverUrl: 'https://api.autodesk.com'
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Connected to AutoCAD');
    });

    test('should handle connection errors', async () => {
      const result = await cadBimIntegrationService.connectProvider('invalid-provider' as any, {});
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown provider');
    });

    test('should disconnect from a provider', async () => {
      // First connect
      await cadBimIntegrationService.connectProvider('revit', {
        username: 'test@example.com',
        password: 'password'
      });
      
      // Then disconnect
      const result = await cadBimIntegrationService.disconnectProvider('revit');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Disconnected from Revit');
    });

    test('should get connection status', () => {
      const status = cadBimIntegrationService.getConnectionStatus('autocad');
      
      expect(status).toBeDefined();
      expect(['connected', 'disconnected', 'connecting', 'error']).toContain(status);
    });
  });

  describe('Project Management', () => {
    test('should get projects from connected providers', async () => {
      const projects = await cadBimIntegrationService.getProjects('autocad');
      
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toHaveProperty('id');
      expect(projects[0]).toHaveProperty('name');
      expect(projects[0]).toHaveProperty('provider');
    });

    test('should handle errors when getting projects from disconnected provider', async () => {
      const projects = await cadBimIntegrationService.getProjects('unknown' as any);
      
      expect(projects).toEqual([]);
    });

    test('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        location: 'Test Location'
      };
      
      const result = await cadBimIntegrationService.createProject('autocad', projectData);
      
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.name).toBe('Test Project');
    });

    test('should handle project creation errors', async () => {
      const result = await cadBimIntegrationService.createProject('invalid' as any, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider not connected');
    });
  });

  describe('Drawing Management', () => {
    test('should get drawings for a project', async () => {
      const drawings = await cadBimIntegrationService.getDrawings('autocad', 'project-1');
      
      expect(Array.isArray(drawings)).toBe(true);
      expect(drawings.length).toBeGreaterThan(0);
      expect(drawings[0]).toHaveProperty('id');
      expect(drawings[0]).toHaveProperty('name');
      expect(drawings[0]).toHaveProperty('version');
    });

    test('should upload a drawing file', async () => {
      const mockFile = new File(['drawing content'], 'test.dwg', { type: 'application/acad' });
      
      const result = await cadBimIntegrationService.uploadDrawing(
        'autocad',
        'project-1',
        mockFile,
        { name: 'Test Drawing', description: 'Test upload' }
      );
      
      expect(result.success).toBe(true);
      expect(result.drawing).toBeDefined();
      expect(result.drawing?.name).toBe('Test Drawing');
    });

    test('should handle drawing upload errors', async () => {
      const mockFile = new File([''], 'empty.dwg', { type: 'application/acad' });
      
      const result = await cadBimIntegrationService.uploadDrawing(
        'invalid' as any,
        'project-1',
        mockFile
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider not connected');
    });
  });

  describe('BIM Model Management', () => {
    test('should get BIM models for a project', async () => {
      const models = await cadBimIntegrationService.getBimModels('revit', 'project-1');
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('discipline');
    });

    test('should upload a BIM model', async () => {
      const mockFile = new File(['model content'], 'test.rvt', { type: 'application/revit' });
      
      const result = await cadBimIntegrationService.uploadBimModel(
        'revit',
        'project-1',
        mockFile,
        { name: 'Test Model', discipline: 'Architectural' }
      );
      
      expect(result.success).toBe(true);
      expect(result.model).toBeDefined();
      expect(result.model?.name).toBe('Test Model');
    });
  });

  describe('Synchronization', () => {
    test('should perform full synchronization', async () => {
      const result = await cadBimIntegrationService.syncWithProvider('autocad', 'project-1');
      
      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary?.drawings).toBeDefined();
      expect(result.summary?.models).toBeDefined();
    });

    test('should handle sync errors', async () => {
      const result = await cadBimIntegrationService.syncWithProvider('invalid' as any, 'project-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider not connected');
    });

    test('should get sync history', async () => {
      const history = await cadBimIntegrationService.getSyncHistory('autocad', 'project-1');
      
      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('id');
        expect(history[0]).toHaveProperty('timestamp');
        expect(history[0]).toHaveProperty('status');
      }
    });
  });

  describe('Data Export', () => {
    test('should export project data', async () => {
      const result = await cadBimIntegrationService.exportProjectData(
        'autocad',
        'project-1',
        { format: 'json', includeModels: true }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should handle export errors', async () => {
      const result = await cadBimIntegrationService.exportProjectData(
        'invalid' as any,
        'project-1'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider not connected');
    });
  });

  describe('Configuration', () => {
    test('should get provider configuration', () => {
      const config = cadBimIntegrationService.getProviderConfig('autocad');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('autocad');
      expect(config?.name).toBe('AutoCAD');
    });

    test('should return null for unknown provider config', () => {
      const config = cadBimIntegrationService.getProviderConfig('unknown' as any);
      
      expect(config).toBeNull();
    });

    test('should update provider settings', async () => {
      const result = await cadBimIntegrationService.updateProviderSettings('autocad', {
        autoSync: true,
        syncInterval: 30
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock a network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await cadBimIntegrationService.syncWithProvider('autocad', 'project-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Sync failed');
      
      // Restore fetch
      global.fetch = originalFetch;
    });

    test('should validate file types', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      const result = await cadBimIntegrationService.uploadDrawing(
        'autocad',
        'project-1',
        invalidFile
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('Utility Functions', () => {
    test('should format file sizes correctly', () => {
      const formatSize = (cadBimIntegrationService as any).formatFileSize;
      
      expect(formatSize(1024)).toBe('1.0 KB');
      expect(formatSize(1048576)).toBe('1.0 MB');
      expect(formatSize(1073741824)).toBe('1.0 GB');
    });

    test('should validate provider credentials', () => {
      const validateCredentials = (cadBimIntegrationService as any).validateCredentials;
      
      expect(validateCredentials('autocad', { apiKey: 'test' })).toBe(true);
      expect(validateCredentials('autocad', {})).toBe(false);
      expect(validateCredentials('revit', { username: 'test', password: 'pass' })).toBe(true);
      expect(validateCredentials('revit', { username: 'test' })).toBe(false);
    });
  });
});