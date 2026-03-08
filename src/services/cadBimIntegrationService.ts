export interface CadBimProvider {
  id: string;
  name: string;
  type: 'autocad' | 'revit' | 'bim360' | 'bentley' | 'archicad' | 'sketchup' | 'tekla' | 'custom';
  enabled: boolean;
  authenticated: boolean;
  apiEndpoint: string;
  credentials: CadBimCredentials;
  lastSync: Date;
  features: CadBimFeatures;
  version: string;
  supportedFormats: string[];
}

export interface CadBimCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  username?: string;
  password?: string;
  instanceUrl?: string;
  hubId?: string; // BIM 360 specific
  projectId?: string; // Project specific
}

export interface CadBimFeatures {
  supportsDrawings: boolean;
  supports3DModels: boolean;
  supportsSheets: boolean;
  supportsAnnotations: boolean;
  supportsVersioning: boolean;
  supportsCollaboration: boolean;
  supportsViewing: boolean;
  supportsMarkup: boolean;
  supportsExport: boolean;
  supportsImport: boolean;
}

export interface CadDrawing {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  projectId: string;
  version: string;
  format: 'dwg' | 'dxf' | 'rvt' | 'ifc' | 'skp' | 'dgn' | 'pdf';
  fileSize: number;
  fileName: string;
  filePath?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  created: Date;
  updated: Date;
  createdBy: string;
  updatedBy: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
  metadata: CadDrawingMetadata;
}

export interface CadDrawingMetadata {
  scale?: string;
  units: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  discipline: 'architectural' | 'structural' | 'mechanical' | 'electrical' | 'plumbing' | 'civil' | 'landscape';
  phase: 'design' | 'construction' | 'as_built';
  level?: string;
  area?: number;
  customProperties: Record<string, unknown>;
}

export interface BimModel {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  projectId: string;
  version: string;
  format: 'rvt' | 'ifc' | 'nwd' | 'dwf' | 'skp' | 'dgn';
  fileSize: number;
  fileName: string;
  downloadUrl?: string;
  viewerUrl?: string;
  thumbnailUrl?: string;
  created: Date;
  updated: Date;
  createdBy: string;
  updatedBy: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
  geometry: BimGeometry;
  elements: BimElement[];
}

export interface BimGeometry {
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  center: { x: number; y: number; z: number };
  volume?: number;
  area?: number;
  height?: number;
}

export interface BimElement {
  id: string;
  globalId: string;
  name: string;
  type: 'wall' | 'door' | 'window' | 'floor' | 'roof' | 'column' | 'beam' | 'space' | 'equipment' | 'other';
  category: string;
  level?: string;
  material?: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
    volume?: number;
  };
  properties: Record<string, unknown>;
  location: { x: number; y: number; z: number };
}

export interface CadSheet {
  id: string;
  externalId: string;
  name: string;
  number: string;
  drawingId: string;
  size: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'ANSI_A' | 'ANSI_B' | 'ANSI_C' | 'ANSI_D' | 'ANSI_E';
  scale: string;
  viewports: CadViewport[];
  annotations: CadAnnotation[];
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  providerId: string;
}

export interface CadViewport {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  scale: number;
  viewType: 'plan' | 'elevation' | 'section' | '3d' | 'detail';
}

export interface CadAnnotation {
  id: string;
  type: 'text' | 'dimension' | 'leader' | 'symbol' | 'markup';
  content: string;
  position: { x: number; y: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    lineWeight?: number;
  };
  created: Date;
  createdBy: string;
}

export interface CadBimProject {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'archived';
  startDate: Date;
  endDate?: Date;
  location?: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  drawings: string[]; // Drawing IDs
  models: string[]; // Model IDs
  sheets: string[]; // Sheet IDs
  collaborators: CadBimCollaborator[];
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface CadBimCollaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: string[];
  lastActivity?: Date;
}

