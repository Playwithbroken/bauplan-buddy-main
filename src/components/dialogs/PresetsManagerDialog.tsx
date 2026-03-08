import React, { useState, useEffect } from 'react';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { PresetService, type ProductPreset, type WagePreset, type TravelCostPreset, type ServicePreset } from '@/services/presetService';
import { useToast } from '@/hooks/use-toast';

interface PresetsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PresetsManagerDialog({ open, onOpenChange }: PresetsManagerDialogProps) {
  const { toast } = useToast();
  
  // State for all preset types
  const [services, setServices] = useState<ServicePreset[]>([]);
  const [travelCosts, setTravelCosts] = useState<TravelCostPreset[]>([]);
  const [wages, setWages] = useState<WagePreset[]>([]);
  const [products, setProducts] = useState<ProductPreset[]>([]);
  
  // Edit states
  const [editingService, setEditingService] = useState<ServicePreset | null>(null);
  const [editingTravel, setEditingTravel] = useState<TravelCostPreset | null>(null);
  const [editingWage, setEditingWage] = useState<WagePreset | null>(null);
  
  // New preset states
  const [showNewService, setShowNewService] = useState(false);
  const [showNewTravel, setShowNewTravel] = useState(false);
  const [showNewWage, setShowNewWage] = useState(false);

  useEffect(() => {
    if (open) {
      loadPresets();
    }
  }, [open]);

  const loadPresets = () => {
    setServices(PresetService.listServicePresets());
    setTravelCosts(PresetService.listTravelCostPresets());
    setWages(PresetService.listWagePresets());
    setProducts(PresetService.listProductPresets());
  };

  // Services Tab
  const handleCreateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const preset = PresetService.createServicePreset({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      defaultPrice: parseFloat(formData.get('defaultPrice') as string) || 0,
      unit: formData.get('unit') as 'hour' | 'day' | 'piece' | 'sqm',
      estimatedDuration: parseFloat(formData.get('estimatedDuration') as string) || undefined,
    });

    setServices([preset, ...services]);
    setShowNewService(false);
    toast({ title: 'Vorlage erstellt', description: `${preset.name} wurde hinzugefügt.` });
  };

  const handleUpdateService = (id: string) => {
    if (!editingService) return;
    
    const updated = PresetService.updateServicePreset(id, editingService);
    if (updated) {
      setServices(services.map(s => s.id === id ? updated : s));
      setEditingService(null);
      toast({ title: 'Vorlage aktualisiert' });
    }
  };

  const handleDeleteService = (id: string) => {
    PresetService.removeServicePreset(id);
    setServices(services.filter(s => s.id !== id));
    toast({ title: 'Vorlage gelöscht' });
  };

  // Travel Costs Tab
  const handleCreateTravel = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as 'km' | 'flat' | 'parking' | 'toll';
    
    const preset = PresetService.createTravelCostPreset({
      name: formData.get('name') as string,
      type,
      description: formData.get('description') as string,
      pricePerUnit: type === 'km' ? parseFloat(formData.get('price') as string) : undefined,
      flatAmount: type !== 'km' ? parseFloat(formData.get('price') as string) : undefined,
    });

    setTravelCosts([preset, ...travelCosts]);
    setShowNewTravel(false);
    toast({ title: 'Fahrtkosten-Vorlage erstellt' });
  };

  const handleDeleteTravel = (id: string) => {
    PresetService.removeTravelCostPreset(id);
    setTravelCosts(travelCosts.filter(t => t.id !== id));
    toast({ title: 'Vorlage gelöscht' });
  };

  // Wages Tab
  const handleCreateWage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const preset = PresetService.createWagePreset({
      role: formData.get('role') as string,
      hourlyRate: parseFloat(formData.get('hourlyRate') as string),
      department: formData.get('department') as string,
    });

    setWages([preset, ...wages]);
    setShowNewWage(false);
    toast({ title: 'Lohn-Vorlage erstellt' });
  };

  const handleDeleteWage = (id: string) => {
    PresetService.removeWagePreset(id);
    setWages(wages.filter(w => w.id !== id));
    toast({ title: 'Vorlage gelöscht' });
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <Tabs defaultValue="services" className="flex-1 overflow-hidden">
        <DialogFrame
          title="Vorlagen verwalten"
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">Leistungen</TabsTrigger>
              <TabsTrigger value="travel">Fahrtkosten</TabsTrigger>
              <TabsTrigger value="wages">Stundenlöhne</TabsTrigger>
            </TabsList>
          }
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
        >

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Häufig verwendete Leistungen und Services
              </p>
              <Button onClick={() => setShowNewService(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Neue Leistung
              </Button>
            </div>

            {showNewService && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Neue Leistung</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateService} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Bezeichnung</Label>
                        <Input id="name" name="name" placeholder="z.B. Maurerarbeiten" required />
                      </div>
                      <div>
                        <Label htmlFor="category">Kategorie</Label>
                        <Select name="category" defaultValue="construction">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="construction">Bauarbeiten</SelectItem>
                            <SelectItem value="installation">Installation</SelectItem>
                            <SelectItem value="repair">Reparatur</SelectItem>
                            <SelectItem value="planning">Planung</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="defaultPrice">Preis (€)</Label>
                        <Input id="defaultPrice" name="defaultPrice" type="number" step="0.01" placeholder="65.00" />
                      </div>
                      <div>
                        <Label htmlFor="unit">Einheit</Label>
                        <Select name="unit" defaultValue="hour">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hour">Stunde</SelectItem>
                            <SelectItem value="day">Tag</SelectItem>
                            <SelectItem value="piece">Stück</SelectItem>
                            <SelectItem value="sqm">m²</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="estimatedDuration">Dauer (h)</Label>
                        <Input id="estimatedDuration" name="estimatedDuration" type="number" step="0.5" placeholder="8" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Beschreibung</Label>
                      <Input id="description" name="description" placeholder="Optional" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Speichern</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewService(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{service.name}</h4>
                        <span className="text-xs px-2 py-1 bg-secondary rounded">{service.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.defaultPrice?.toFixed(2)} € / {service.unit} • {service.estimatedDuration}h
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Travel Costs Tab */}
          <TabsContent value="travel" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Fahrtkosten und Anfahrtspauschalen
              </p>
              <Button onClick={() => setShowNewTravel(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Neue Fahrtkosten
              </Button>
            </div>

            {showNewTravel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Neue Fahrtkosten-Vorlage</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTravel} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="travel-name">Bezeichnung</Label>
                        <Input id="travel-name" name="name" placeholder="z.B. Fahrtkosten PKW" required />
                      </div>
                      <div>
                        <Label htmlFor="travel-type">Typ</Label>
                        <Select name="type" defaultValue="km">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="km">Pro Kilometer</SelectItem>
                            <SelectItem value="flat">Pauschale</SelectItem>
                            <SelectItem value="parking">Parkgebühr</SelectItem>
                            <SelectItem value="toll">Maut</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="travel-price">Preis (€)</Label>
                      <Input id="travel-price" name="price" type="number" step="0.01" placeholder="0.30" required />
                    </div>
                    <div>
                      <Label htmlFor="travel-description">Beschreibung</Label>
                      <Input id="travel-description" name="description" placeholder="Optional" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Speichern</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewTravel(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {travelCosts.map((travel) => (
                <Card key={travel.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{travel.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {travel.type === 'km' ? `${travel.pricePerUnit?.toFixed(2)} € / km` : `${travel.flatAmount?.toFixed(2)} € Pauschale`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTravel(travel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wages Tab */}
          <TabsContent value="wages" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Stundenlöhne für verschiedene Tätigkeiten
              </p>
              <Button onClick={() => setShowNewWage(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Stundenlohn
              </Button>
            </div>

            {showNewWage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Neuer Stundenlohn</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateWage} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="wage-role">Tätigkeit/Rolle</Label>
                        <Input id="wage-role" name="role" placeholder="z.B. Geselle" required />
                      </div>
                      <div>
                        <Label htmlFor="wage-rate">Stundensatz (€)</Label>
                        <Input id="wage-rate" name="hourlyRate" type="number" step="0.01" placeholder="35.00" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="wage-department">Abteilung</Label>
                      <Input id="wage-department" name="department" placeholder="Optional" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Speichern</Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewWage(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {wages.map((wage) => (
                <Card key={wage.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{wage.role}</h4>
                      <p className="text-sm text-muted-foreground">
                        {wage.hourlyRate.toFixed(2)} € / Stunde
                        {wage.department && ` • ${wage.department}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteWage(wage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
}
