import React, { useState } from 'react';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Plus,
  Trash2,
  Shield,
  Key,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
  Lock
} from 'lucide-react';

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
  createdAt: string;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@bauplan.de',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLogin: '2025-10-31 14:30',
      createdAt: '2025-01-01'
    },
    {
      id: '2',
      name: 'Manager User',
      email: 'manager@bauplan.de',
      role: 'MANAGER',
      status: 'ACTIVE',
      lastLogin: '2025-10-30 09:15',
      createdAt: '2025-02-15'
    }
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'USER' as UserAccount['role'],
    password: ''
  });

  const getRoleBadge = (role: UserAccount['role']) => {
    const variants = {
      ADMIN: 'destructive',
      MANAGER: 'default',
      USER: 'secondary',
      GUEST: 'outline'
    };
    return variants[role] || 'secondary';
  };

  const getStatusBadge = (status: UserAccount['status']) => {
    if (status === 'ACTIVE') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'SUSPENDED') return <XCircle className="h-4 w-4 text-red-600" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: 'Fehlende Daten',
        description: 'Bitte füllen Sie alle Felder aus.',
        variant: 'destructive'
      });
      return;
    }

    const user: UserAccount = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'USER', password: '' });
    setShowAddUser(false);

    toast({
      title: 'Benutzer erstellt',
      description: `${user.name} wurde erfolgreich hinzugefügt.`
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: 'Benutzer gelöscht',
      description: 'Der Benutzer wurde entfernt.'
    });
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
        : u
    ));
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Benutzerverwaltung
            </span>
          }
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Benutzer</TabsTrigger>
              <TabsTrigger value="roles">Rollen & Rechte</TabsTrigger>
              <TabsTrigger value="security">Sicherheit</TabsTrigger>
            </TabsList>
          }
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
        >

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {users.length} Benutzer insgesamt
                </p>
              </div>
              <Button onClick={() => setShowAddUser(!showAddUser)}>
                <Plus className="h-4 w-4 mr-2" />
                Benutzer hinzufügen
              </Button>
            </div>

            {/* Add User Form */}
            {showAddUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Neuen Benutzer anlegen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-Mail</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="max@bauplan.de"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rolle</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserAccount['role'] })}
                      >
                        <option value="GUEST">Gast</option>
                        <option value="USER">Benutzer</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Passwort</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddUser}>
                      <Plus className="h-4 w-4 mr-2" />
                      Benutzer erstellen
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddUser(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users List */}
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            <Badge variant={getRoleBadge(user.role) as "destructive" | "default" | "secondary" | "outline"}>
                              {user.role}
                            </Badge>
                            {getStatusBadge(user.status)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.lastLogin && (
                            <div className="text-xs text-muted-foreground">
                              Letzter Login: {user.lastLogin}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Administrator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Vollständiger Zugriff auf alle Funktionen
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Benutzerverwaltung
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Systemeinstellungen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Alle Module
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Backup & Export
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Erweiterte Berechtigungen für Projektmanagement
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Projekte verwalten
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Angebote & Rechnungen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Dokumentvorlagen
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Systemeinstellungen
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Benutzer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Standard-Berechtigungen für Mitarbeiter
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Projekte ansehen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Dokumente erstellen
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Projekte löschen
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Einstellungen
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                    Gast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Eingeschränkter Lesezugriff
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Projekte ansehen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Dokumente ansehen
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Bearbeiten
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Löschen
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Passwort-Richtlinien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Minimale Länge</Label>
                    <Input type="number" defaultValue="8" className="w-24" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Großbuchstaben erforderlich</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Zahlen erforderlich</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Sonderzeichen erforderlich</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Passwort-Ablauf (Tage)</Label>
                    <Input type="number" defaultValue="90" className="w-24" />
                  </div>
                </div>
                <Button className="w-full">
                  Richtlinien speichern
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sitzungseinstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Auto-Logout nach Inaktivität (Min)</Label>
                    <Input type="number" defaultValue="30" className="w-24" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mehrfach-Login erlauben</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Zwei-Faktor-Authentifizierung</Label>
                    <Switch />
                  </div>
                </div>
                <Button className="w-full">
                  Einstellungen speichern
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
};

export default UserManagementDialog;
