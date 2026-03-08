
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, LogIn, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('LoginPage: Form submission started with data:', {
      email: data.email,
      passwordLength: data.password.length
    });

    setIsLoading(true);
    setError(null);

    try {
      console.log('LoginPage: Calling login function...');
      await login(data.email, data.password);

      console.log('LoginPage: Login successful, navigating to:', from);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('LoginPage: Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { email: 'admin@bauplan.de', password: 'admin123', role: 'Admin' },
    { email: 'manager@bauplan.de', password: 'manager123', role: 'Manager' },
    { email: 'user@bauplan.de', password: 'user123', role: 'User' },
    { email: 'client@bauplan.de', password: 'client123', role: 'Client' }
  ];

  const fillDemoCredentials = (email: string, password: string) => {
    console.log('LoginPage: Filling demo credentials:', email);
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    console.log('LoginPage: Demo credentials filled successfully');
  };

  const quickLogin = async (email: string, password: string) => {
    console.log('LoginPage: Quick login started for:', email);
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      console.log('LoginPage: Quick login successful, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('LoginPage: Quick login error:', err);
      setError(err instanceof Error ? err.message : 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center">
                <Building2 className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BauPlan Buddy</h1>
              <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
            </div>

            <Card>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl">Login</CardTitle>
                  <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 underline">
                      Forgot password?
                    </Link>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-800 underline">
                      Sign up
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Demo Accounts</CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-300">
                  Tap a role to auto-fill credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {demoCredentials.map((cred) => (
                    <Button
                      key={cred.role}
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials(cred.email, cred.password)}
                      className="justify-start text-xs"
                      disabled={isLoading}
                    >
                      {cred.role}
                    </Button>
                  ))}
                </div>

                <Separator />

                <Button
                  onClick={() => quickLogin('admin@bauplan.de', 'admin123')}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Logging in...' : 'Quick Login to Dashboard (Admin)'}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:hidden">
              <div className="rounded-2xl border bg-muted/50 p-6 text-center">
                <h2 className="text-lg font-semibold">Baustellen-Insights</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Behalten Sie Fortschritt, Budgets und Termine auch unterwegs im Blick.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:flex lg:w-1/2">
          <div className="absolute inset-0">
            <div className="h-full w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)]" />
          </div>
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-white">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white/90">
                <Sparkles className="h-4 w-4" /> BauPlan Buddy Insights
              </span>
              <h2 className="text-4xl font-semibold leading-tight">Digitale Bauleitung auf einen Blick.</h2>
              <p className="max-w-sm text-base text-white/80">
                Koordinieren Sie Projekte, Teams und Budgets in Echtzeit. Unsere Plattform bringt alle Beteiligten an einen Tisch.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-wide text-white/70">Heute auf Ihrer Agenda</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">08:30</span>
                  Baustellen-Check-in Projekt Suedtor
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">11:00</span>
                  Lieferantengespraech Stahlkonstruktion
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">15:15</span>
                  Freigabe Finanzbericht Q2
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