export interface CadBimSyncResult {
  success: boolean;
  providerId: string;
  entity: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export class CadBimIntegrationService {
  private static instance: CadBimIntegrationService;
  private providers: Map<string, CadBimProvider> = new Map();
  private drawings: Map<string, CadDrawing> = new Map();
  private models: Map<string, BimModel> = new Map();
  private sheets: Map<string, CadSheet> = new Map();
  private projects: Map<string, CadBimProject> = new Map();
  private syncHistory: CadBimSyncResult[] = [];

  static getInstance(): CadBimIntegrationService {
    if (!CadBimIntegrationService.instance) {
      CadBimIntegrationService.instance = new CadBimIntegrationService();
    }
    return CadBimIntegrationService.instance;
  }

  constructor() {
    this.loadData();
    this.initializeDefaultProviders();
  }

  private loadData(): void {
    try {
      const storedProviders = localStorage.getItem('cadBim_providers');
      if (storedProviders) {
        const providerData = JSON.parse(storedProviders);
        Object.entries(providerData).forEach(([id, provider]: [string, CadBimProvider]) => {
          this.providers.set(id, {
            ...provider,
            lastSync: new Date(provider.lastSync),
            credentials: {
              ...provider.credentials,
              tokenExpiry: provider.credentials.tokenExpiry ? new Date(provider.credentials.tokenExpiry) : undefined
            }
          });
        });
      }

      const storedDrawings = localStorage.getItem('cadBim_drawings');
      if (storedDrawings) {
        const drawingData = JSON.parse(storedDrawings);
        Object.entries(drawingData).forEach(([id, drawing]: [string, CadDrawing]) => {
          this.drawings.set(id, {
            ...drawing,
            created: new Date(drawing.created),
            updated: new Date(drawing.updated),
            lastSync: drawing.lastSync ? new Date(drawing.lastSync) : undefined
          });
        });
      }

      const storedModels = localStorage.getItem('cadBim_models');
      if (storedModels) {
        const modelData = JSON.parse(storedModels);
        Object.entries(modelData).forEach(([id, model]: [string, BimModel]) => {
          this.models.set(id, {
            ...model,
            created: new Date(model.created),
            updated: new Date(model.updated),
            lastSync: model.lastSync ? new Date(model.lastSync) : undefined
          });
        });
      }

      const storedProjects = localStorage.getItem('cadBim_projects');
      if (storedProjects) {
        const projectData = JSON.parse(storedProjects);
        Object.entries(projectData).forEach(([id, project]: [string, CadBimProject]) => {
          this.projects.set(id, {
            ...project,
            startDate: new Date(project.startDate),
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            created: new Date(project.created),
            updated: new Date(project.updated),
            lastSync: project.lastSync ? new Date(project.lastSync) : undefined
          });
        });
      }
    } catch (error) {
      console.error('Failed to load CAD/BIM data:', error);
    }
  }

  private saveData(): void {
    try {
      const providerData: Record<string, CadBimProvider> = {};
      this.providers.forEach((provider, id) => {
        providerData[id] = provider;
      });
      localStorage.setItem('cadBim_providers', JSON.stringify(providerData));

      const drawingData: Record<string, CadDrawing> = {};
      this.drawings.forEach((drawing, id) => {
        drawingData[id] = drawing;
      });
      localStorage.setItem('cadBim_drawings', JSON.stringify(drawingData));

      const modelData: Record<string, BimModel> = {};
      this.models.forEach((model, id) => {
        modelData[id] = model;
      });
      localStorage.setItem('cadBim_models', JSON.stringify(modelData));

      const projectData: Record<string, CadBimProject> = {};
      this.projects.forEach((project, id) => {
        projectData[id] = project;
      });
      localStorage.setItem('cadBim_projects', JSON.stringify(projectData));
    } catch (error) {
      console.error('Failed to save CAD/BIM data:', error);
    }
  }

  private initializeDefaultProviders(): void {
    const defaultProviders = [
      {
        id: 'autocad_default',
        name: 'AutoCAD Web API',
        type: 'autocad' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://developer.api.autodesk.com',
        version: '2024',
        supportedFormats: ['dwg', 'dxf', 'pdf'],
        features: {
          supportsDrawings: true,
          supports3DModels: false,
          supportsSheets: true,
          supportsAnnotations: true,
          supportsVersioning: true,
          supportsCollaboration: false,
          supportsViewing: true,
          supportsMarkup: true,
          supportsExport: true,
          supportsImport: true
        }
      },
      {
        id: 'revit_default',
        name: 'Autodesk Revit',
        type: 'revit' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://developer.api.autodesk.com',
        version: '2024',
        supportedFormats: ['rvt', 'ifc', 'dwg', 'dwf'],
        features: {
          supportsDrawings: true,
          supports3DModels: true,
          supportsSheets: true,
          supportsAnnotations: true,
          supportsVersioning: true,
          supportsCollaboration: true,
          supportsViewing: true,
          supportsMarkup: true,
          supportsExport: true,
          supportsImport: true
        }
      },
      {
        id: 'bim360_default',
        name: 'Autodesk BIM 360',
        type: 'bim360' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://developer.api.autodesk.com',
        version: 'v1',
        supportedFormats: ['rvt', 'dwg', 'ifc', 'nwd', 'pdf'],
        features: {
          supportsDrawings: true,
          supports3DModels: true,
          supportsSheets: true,
          supportsAnnotations: true,
          supportsVersioning: true,
          supportsCollaboration: true,
          supportsViewing: true,
          supportsMarkup: true,
          supportsExport: true,
          supportsImport: true
        }
      },
      {
        id: 'bentley_default',
        name: 'Bentley Systems',
        type: 'bentley' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://api.bentley.com',
        version: 'v1',
        supportedFormats: ['dgn', 'dwg', 'ifc', 'pdf'],
        features: {
          supportsDrawings: true,
          supports3DModels: true,
          supportsSheets: true,
          supportsAnnotations: true,
          supportsVersioning: true,
          supportsCollaboration: true,
          supportsViewing: true,
          supportsMarkup: true,
          supportsExport: true,
          supportsImport: true
        }
      }
    ];

    defaultProviders.forEach(providerData => {
      if (!this.providers.has(providerData.id)) {
        const provider: CadBimProvider = {
          ...providerData,
          credentials: {},
          lastSync: new Date()
        };
        this.providers.set(providerData.id, provider);
      }
    });

    this.saveData();
  }

  // Provider Management
  public async authenticateProvider(providerId: string, credentials: CadBimCredentials): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      provider.credentials = credentials;
      provider.authenticated = true;
      provider.enabled = true;
      
      if (credentials.accessToken) {
        provider.credentials.tokenExpiry = new Date(Date.now() + 3600000);
      }
      
      this.saveData();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  public async syncProvider(providerId: string): Promise<CadBimSyncResult> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.authenticated) {
      return {
        success: false,
        providerId,
        entity: 'all',
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: ['Provider not authenticated'],
        duration: 0,
        timestamp: new Date()
      };
    }

