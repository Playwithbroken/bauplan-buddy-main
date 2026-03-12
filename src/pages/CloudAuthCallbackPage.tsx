import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CloudAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const stateParam = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Provider returned an error: ${error}`);
        }

        if (!code || !stateParam) {
          throw new Error('Invalid callback parameters. Es fehlen Code oder Token.');
        }

        // Verify state
        const savedState = localStorage.getItem('cloud_auth_state');
        if (!savedState || savedState !== stateParam) {
          throw new Error('Security validation failed: State mismatch');
        }

        const stateData = JSON.parse(atob(stateParam));
        const provider = stateData.provider;

        // In a real production app we would send the authorization `code` 
        // to our SUPABASE EDGE FUNCTION to exchange it for an access token and refresh token 
        // securely, without exposing our client secret in the browser.
        
        // As a placeholder for Phase 3 prototype, we simulate a successful connection
        // and update the Supabase 'user_settings' table
        
        const client = supabase.getClient();
        if (client) {
          const { data: { user } } = await client.auth.getUser();
          if (user) {
            await client.from('user_settings').upsert({
              user_id: user.id,
              [`${provider}_connected`]: true,
              // [`${provider}_refresh_token`]: 'mock_token_would_be_saved_here'
            });
            
            // Set simple local storage flag for fast UI updates
            localStorage.setItem(`cloud_token_${provider}`, 'mock_access_token');
            setStatus('success');
          } else {
             // Let it simulate success for the demo even if they are offline
             localStorage.setItem(`cloud_token_${provider}`, 'mock_access_token_offline');
             setStatus('success');
          }
        } else {
           // Fallback for purely local demo mode
           localStorage.setItem(`cloud_token_${provider}`, 'mock_access_token_offline');
           setStatus('success');
        }

        // Clean up state
        localStorage.removeItem('cloud_auth_state');

      } catch (err: any) {
        console.error('OAuth callback failed:', err);
        setErrorMessage(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-lg border border-border text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Verbindung wird hergestellt...</h2>
            <p className="text-muted-foreground">Bitte warten Sie, während wir Ihre Cloud-Verbindung sichern.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Erfolgreich Verbunden</h2>
            <p className="text-muted-foreground mb-6">Ihre Cloud-Speicher-Anbindung wurde erfolgreich eingerichtet.</p>
            <Button onClick={() => navigate('/settings/storage')} className="w-full">
              Zurück zu den Einstellungen
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Verbindung Fehlgeschlagen</h2>
            <p className="text-destructive mb-6">{errorMessage}</p>
            <Button onClick={() => navigate('/settings/storage')} variant="outline" className="w-full">
              Diesen Vorgang Abbrechen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CloudAuthCallbackPage;
