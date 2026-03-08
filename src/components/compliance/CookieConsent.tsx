import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true, // Always true, required for site operation
  analytics: false,
  marketing: false,
};

const STORAGE_KEY = 'cookie-consent-preferences';

export const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      setPreferences(JSON.parse(stored));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const minimalPreferences: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    savePreferences(minimalPreferences);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: ConsentPreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);

    // Dispatch custom event for tracking
    window.dispatchEvent(
      new CustomEvent('consent-preferences-updated', { detail: prefs })
    );

    // Load analytics if accepted
    if (prefs.analytics) {
      loadAnalytics();
    }
  };

  const loadAnalytics = () => {
    // Load Google Analytics or similar
    // Placeholder for actual implementation
    console.log('Loading analytics...');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1">We respect your privacy</h3>
              <p className="text-xs text-gray-600">
                We use cookies to enhance your experience. Some are necessary for site functionality,
                while others help us analyze usage and show relevant content.{' '}
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Learn more
                </button>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleRejectAll}>
                Reject
              </Button>
              <Button size="sm" onClick={handleAcceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cookie Preferences</h2>
              <button onClick={() => setShowDetails(false)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="border rounded p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="necessary"
                    checked={preferences.necessary}
                    disabled
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="necessary" className="font-medium">
                      Necessary Cookies
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Essential for site functionality. Cannot be disabled. (Session management, security)
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border rounded p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="analytics" className="font-medium">
                      Analytics Cookies
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Help us understand how you use our service. (Google Analytics, etc.)
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border rounded p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="marketing" className="font-medium">
                      Marketing Cookies
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Used to display relevant ads and track campaign effectiveness.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleRejectAll}>
                Reject All
              </Button>
              <Button size="sm" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
