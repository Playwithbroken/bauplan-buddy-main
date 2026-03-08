import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth, LoginCredentials } from '@/hooks/useAuth';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const result = await login(data.email, data.password);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const rememberMe = watch('rememberMe');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Building className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bauplan Buddy</h1>
              <p className="text-sm text-gray-600">Construction Management</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Willkommen zurück</h2>
          <p className="text-gray-600">Melden Sie sich in Ihrem Konto an</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Anmelden</CardTitle>
            <CardDescription className="text-center">
              Geben Sie Ihre Anmeldedaten ein
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  autoComplete="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ihr Passwort"
                    autoComplete="current-password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500 focus:ring-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal">
                    Angemeldet bleiben
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Anmelden...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Noch kein Konto?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Jetzt registrieren
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Demo-Anmeldedaten
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-xs space-y-1">
              <div className="font-medium text-yellow-800">Administrator:</div>
              <div className="text-yellow-700">admin@bauplan-buddy.de / password123</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-medium text-yellow-800">Manager:</div>
              <div className="text-yellow-700">manager@bauplan-buddy.de / password123</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-medium text-yellow-800">Worker:</div>
              <div className="text-yellow-700">worker@bauplan-buddy.de / password123</div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2024 Bauplan Buddy. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;