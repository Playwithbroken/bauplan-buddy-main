/* PresetService: store and retrieve user-defined presets for products and wages.
   Persistence: localStorage (workspace front-end). Keys are namespaced to avoid collisions.
*/

export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

export interface ProductPreset {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unit?: 'pcs' | 'm' | 'kg' | 'l' | 'set';
  defaultUnitPrice?: number;
  supplierId?: string;
  supplierName?: string;
  currency?: CurrencyCode;
}

export interface WagePreset {
  id: string;
  role: string;
  hourlyRate: number;
  currency?: CurrencyCode;
  department?: string;
}

export interface TravelCostPreset {
  id: string;
  name: string;
  type: 'km' | 'flat' | 'parking' | 'toll';
  pricePerUnit?: number; // EUR/km for 'km' type
  flatAmount?: number; // for 'flat', 'parking', 'toll'
  currency?: CurrencyCode;
  description?: string;
}

export interface ServicePreset {
  id: string;
  name: string;
  description?: string;
  category?: string; // 'construction' | 'repair' | 'installation' | 'planning'
  defaultPrice?: number;
  unit?: 'hour' | 'day' | 'piece' | 'sqm';
  currency?: CurrencyCode;
  estimatedDuration?: number; // in hours
}

const LS_PRODUCTS_KEY = 'bauplan.presets.products';
const LS_WAGES_KEY = 'bauplan.presets.wages';
const LS_TRAVEL_COSTS_KEY = 'bauplan.presets.travelCosts';
const LS_SERVICES_KEY = 'bauplan.presets.services';

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function genId(prefix: string): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rnd}`;
}

export const PresetService = {
  // Product presets
  listProductPresets(): ProductPreset[] {
    return readList<ProductPreset>(LS_PRODUCTS_KEY);
  },
  getProductPreset(id: string): ProductPreset | undefined {
    return this.listProductPresets().find(p => p.id === id);
  },
  createProductPreset(preset: Omit<ProductPreset, 'id'>): ProductPreset {
    const list = this.listProductPresets();
    const item: ProductPreset = { id: genId('prod'), currency: 'EUR', ...preset };
    writeList(LS_PRODUCTS_KEY, [item, ...list]);
    return item;
  },
  updateProductPreset(id: string, patch: Partial<ProductPreset>): ProductPreset | undefined {
    const list = this.listProductPresets();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const updated = { ...list[idx], ...patch };
    list[idx] = updated;
    writeList(LS_PRODUCTS_KEY, list);
    return updated;
  },
  removeProductPreset(id: string): void {
    const list = this.listProductPresets().filter(p => p.id !== id);
    writeList(LS_PRODUCTS_KEY, list);
  },

  // Wage presets
  listWagePresets(): WagePreset[] {
    return readList<WagePreset>(LS_WAGES_KEY);
  },
  getWagePreset(id: string): WagePreset | undefined {
    return this.listWagePresets().find(p => p.id === id);
  },
  createWagePreset(preset: Omit<WagePreset, 'id'>): WagePreset {
    const list = this.listWagePresets();
    const item: WagePreset = { id: genId('wage'), currency: 'EUR', ...preset };
    writeList(LS_WAGES_KEY, [item, ...list]);
    return item;
  },
  updateWagePreset(id: string, patch: Partial<WagePreset>): WagePreset | undefined {
    const list = this.listWagePresets();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const updated = { ...list[idx], ...patch };
    list[idx] = updated;
    writeList(LS_WAGES_KEY, list);
    return updated;
  },
  removeWagePreset(id: string): void {
    const list = this.listWagePresets().filter(p => p.id !== id);
    writeList(LS_WAGES_KEY, list);
  },

  // Travel cost presets
  listTravelCostPresets(): TravelCostPreset[] {
    return readList<TravelCostPreset>(LS_TRAVEL_COSTS_KEY);
  },
  getTravelCostPreset(id: string): TravelCostPreset | undefined {
    return this.listTravelCostPresets().find(p => p.id === id);
  },
  createTravelCostPreset(preset: Omit<TravelCostPreset, 'id'>): TravelCostPreset {
    const list = this.listTravelCostPresets();
    const item: TravelCostPreset = { id: genId('travel'), currency: 'EUR', ...preset };
    writeList(LS_TRAVEL_COSTS_KEY, [item, ...list]);
    return item;
  },
  updateTravelCostPreset(id: string, patch: Partial<TravelCostPreset>): TravelCostPreset | undefined {
    const list = this.listTravelCostPresets();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const updated = { ...list[idx], ...patch };
    list[idx] = updated;
    writeList(LS_TRAVEL_COSTS_KEY, list);
    return updated;
  },
  removeTravelCostPreset(id: string): void {
    const list = this.listTravelCostPresets().filter(p => p.id !== id);
    writeList(LS_TRAVEL_COSTS_KEY, list);
  },

  // Service presets
  listServicePresets(): ServicePreset[] {
    return readList<ServicePreset>(LS_SERVICES_KEY);
  },
  getServicePreset(id: string): ServicePreset | undefined {
    return this.listServicePresets().find(p => p.id === id);
  },
  createServicePreset(preset: Omit<ServicePreset, 'id'>): ServicePreset {
    const list = this.listServicePresets();
    const item: ServicePreset = { id: genId('service'), currency: 'EUR', ...preset };
    writeList(LS_SERVICES_KEY, [item, ...list]);
    return item;
  },
  updateServicePreset(id: string, patch: Partial<ServicePreset>): ServicePreset | undefined {
    const list = this.listServicePresets();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const updated = { ...list[idx], ...patch };
    list[idx] = updated;
    writeList(LS_SERVICES_KEY, list);
    return updated;
  },
  removeServicePreset(id: string): void {
    const list = this.listServicePresets().filter(p => p.id !== id);
    writeList(LS_SERVICES_KEY, list);
  },

  // Initialize common presets (call once on first app start)
  initializeDefaultPresets(): void {
    // Only initialize if no presets exist yet
    if (this.listTravelCostPresets().length === 0) {
      this.createTravelCostPreset({
        name: 'Fahrtkosten (PKW)',
        type: 'km',
        pricePerUnit: 0.30,
        description: 'Standard PKW-Pauschale pro Kilometer'
      });
      this.createTravelCostPreset({
        name: 'Anfahrtspauschale',
        type: 'flat',
        flatAmount: 50,
        description: 'Pauschale für Anfahrt zur Baustelle'
      });
    }

    if (this.listServicePresets().length === 0) {
      this.createServicePreset({
        name: 'Maurerarbeiten',
        category: 'construction',
        defaultPrice: 65,
        unit: 'hour',
        estimatedDuration: 8
      });
      this.createServicePreset({
        name: 'Elektroinstallation',
        category: 'installation',
        defaultPrice: 75,
        unit: 'hour',
        estimatedDuration: 6
      });
      this.createServicePreset({
        name: 'Sanitärarbeiten',
        category: 'installation',
        defaultPrice: 70,
        unit: 'hour',
        estimatedDuration: 6
      });
    }

    if (this.listWagePresets().length === 0) {
      this.createWagePreset({
        role: 'Geselle',
        hourlyRate: 35
      });
      this.createWagePreset({
        role: 'Meister',
        hourlyRate: 55
      });
      this.createWagePreset({
        role: 'Helfer',
        hourlyRate: 25
      });
    }
  },
};
