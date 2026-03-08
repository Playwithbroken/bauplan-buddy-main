import React from 'react';
import { useAppConfig } from '../contexts/AppConfigContext';

const SettingsStorage: React.FC = () => {
  const { config, setStorageMode } = useAppConfig();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Speicher-Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wählen Sie, ob Daten lokal auf diesem Gerät oder in der Cloud gespeichert werden.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="storageMode"
              value="local"
              checked={config.storageMode === 'local'}
              onChange={() => setStorageMode('local')}
            />
            <span>Lokale Speicherung</span>
          </label>
          <span className="text-xs text-muted-foreground">Nur dieses Gerät, schnelle Tests, kein automatisches Backup.</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="storageMode"
              value="cloud"
              checked={config.storageMode === 'cloud'}
              onChange={() => setStorageMode('cloud')}
            />
            <span>Cloud-Speicherung</span>
          </label>
          <span className="text-xs text-muted-foreground">Benötigt Backend/API. Offline ggf. nur Lesezugriff.</span>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold">Migration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional: Lokale Daten in die Cloud übertragen oder aus der Cloud exportieren. (Platzhalter)
        </p>
        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary opacity-60 cursor-not-allowed" title="Noch nicht implementiert">Lokale Daten → Cloud</button>
          <button className="btn btn-secondary opacity-60 cursor-not-allowed" title="Noch nicht implementiert">Cloud-Daten → Lokal</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsStorage;

