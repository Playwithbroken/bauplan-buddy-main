import React, { useState, useEffect } from "react";
import {
  Dialog,
  DraggableDialogContent as DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/DraggableDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Star,
  StarOff,
  Copy,
  Edit,
  Trash2,
  Download,
  Upload,
  Package,
  Wrench,
  Briefcase,
  Truck,
  TrendingUp,
  Clock,
} from "lucide-react";

import {
  ItemTemplate,
  ItemTemplateCategory,
  itemTemplateService,
} from "@/services/itemTemplateService";

interface ItemTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate?: (template: ItemTemplate) => void;
  mode?: "select" | "manage"; // select = quick insert, manage = full management
}

const CATEGORY_ICONS: Record<ItemTemplateCategory, React.ReactNode> = {
  material: <Package className="h-4 w-4" />,
  labor: <Wrench className="h-4 w-4" />,
  service: <Briefcase className="h-4 w-4" />,
  equipment: <Truck className="h-4 w-4" />,
  custom: <Star className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<ItemTemplateCategory, string> = {
  material: "Material",
  labor: "Arbeit",
  service: "Dienstleistung",
  equipment: "Gerät/Maschine",
  custom: "Benutzerdefiniert",
};

export function ItemTemplateLibrary({
  open,
  onOpenChange,
  onSelectTemplate,
  mode = "select",
}: ItemTemplateLibraryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ItemTemplateCategory | "all"
  >("all");
  const [activeTab, setActiveTab] = useState("browse");
  const [editingTemplate, setEditingTemplate] = useState<ItemTemplate | null>(
    null
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadTemplates = () => {
    setTemplates(itemTemplateService.getAllTemplates());
  };

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchTerm === "" ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: ItemTemplate) => {
    itemTemplateService.recordUsage(template.id);
    onSelectTemplate?.(template);
    onOpenChange(false);
    toast({
      title: "Vorlage eingefügt",
      description: `"${template.name}" wurde hinzugefügt`,
    });
  };

  const handleToggleFavorite = (id: string) => {
    itemTemplateService.toggleFavorite(id);
    loadTemplates();
  };

  const handleDuplicate = (template: ItemTemplate) => {
    itemTemplateService.duplicateTemplate(template.id, "current-user");
    loadTemplates();
    toast({
      title: "Vorlage dupliziert",
      description: `"${template.name}" wurde kopiert`,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diese Vorlage wirklich löschen?")) {
      itemTemplateService.deleteTemplate(id);
      loadTemplates();
      toast({
        title: "Vorlage gelöscht",
      });
    }
  };

  const handleExport = () => {
    const json = itemTemplateService.exportTemplates();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `item-templates-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export erfolgreich",
      description: "Vorlagen wurden exportiert",
    });
  };

  const stats = itemTemplateService.getStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Positions-Vorlagen Bibliothek
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">
              <Search className="h-4 w-4 mr-2" />
              Durchsuchen
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-2" />
              Favoriten
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="h-4 w-4 mr-2" />
              Zuletzt verwendet
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="h-4 w-4 mr-2" />
              Statistiken
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="browse"
            className="flex-1 overflow-auto space-y-4"
          >
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Vorlagen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as any)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="labor">Arbeit</SelectItem>
                  <SelectItem value="service">Dienstleistung</SelectItem>
                  <SelectItem value="equipment">Gerät/Maschine</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
              {mode === "manage" && (
                <>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neu
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
            </div>

            {/* Templates Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Einheit</TableHead>
                      <TableHead className="text-right">Preis</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow
                        key={template.id}
                        className={
                          mode === "select"
                            ? "cursor-pointer hover:bg-accent"
                            : ""
                        }
                        onClick={() =>
                          mode === "select" && handleSelectTemplate(template)
                        }
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(template.id);
                            }}
                          >
                            {template.isFavorite ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.description}
                            </div>
                            {template.articleNumber && (
                              <div className="text-xs text-muted-foreground">
                                Art.-Nr.: {template.articleNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            {CATEGORY_ICONS[template.category]}
                            {CATEGORY_LABELS[template.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>{template.unit}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(template.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {mode === "select" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTemplate(template);
                                }}
                              >
                                Einfügen
                              </Button>
                            )}
                            {mode === "manage" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(template);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(template.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="flex-1 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Favoriten ({stats.favorites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.favorites.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Favoriten vorhanden
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.favorites.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() =>
                          mode === "select" && handleSelectTemplate(template)
                        }
                      >
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(template.unitPrice)} /{" "}
                            {template.unit}
                          </div>
                        </div>
                        {mode === "select" && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            Einfügen
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="flex-1 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  Zuletzt verwendet ({stats.recentlyUsed.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentlyUsed.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Noch keine Vorlagen verwendet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentlyUsed.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() =>
                          mode === "select" && handleSelectTemplate(template)
                        }
                      >
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(template.unitPrice)} /{" "}
                            {template.unit} • Verwendet: {template.usageCount}x
                          </div>
                        </div>
                        {mode === "select" && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            Einfügen
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Übersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Gesamt Vorlagen:</span>
                      <span className="font-bold">{stats.totalTemplates}</span>
                    </div>
                    {Object.entries(stats.byCategory).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {CATEGORY_LABELS[category as ItemTemplateCategory]}:
                          </span>
                          <span>{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meistgenutzt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.mostUsed.map((template, index) => (
                      <div
                        key={template.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {index + 1}. {template.name}
                        </span>
                        <span className="font-medium">
                          {template.usageCount}x
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
