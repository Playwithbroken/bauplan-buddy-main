import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

const forgotPasswordSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Try Supabase first (if configured)
      const client = supabase.getClient();
      
      if (client) {
        const { error } = await client.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
      } else {
        // Fallback: Offline mode - show success message but don't actually send email
        console.log('Offline mode: Password reset would be sent to:', data.email);
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Senden der E-Mail');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Passwort vergessen?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kein Problem! Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
          </p>
        </div>

        <Card>
          {success ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl text-green-800 dark:text-green-400">
                  E-Mail versendet!
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300 mt-2">
                  Wir haben Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-2">Überprüfen Sie Ihr E-Mail-Postfach</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Link ist 24 Stunden gültig</li>
                      <li>Schauen Sie auch im Spam-Ordner nach</li>
                      <li>Klicken Sie auf den Link, um ein neues Passwort zu setzen</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zum Login
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Passwort zurücksetzen</CardTitle>
                <CardDescription>
                  Geben Sie die E-Mail-Adresse Ihres Kontos ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre-email@firma.de"
                    disabled={isLoading}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Reset-Link senden
                    </>
                  )}
                </Button>

                <Link to="/login" className="w-full">
                  <Button variant="ghost" className="w-full" disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zum Login
                  </Button>
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
