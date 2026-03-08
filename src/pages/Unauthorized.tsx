import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Zugriff verweigert
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sie haben nicht die erforderlichen Berechtigungen, um auf diese Seite zuzugreifen.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Info */}
            {user && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Ihre Kontoinformationen:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {user.name}</p>
                  <p><span className="font-medium">E-Mail:</span> {user.email}</p>
                  <p><span className="font-medium">Rolle:</span> {user.role}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Was ist passiert?</h4>
              <p className="text-sm text-red-700">
                Die angeforderte Seite erfordert höhere Berechtigungen als Ihr Konto derzeit besitzt. 
                Wenden Sie sich an Ihren Administrator, um Zugriff zu erhalten.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur vorherigen Seite
              </Button>

              <Button
                asChild
                className="w-full"
              >
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Zum Dashboard
                </Link>
              </Button>

              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                Abmelden und neu anmelden
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
              <p>
                Benötigen Sie Hilfe? Kontaktieren Sie Ihren Administrator oder 
                <Link to="/support" className="text-blue-600 hover:underline ml-1">
                  den Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permission Explanation */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Berechtigungssystem</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">Admin:</span> Vollzugriff auf alle Funktionen</p>
              <p><span className="font-medium">Manager:</span> Projekt- und Kalender-Management</p>
              <p><span className="font-medium">Worker:</span> Kalender und Projektansicht</p>
              <p><span className="font-medium">Client:</span> Begrenzte Projekt-Ansicht</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage;