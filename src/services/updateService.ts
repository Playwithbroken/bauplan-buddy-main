/**
 * Update Service
 * Automatische Updates und Changelog-Management
 */

interface AppVersion {
  version: string;
  releaseDate: string;
  changes: {
    features: string[];
    improvements: string[];
    bugfixes: string[];
  };
  critical: boolean;
  downloadUrl?: string;
}

interface UpdateCheck {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog: AppVersion | null;
  critical: boolean;
}

class UpdateService {
  private static instance: UpdateService;
  private currentVersion = '1.0.0'; // From package.json
  private updateCheckUrl = '/api/updates/check';

  private constructor() {}

  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Check for updates
   */
  public async checkForUpdates(): Promise<UpdateCheck> {
    try {
      const response = await fetch(this.updateCheckUrl);
      
      if (!response.ok) {
        throw new Error('Update check failed');
      }

      const latestVersion: AppVersion = await response.json();

      const hasUpdate = this.compareVersions(
        latestVersion.version,
        this.currentVersion
      ) > 0;

      return {
        hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion: latestVersion.version,
        changelog: hasUpdate ? latestVersion : null,
        critical: latestVersion.critical || false,
      };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        changelog: null,
        critical: false,
      };
    }
  }

  /**
   * Compare version strings (semver)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }

  /**
   * Auto-update check on startup
   */
  public async autoCheckUpdates(): Promise<void> {
    // Check once per day
    const lastCheck = localStorage.getItem('bauplan_last_update_check');
    const now = Date.now();

    if (lastCheck && now - parseInt(lastCheck) < 24 * 60 * 60 * 1000) {
      return; // Already checked today
    }

    const result = await this.checkForUpdates();

    if (result.hasUpdate) {
      this.notifyUpdate(result);
    }

    localStorage.setItem('bauplan_last_update_check', now.toString());
  }

  /**
   * Notify user about update
   */
  private notifyUpdate(update: UpdateCheck): void {
    if (update.critical) {
      // Force update notification
      alert(`🚨 Kritisches Update verfügbar!

Bitte aktualisieren Sie auf Version ${update.latestVersion}

Die App wird möglicherweise nicht korrekt funktionieren.`);
    } else {
      // Optional update notification
      const userWantsUpdate = confirm(
        `✨ Neue Version verfügbar!\n\n` +
        `Aktuelle Version: ${update.currentVersion}\n` +
        `Neue Version: ${update.latestVersion}\n\n` +
        `Möchten Sie jetzt aktualisieren?`
      );

      if (userWantsUpdate) {
        this.applyUpdate();
      }
    }
  }

  /**
   * Apply update (reload app)
   */
  public applyUpdate(): void {
    // For PWA: Service Worker update
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update().then(() => {
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      });
    } else {
      // Hard reload
      window.location.reload();
    }
  }

  /**
   * Get changelog
   */
  public getChangelog(): AppVersion[] {
    // This would be fetched from server in production
    return [
      {
        version: '1.1.0',
        releaseDate: '2024-02-15',
        critical: false,
        changes: {
          features: [
            '🎨 Firmen-Branding mit Logo und Farben',
            '👥 Team-Verwaltung mit Berechtigungen',
            '🤖 KI-Support für automatische Hilfe',
          ],
          improvements: [
            'Schnellere Ladezeiten',
            'Bessere Offline-Synchronisation',
            'Optimierte PDF-Generierung',
          ],
          bugfixes: [
            'Login-Problem bei Safari behoben',
            'Rechenfehler bei Mehrwertsteuer korrigiert',
            'Datums-Format auf Deutsch umgestellt',
          ],
        },
      },
      {
        version: '1.0.0',
        releaseDate: '2024-01-01',
        critical: false,
        changes: {
          features: [
            '🚀 Erste Version veröffentlicht',
            '📄 Angebote erstellen',
            '📊 Projekt-Management',
          ],
          improvements: [],
          bugfixes: [],
        },
      },
    ];
  }

  /**
   * Mark current version as seen
   */
  public dismissUpdateNotification(): void {
    localStorage.setItem('bauplan_dismissed_version', this.currentVersion);
  }

  /**
   * Check if update was dismissed
   */
  public wasUpdateDismissed(version: string): boolean {
    const dismissed = localStorage.getItem('bauplan_dismissed_version');
    return dismissed === version;
  }
}

export default UpdateService;
export const updateService = UpdateService.getInstance();