    const startTime = Date.now();

    try {
      // Simulate sync with mock data
      const mockProjects = this.generateMockProjects(providerId);
      const mockDrawings = this.generateMockDrawings(providerId);
      const mockModels = this.generateMockModels(providerId);

      mockProjects.forEach(project => this.projects.set(project.id, project));
      mockDrawings.forEach(drawing => this.drawings.set(drawing.id, drawing));
      mockModels.forEach(model => this.models.set(model.id, model));

      provider.lastSync = new Date();
      this.saveData();

      const totalRecords = mockProjects.length + mockDrawings.length + mockModels.length;

      const result: CadBimSyncResult = {
        success: true,
        providerId,
        entity: 'all',
        recordsProcessed: totalRecords,
        recordsSucceeded: totalRecords,
        recordsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.syncHistory.push(result);
      return result;

    } catch (error) {
      return {
        success: false,
        providerId,
        entity: 'all',
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  private generateMockProjects(providerId: string): CadBimProject[] {
    return [
      {
        id: `project_${providerId}_1`,
        externalId: 'PROJ001',
        name: 'Office Building Complex',
        description: 'Modern office building with sustainable design',
        status: 'active',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        location: {
          address: 'Potsdamer Platz 1',
          city: 'Berlin',
          country: 'Germany',
          coordinates: { lat: 52.5096, lng: 13.3766 }
        },
        drawings: [],
        models: [],
        sheets: [],
        collaborators: [
          {
            id: 'user_1',
            name: 'Max Architect',
            email: 'max@architecture.com',
            role: 'owner',
            permissions: ['read', 'write', 'admin'],
            lastActivity: new Date()
          }
        ],
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        lastSync: new Date(),
        providerId
      }
    ];
  }

  private generateMockDrawings(providerId: string): CadDrawing[] {
    return [
      {
        id: `drawing_${providerId}_1`,
        externalId: 'DWG001',
        name: 'Ground Floor Plan',
        description: 'Architectural floor plan for ground level',
        projectId: `project_${providerId}_1`,
        version: '1.0',
        format: 'dwg',
        fileSize: 2560000,
        fileName: 'ground_floor_plan.dwg',
        downloadUrl: 'https://example.com/drawings/ground_floor_plan.dwg',
        thumbnailUrl: 'https://example.com/thumbnails/ground_floor_plan.png',
        created: new Date(),
        updated: new Date(),
        createdBy: 'Max Architect',
        updatedBy: 'Max Architect',
        status: 'approved',
        syncStatus: 'synced',
        lastSync: new Date(),
        providerId,
        metadata: {
          scale: '1:100',
          units: 'm',
          discipline: 'architectural',
          phase: 'design',
          level: 'Ground Floor',
          area: 1250.5,
          customProperties: {
            buildingCode: 'A001',
            revisionNumber: 'R01'
          }
        }
      },
      {
        id: `drawing_${providerId}_2`,
        externalId: 'DWG002',
        name: 'Structural Foundation Plan',
        description: 'Foundation layout and reinforcement details',
        projectId: `project_${providerId}_1`,
        version: '1.1',
        format: 'dwg',
        fileSize: 3200000,
        fileName: 'foundation_plan.dwg',
        downloadUrl: 'https://example.com/drawings/foundation_plan.dwg',
        thumbnailUrl: 'https://example.com/thumbnails/foundation_plan.png',
        created: new Date(),
        updated: new Date(),
        createdBy: 'Structural Engineer',
        updatedBy: 'Structural Engineer',
        status: 'review',
        syncStatus: 'synced',
        lastSync: new Date(),
        providerId,
        metadata: {
          scale: '1:50',
          units: 'm',
          discipline: 'structural',
          phase: 'design',
          level: 'Foundation',
          area: 1250.5,
          customProperties: {
            concreteGrade: 'C30/37',
            reinforcement: 'B500B'
          }
        }
      }
    ];
  }

  private generateMockModels(providerId: string): BimModel[] {
    return [
      {
        id: `model_${providerId}_1`,
        externalId: 'BIM001',
        name: 'Office Building 3D Model',
        description: 'Complete 3D architectural model',
        projectId: `project_${providerId}_1`,
        version: '2.0',
        format: 'rvt',
        fileSize: 156000000,
        fileName: 'office_building.rvt',
        downloadUrl: 'https://example.com/models/office_building.rvt',
        viewerUrl: 'https://viewer.autodesk.com/office_building',
        thumbnailUrl: 'https://example.com/thumbnails/office_building.png',
        created: new Date(),
        updated: new Date(),
        createdBy: 'BIM Coordinator',
        updatedBy: 'BIM Coordinator',
        status: 'approved',
        syncStatus: 'synced',
        lastSync: new Date(),
        providerId,
        geometry: {
          boundingBox: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 50, y: 30, z: 25 }
          },
          center: { x: 25, y: 15, z: 12.5 },
          volume: 37500,
          area: 3750,
          height: 25
        },
        elements: [
          {
            id: 'wall_001',
            globalId: 'GUID-001-WALL',
            name: 'Exterior Wall - South',
            type: 'wall',
            category: 'Walls',
            level: 'Ground Floor',
            material: 'Reinforced Concrete',
            dimensions: {
              length: 50,
              width: 0.3,
              height: 3.5,
              area: 175,
              volume: 52.5
            },
            properties: {
              fireRating: '2 hours',
              thermalTransmittance: 0.28,
              loadBearing: true
            },
            location: { x: 25, y: 0, z: 1.75 }
          }
        ]
      }
    ];
  }

  // Query Methods
  public getProviders(): CadBimProvider[] {
    return Array.from(this.providers.values());
  }

  public getProjects(providerId?: string): CadBimProject[] {
    const projects = Array.from(this.projects.values());
    return providerId ? projects.filter(p => p.providerId === providerId) : projects;
  }

  public getDrawings(projectId?: string, providerId?: string): CadDrawing[] {
    let drawings = Array.from(this.drawings.values());
    if (projectId) drawings = drawings.filter(d => d.projectId === projectId);
    if (providerId) drawings = drawings.filter(d => d.providerId === providerId);
    return drawings;
  }

  public getModels(projectId?: string, providerId?: string): BimModel[] {
    let models = Array.from(this.models.values());
    if (projectId) models = models.filter(m => m.projectId === projectId);
    if (providerId) models = models.filter(m => m.providerId === providerId);
    return models;
  }

  public getSyncHistory(): CadBimSyncResult[] {
    return this.syncHistory.slice().reverse();
  }

  public getCadBimStats(): {
    totalProviders: number;
    activeProviders: number;
    totalProjects: number;
    totalDrawings: number;
    totalModels: number;
    totalFileSize: number;
    lastSyncTime: Date | null;
  } {
    const providers = Array.from(this.providers.values());
    const drawings = Array.from(this.drawings.values());
    const models = Array.from(this.models.values());
    const lastSync = this.syncHistory.length > 0 ? this.syncHistory[this.syncHistory.length - 1].timestamp : null;

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.enabled && p.authenticated).length,
      totalProjects: this.projects.size,
      totalDrawings: this.drawings.size,
      totalModels: this.models.size,
      totalFileSize: [...drawings, ...models].reduce((sum, item) => sum + item.fileSize, 0),
      lastSyncTime: lastSync
    };
  }

  // File operations
  public async downloadDrawing(drawingId: string): Promise<Blob | null> {
    const drawing = this.drawings.get(drawingId);
    if (!drawing || !drawing.downloadUrl) return null;

    try {
      // In a real implementation, this would download from the actual provider
      // For now, return a mock blob
      return new Blob(['Mock CAD file content'], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Failed to download drawing:', error);
      return null;
    }
  }

  public async uploadDrawing(projectId: string, file: File, metadata: Partial<CadDrawingMetadata>): Promise<CadDrawing | null> {
    try {
      const drawing: CadDrawing = {
        id: `drawing_${Date.now()}`,
        externalId: '',
        name: file.name.replace(/\.[^/.]+$/, ''),
        projectId,
        version: '1.0',
        format: file.name.split('.').pop()?.toLowerCase() as CadDrawing['format'] || 'dwg',
        fileSize: file.size,
        fileName: file.name,
        created: new Date(),
        updated: new Date(),
        createdBy: 'Current User',
        updatedBy: 'Current User',
        status: 'draft',
        syncStatus: 'pending',
        providerId: 'local',
        metadata: {
          units: 'm',
          discipline: 'architectural',
          phase: 'design',
          customProperties: {},
          ...metadata
        }
      };

      this.drawings.set(drawing.id, drawing);
      this.saveData();
      return drawing;
    } catch (error) {
      console.error('Failed to upload drawing:', error);
      return null;
    }
  }
}

export default CadBimIntegrationService.getInstance();