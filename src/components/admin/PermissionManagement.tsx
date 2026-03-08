import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, Users, Settings, Plus, Edit, Trash2, 
  Save, X, Check, AlertTriangle, Clock, Key
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PermissionService, Permission, Role, UserPermissionOverride } from '@/services/permissionService';
import { useAuth } from '@/hooks/useAuth';

interface PermissionManagementProps {
  onPermissionChange?: () => void;
}

export function PermissionManagement({ onPermissionChange }: PermissionManagementProps) {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Check if user has permission to manage permissions
  const canManagePermissions = hasPermission('users.permissions') || hasPermission('*');
  const canManageRoles = hasPermission('users.write') || hasPermission('*');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPermissions(PermissionService.getAllPermissions());
    setRoles(PermissionService.getAllRoles());
  };

  const handleCreateRole = (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRole = PermissionService.createRole({
        ...roleData,
        createdBy: user?.id || 'unknown'
      });
      
      loadData();
      setIsCreateRoleOpen(false);
      
      toast({
        title: "Rolle erstellt",
        description: `Die Rolle "${newRole.name}" wurde erfolgreich erstellt.`,
      });
      
      onPermissionChange?.();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Rolle konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = (roleId: string, updates: Partial<Role>) => {
    try {
      const updatedRole = PermissionService.updateRole(roleId, updates);
      if (updatedRole) {
        loadData();
        setIsEditRoleOpen(false);
        setEditingRole(null);
        
        toast({
          title: "Rolle aktualisiert",
          description: `Die Rolle "${updatedRole.name}" wurde erfolgreich aktualisiert.`,
        });
        
        onPermissionChange?.();
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Rolle konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = (roleId: string) => {
    try {
      const success = PermissionService.deleteRole(roleId);
      if (success) {
        loadData();
        
        toast({
          title: "Rolle gelöscht",
          description: "Die Rolle wurde erfolgreich gelöscht.",
        });
        
        onPermissionChange?.();
      } else {
        toast({
          title: "Fehler",
          description: "System-Rollen können nicht gelöscht werden.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Rolle konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      system: 'bg-red-100 text-red-800',
      project: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      document: 'bg-purple-100 text-purple-800',
      calendar: 'bg-yellow-100 text-yellow-800',
      user: 'bg-orange-100 text-orange-800',
      report: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  if (!canManagePermissions && !canManageRoles) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="text-lg font-medium mb-2">Zugriff verweigert</div>
          <div className="text-muted-foreground">
            Sie haben nicht die erforderlichen Berechtigungen für die Benutzerverwaltung.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Berechtigungsverwaltung</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Rollen und Berechtigungen für Benutzer
          </p>
        </div>
        {canManageRoles && (
          <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Rolle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CreateRoleDialog
                permissions={permissions}
                onSave={handleCreateRole}
                onCancel={() => setIsCreateRoleOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Rollen</TabsTrigger>
          <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>
          <TabsTrigger value="users">Benutzer-Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {role.isSystemRole && (
                        <Badge variant="outline" className="text-xs">
                          System
                        </Badge>
                      )}
                      {role.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Standard
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Berechtigungen ({role.permissions.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission === '*' ? 'Alle' : permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {canManageRoles && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRole(role);
                          setIsEditRoleOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Bearbeiten
                      </Button>
                      {!role.isSystemRole && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Löschen
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsList permissions={permissions} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserOverridesList />
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-2xl">
          {editingRole && (
            <EditRoleDialog
              role={editingRole}
              permissions={permissions}
              onSave={(updates) => handleUpdateRole(editingRole.id, updates)}
              onCancel={() => {
                setIsEditRoleOpen(false);
                setEditingRole(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateRoleDialogProps {
  permissions: Permission[];
  onSave: (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function CreateRoleDialog({ permissions, onSave, onCancel }: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      permissions: selectedPermissions,
      isSystemRole: false,
      isDefault: false,
      createdBy: 'current-user'
    });
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Neue Rolle erstellen</DialogTitle>
        <DialogDescription>
          Erstellen Sie eine neue Rolle mit spezifischen Berechtigungen.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Rollen-Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            placeholder="Beschreibung der Rolle"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Berechtigungen</Label>
          <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-4">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-2">
                <div className="font-medium text-sm capitalize">{category}</div>
                {categoryPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, permission.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                        }
                      }}
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>
    </>
  );
}

interface EditRoleDialogProps {
  role: Role;
  permissions: Permission[];
  onSave: (updates: Partial<Role>) => void;
  onCancel: () => void;
}

function EditRoleDialog({ role, permissions, onSave, onCancel }: EditRoleDialogProps) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions);

  const handleSave = () => {
    onSave({
      name: name.trim(),
      description: description.trim(),
      permissions: selectedPermissions
    });
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rolle bearbeiten</DialogTitle>
        <DialogDescription>
          Bearbeiten Sie die Rolle "{role.name}" und ihre Berechtigungen.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Rollen-Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={role.isSystemRole}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            placeholder="Beschreibung der Rolle"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Berechtigungen</Label>
          <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-4">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-2">
                <div className="font-medium text-sm capitalize">{category}</div>
                {categoryPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, permission.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                        }
                      }}
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>
    </>
  );
}

function PermissionsList({ permissions }: { permissions: Permission[] }) {
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getCategoryColor = (category: string) => {
    const colors = {
      system: 'bg-red-100 text-red-800',
      project: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      document: 'bg-purple-100 text-purple-800',
      calendar: 'bg-yellow-100 text-yellow-800',
      user: 'bg-orange-100 text-orange-800',
      report: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className={getCategoryColor(category)}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({categoryPermissions.length} Berechtigungen)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categoryPermissions.map((permission) => (
                <div key={permission.id} className="border rounded-lg p-3">
                  <div className="font-medium text-sm">{permission.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {permission.description}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {permission.resource}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {permission.action}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserOverridesList() {
  // This would show user-specific permission overrides
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Benutzer-spezifische Berechtigungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="text-lg font-medium mb-2">Keine Overrides</div>
          <div className="text-muted-foreground">
            Derzeit sind keine benutzer-spezifischen Berechtigungsänderungen aktiv.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionManagement;