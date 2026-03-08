/**
 * Onboarding Service
 * Manages user onboarding state and sample data generation
 */

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  completedAt?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    logo?: string;
  };
  preferences?: {
    generateSampleData: boolean;
    selectedTemplates: string[];
    language: string;
  };
}

export class OnboardingService {
  private static readonly STORAGE_KEY = 'bauplan-buddy-onboarding';

  /**
   * Get onboarding state
   */
  static getState(): OnboardingState {
    const stored = localStorage.getItem(OnboardingService.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      completed: false,
      currentStep: 0,
      skipped: false,
    };
  }

  /**
   * Save onboarding state
   */
  static saveState(state: OnboardingState): void {
    localStorage.setItem(OnboardingService.STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Mark onboarding as completed
   */
  static complete(companyInfo?: OnboardingState['companyInfo']): void {
    const state = OnboardingService.getState();
    state.completed = true;
    state.completedAt = new Date().toISOString();
    if (companyInfo) {
      state.companyInfo = companyInfo;
    }
    OnboardingService.saveState(state);
  }

  /**
   * Skip onboarding
   */
  static skip(): void {
    const state = OnboardingService.getState();
    state.skipped = true;
    state.completed = true;
    state.completedAt = new Date().toISOString();
    OnboardingService.saveState(state);
  }

  /**
   * Reset onboarding (for testing)
   */
  static reset(): void {
    localStorage.removeItem(OnboardingService.STORAGE_KEY);
  }

  /**
   * Check if user should see onboarding
   */
  static shouldShowOnboarding(): boolean {
    const state = OnboardingService.getState();
    return !state.completed && !state.skipped;
  }

  /**
   * Update current step
   */
  static updateStep(step: number): void {
    const state = OnboardingService.getState();
    state.currentStep = step;
    OnboardingService.saveState(state);
  }

  /**
   * Save company information
   */
  static saveCompanyInfo(companyInfo: OnboardingState['companyInfo']): void {
    const state = OnboardingService.getState();
    state.companyInfo = companyInfo;
    OnboardingService.saveState(state);
  }

  /**
   * Save preferences
   */
  static savePreferences(preferences: OnboardingState['preferences']): void {
    const state = OnboardingService.getState();
    state.preferences = preferences;
    OnboardingService.saveState(state);
  }

  /**
   * Generate sample data for testing
   */
  static generateSampleData(): void {
    // This will populate localStorage with sample customers, quotes, etc.
    const sampleCustomers = [
      {
        id: 'cust_sample_1',
        name: 'Mustermann GmbH',
        email: 'info@mustermann.de',
        phone: '+49 123 456789',
        address: 'Musterstraße 1, 12345 Musterstadt',
        type: 'company',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cust_sample_2',
        name: 'Max Beispiel',
        email: 'max@beispiel.de',
        phone: '+49 987 654321',
        address: 'Beispielweg 10, 54321 Beispielstadt',
        type: 'private',
        createdAt: new Date().toISOString(),
      },
    ];

    const sampleQuotes = [
      {
        id: 'quote_sample_1',
        number: 'ANG-2024-001',
        customer: 'Mustermann GmbH',
        customerId: 'cust_sample_1',
        project: 'Stahlkonstruktion Lagerhalle',
        amount: 45000,
        status: 'sent',
        date: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        positions: [
          {
            id: 'pos_1',
            description: 'Stahlträger IPE 200',
            quantity: 50,
            unit: 'm',
            unitPrice: 45.50,
            total: 2275,
            category: 'material',
          },
          {
            id: 'pos_2',
            description: 'Montagearbeiten',
            quantity: 120,
            unit: 'Std',
            unitPrice: 65,
            total: 7800,
            category: 'labor',
          },
        ],
      },
    ];

    // Save to localStorage
    localStorage.setItem('bauplan-buddy-customers', JSON.stringify(sampleCustomers));
    localStorage.setItem('bauplan-buddy-quotes', JSON.stringify(sampleQuotes));
  }
}

export const onboardingService = OnboardingService;
