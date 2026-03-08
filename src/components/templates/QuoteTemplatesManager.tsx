import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Home,
  Building,
  Wrench,
  Construction,
  Search,
  Star,
  Clock,
  Euro,
  Eye,
  Copy,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  FileText,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import QuoteTemplatesService, { QuoteTemplate, TemplateCategory } from '../../services/quoteTemplatesService';
import { QuotePosition } from '../forms/EnhancedQuoteCreation';
import { useToast } from '../../hooks/use-toast';

interface QuoteTemplatesManagerProps {
  onTemplateSelect?: (template: QuoteTemplate) => void;
  onTemplateApply?: (positions: QuotePosition[], estimatedTotal: number) => void;
  mode?: 'browse' | 'select' | 'manage';
  selectedCategory?: string;
}

interface TemplatePreviewDialogProps {
  template: QuoteTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  template,
  open,
  onOpenChange,
  onApply,
  onEdit,
  showActions = true
}) => {
  if (!template) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential': return <Home className="h-4 w-4" />;
      case 'commercial': return <Building className="h-4 w-4" />;
      case 'renovation': return <Wrench className="h-4 w-4" />;
      case 'infrastructure': return <Construction className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCategoryIcon(template.category)}
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">€{template.estimatedTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Geschätzte Summe</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{template.estimatedDuration}</p>
                    <p className="text-xs text-muted-foreground">Tage geschätzt</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{template.usageCount}</p>
                    <p className="text-xs text-muted-foreground">Mal verwendet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Positions */}
          <Card>
            <CardHeader>
              <CardTitle>Positionen ({template.positions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.positions.map((position, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{position.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {position.quantity} {position.unit} × €{position.unitPrice.toLocaleString()} = €{position.total.toLocaleString()}
                        </p>
                        {position.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{position.notes}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {position.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {showActions && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            )}
            {onApply && (
              <Button onClick={onApply}>
                <Copy className="h-4 w-4 mr-2" />
                Vorlage verwenden
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const QuoteTemplatesManager: React.FC<QuoteTemplatesManagerProps> = ({
  onTemplateSelect,
  onTemplateApply,
  mode = 'browse',
  selectedCategory
}) => {
  const { toast } = useToast();
  const templatesService = React.useMemo(() => QuoteTemplatesService.getInstance(), []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const categories = templatesService.getCategories();
  const allTemplates = templatesService.getAllTemplates();
  const stats = templatesService.getTemplateStats();

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = allTemplates;

    if (searchTerm) {
      filtered = templatesService.searchTemplates(searchTerm);
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter(template => template.category === activeCategory);
    }

    return filtered;
  }, [allTemplates, searchTerm, activeCategory, templatesService]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential': return <Home className="h-5 w-5" />;
      case 'commercial': return <Building className="h-5 w-5" />;
      case 'renovation': return <Wrench className="h-5 w-5" />;
      case 'infrastructure': return <Construction className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'gray';
  };

  const handleTemplatePreview = (template: QuoteTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleTemplateApply = (template: QuoteTemplate) => {
    const result = templatesService.applyTemplateToQuote(template.id);
    if (result && onTemplateApply) {
      onTemplateApply(result.positions, result.estimatedTotal);
      toast({
        title: "Vorlage angewendet",
        description: `${template.name} wurde erfolgreich angewendet`,
      });
    }
    setShowPreview(false);
  };

  const TemplateCard: React.FC<{ template: QuoteTemplate }> = ({ template }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(template.category)}
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={`bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-700`}
          >
            {categories.find(c => c.id === template.category)?.name}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="font-semibold text-lg">€{template.estimatedTotal.toLocaleString()}</p>
            <p className="text-muted-foreground">Geschätzt</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">{template.estimatedDuration}d</p>
            <p className="text-muted-foreground">Dauer</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">{template.positions.length}</p>
            <p className="text-muted-foreground">Positionen</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Star className="h-3 w-3 mr-1" />
            {template.usageCount}x verwendet
          </div>
          
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleTemplatePreview(template);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {mode === 'select' && onTemplateApply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateApply(template);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Angebotsvorlagen</h3>
          <p className="text-muted-foreground">
            Vordefinierte Vorlagen für häufige Bauprojekte
          </p>
        </div>
        
        {mode === 'manage' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Vorlage
          </Button>
        )}
      </div>

      {/* Stats */}
      {mode !== 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                  <p className="text-xs text-muted-foreground">Vorlagen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsage}</p>
                  <p className="text-xs text-muted-foreground">Verwendungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.averageUsage)}</p>
                  <p className="text-xs text-muted-foreground">Ø Verwendung</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    €{Math.round(allTemplates.reduce((sum, t) => sum + t.estimatedTotal, 0) / allTemplates.length / 1000)}k
                  </p>
                  <p className="text-xs text-muted-foreground">Ø Wert</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Vorlagen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
      }>
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Keine Vorlagen gefunden</p>
            <p className="text-muted-foreground">
              {searchTerm ? 'Versuchen Sie andere Suchbegriffe' : 'Erstellen Sie Ihre erste Vorlage'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={showPreview}
        onOpenChange={setShowPreview}
        onApply={() => previewTemplate && handleTemplateApply(previewTemplate)}
        showActions={mode === 'select'}
      />
    </div>
  );
};

export default QuoteTemplatesManager;

