import React, { useState, useCallback } from "react";
import {
  MultiWindowDialog,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Filter,
  Save,
  Trash2,
  Copy,
  Settings,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import {
  FilterDefinition,
  FilterCondition,
  FilterGroup,
  FilterField,
  FilterOperator,
  LogicalOperator,
  FilterValidationResult,
  FILTER_FIELD_METADATA,
  FILTER_OPERATORS_BY_TYPE,
} from "@/types/filtering";
import { FilterService } from "@/services/filterService";

interface AdvancedFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filter: FilterDefinition) => void;
  editingFilter?: FilterDefinition;
  title?: string;
}

const AdvancedFilterDialog: React.FC<AdvancedFilterDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFilter,
  title = "Erweiterten Filter erstellen",
}) => {
  const [filter, setFilter] = useState<FilterDefinition>(() => {
    if (editingFilter) {
      return { ...editingFilter };
    }

    return {
      id: "",
      name: "",
      description: "",
      isActive: true,
      group: {
        id: "root",
        operator: "AND",
        conditions: [],
        groups: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [validation, setValidation] = useState<FilterValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate unique IDs
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Update filter validation
  const updateValidation = useCallback((currentFilter: FilterDefinition) => {
    const result = FilterService.validateFilter(currentFilter);
    setValidation(result);
  }, []);

  // Update filter and revalidate
  const updateFilter = useCallback(
    (updates: Partial<FilterDefinition>) => {
      const updatedFilter = {
        ...filter,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setFilter(updatedFilter);
      updateValidation(updatedFilter);
    },
    [filter, updateValidation]
  );

  // Add new condition to a group
  const addCondition = useCallback(
    (groupId: string) => {
      const newCondition: FilterCondition = {
        id: generateId(),
        field: "title",
        operator: "contains",
        value: "",
      };

      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: [...group.conditions, newCondition],
          };
        }
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      };

      updateFilter({
        group: updateGroup(filter.group),
      });
    },
    [filter.group, generateId, updateFilter]
  );

  // Remove condition from a group
  const removeCondition = useCallback(
    (groupId: string, conditionId: string) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.filter((c) => c.id !== conditionId),
          };
        }
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      };

      updateFilter({
        group: updateGroup(filter.group),
      });
    },
    [filter.group, updateFilter]
  );

  // Update condition
  const updateCondition = useCallback(
    (
      groupId: string,
      conditionId: string,
      updates: Partial<FilterCondition>
    ) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.map((c) =>
              c.id === conditionId ? { ...c, ...updates } : c
            ),
          };
        }
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      };

      updateFilter({
        group: updateGroup(filter.group),
      });
    },
    [filter.group, updateFilter]
  );

  // Add new group
  const addGroup = useCallback(
    (parentGroupId: string) => {
      const newGroup: FilterGroup = {
        id: generateId(),
        operator: "AND",
        conditions: [],
        groups: [],
      };

      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === parentGroupId) {
          return {
            ...group,
            groups: [...group.groups, newGroup],
          };
        }
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      };

      updateFilter({
        group: updateGroup(filter.group),
      });
    },
    [filter.group, generateId, updateFilter]
  );

  // Remove group
  const removeGroup = useCallback(
    (parentGroupId: string, groupId: string) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === parentGroupId) {
          return {
            ...group,
            groups: group.groups.filter((g) => g.id !== groupId),
          };
        }
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      };

      updateFilter({
        group: updateGroup(filter.group),
      });
    },
    [filter.group, updateFilter]
  );

  // Update group operator
  const updateGroupOperator = useCallback(
    (groupId: string, operator: LogicalOperator) => {
      const updateGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return { ...group, operator };
        }
        return {
          ...group,
          groups: group.groups.map(updateGroup),
        };
      };

      updateFilter({
        group: updateGroup(filter.group),
      });
    },
    [filter.group, updateFilter]
  );

  // Get available operators for a field
  const getOperatorsForField = useCallback(
    (field: FilterField): FilterOperator[] => {
      const fieldMetadata = FILTER_FIELD_METADATA[field];
      return fieldMetadata ? fieldMetadata.operators : [];
    },
    []
  );

  // Render condition input based on operator
  const renderConditionInput = useCallback(
    (condition: FilterCondition, groupId: string) => {
      const fieldMetadata = FILTER_FIELD_METADATA[condition.field];

      if (["is_empty", "is_not_empty"].includes(condition.operator)) {
        return null; // No input needed for these operators
      }

      if (condition.operator === "between") {
        return (
          <div className="flex gap-2">
            <Input
              placeholder="Von"
              value={
                Array.isArray(condition.value) ? condition.value[0] || "" : ""
              }
              onChange={(e) => {
                const currentValue = Array.isArray(condition.value)
                  ? condition.value
                  : ["", ""];
                updateCondition(groupId, condition.id, {
                  value: [e.target.value, currentValue[1] || ""],
                });
              }}
              className="flex-1"
            />
            <Input
              placeholder="Bis"
              value={
                Array.isArray(condition.value) ? condition.value[1] || "" : ""
              }
              onChange={(e) => {
                const currentValue = Array.isArray(condition.value)
                  ? condition.value
                  : ["", ""];
                updateCondition(groupId, condition.id, {
                  value: [currentValue[0] || "", e.target.value],
                });
              }}
              className="flex-1"
            />
          </div>
        );
      }

      if (
        ["in", "not_in"].includes(condition.operator) ||
        fieldMetadata?.type === "multi_select"
      ) {
        return (
          <Input
            placeholder="Werte (kommagetrennt)"
            value={
              Array.isArray(condition.value)
                ? condition.value.join(", ")
                : String(condition.value || "")
            }
            onChange={(e) => {
              const values = e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v);
              updateCondition(groupId, condition.id, { value: values });
            }}
          />
        );
      }

      if (fieldMetadata?.options) {
        return (
          <Select
            value={String(condition.value || "")}
            onValueChange={(value) =>
              updateCondition(groupId, condition.id, { value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Option wählen" />
            </SelectTrigger>
            <SelectContent>
              {fieldMetadata.options.map((option) => (
                <SelectItem
                  key={String(option.value)}
                  value={String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      if (fieldMetadata?.type === "boolean") {
        return (
          <Select
            value={condition.value?.toString() || ""}
            onValueChange={(value) =>
              updateCondition(groupId, condition.id, {
                value: value === "true",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Wert wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Ja</SelectItem>
              <SelectItem value="false">Nein</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      if (fieldMetadata?.type === "date") {
        return (
          <Input
            type="date"
            value={String(condition.value || "")}
            onChange={(e) =>
              updateCondition(groupId, condition.id, { value: e.target.value })
            }
          />
        );
      }

      if (fieldMetadata?.type === "time") {
        return (
          <Input
            type="time"
            value={String(condition.value || "")}
            onChange={(e) =>
              updateCondition(groupId, condition.id, { value: e.target.value })
            }
          />
        );
      }

      return (
        <Input
          placeholder={fieldMetadata?.placeholder || "Wert eingeben"}
          value={String(condition.value || "")}
          onChange={(e) =>
            updateCondition(groupId, condition.id, { value: e.target.value })
          }
        />
      );
    },
    [updateCondition]
  );

  // Render a condition row
  const renderCondition = useCallback(
    (condition: FilterCondition, groupId: string, index: number) => {
      const fieldMetadata = FILTER_FIELD_METADATA[condition.field];
      const availableOperators = getOperatorsForField(condition.field);

      return (
        <div
          key={condition.id}
          className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Field Selection */}
            <div>
              <Label className="text-xs text-gray-500">Feld</Label>
              <Select
                value={condition.field}
                onValueChange={(field: FilterField) => {
                  const newOperators = getOperatorsForField(field);
                  const newOperator = newOperators.includes(condition.operator)
                    ? condition.operator
                    : newOperators[0];
                  updateCondition(groupId, condition.id, {
                    field,
                    operator: newOperator,
                    value: "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILTER_FIELD_METADATA).map(
                    ([key, metadata]) => (
                      <SelectItem key={key} value={key}>
                        {metadata.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Operator Selection */}
            <div>
              <Label className="text-xs text-gray-500">Operator</Label>
              <Select
                value={condition.operator}
                onValueChange={(operator: FilterOperator) => {
                  updateCondition(groupId, condition.id, {
                    operator,
                    value: "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {getOperatorLabel(op)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            <div>
              <Label className="text-xs text-gray-500">Wert</Label>
              {renderConditionInput(condition, groupId)}
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCondition(groupId, condition.id)}
            className="mt-6"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    [
      getOperatorsForField,
      renderConditionInput,
      updateCondition,
      removeCondition,
    ]
  );

  // Render a filter group
  const renderGroup = useCallback(
    (
      group: FilterGroup,
      parentGroupId?: string,
      depth = 0
    ): React.ReactNode => {
      const isRootGroup = depth === 0;

      return (
        <Card
          key={group.id}
          className={`${depth > 0 ? "ml-4 border-l-4 border-blue-200" : ""}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">
                  {isRootGroup ? "Haupt-Filter" : "Gruppe"}
                </span>
                {!isRootGroup && (
                  <Badge variant="outline">{group.operator}</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Operator Selection */}
                <Select
                  value={group.operator}
                  onValueChange={(operator: LogicalOperator) =>
                    updateGroupOperator(group.id, operator)
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">UND</SelectItem>
                    <SelectItem value="OR">ODER</SelectItem>
                  </SelectContent>
                </Select>

                {!isRootGroup && parentGroupId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(parentGroupId, group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Conditions */}
            {group.conditions.map((condition, index) =>
              renderCondition(condition, group.id, index)
            )}

            {/* Nested Groups */}
            {group.groups.map((nestedGroup) =>
              renderGroup(nestedGroup, group.id, depth + 1)
            )}

            {/* Add Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addCondition(group.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Bedingung hinzufügen
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => addGroup(group.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Gruppe hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    },
    [renderCondition, updateGroupOperator, removeGroup, addCondition, addGroup]
  );

  // Get operator label in German
  const getOperatorLabel = (operator: FilterOperator): string => {
    const labels: Record<FilterOperator, string> = {
      equals: "ist gleich",
      not_equals: "ist nicht gleich",
      contains: "enthält",
      not_contains: "enthält nicht",
      starts_with: "beginnt mit",
      ends_with: "endet mit",
      greater_than: "größer als",
      less_than: "kleiner als",
      greater_than_equal: "größer oder gleich",
      less_than_equal: "kleiner oder gleich",
      between: "zwischen",
      in: "ist in",
      not_in: "ist nicht in",
      is_empty: "ist leer",
      is_not_empty: "ist nicht leer",
      date_equals: "Datum ist gleich",
      date_before: "Datum ist vor",
      date_after: "Datum ist nach",
      date_between: "Datum zwischen",
      date_in_last: "in den letzten",
      date_in_next: "in den nächsten",
    };
    return labels[operator] || operator;
  };

  // Handle save
  const handleSave = () => {
    if (!validation.isValid) {
      return;
    }

    const finalFilter: FilterDefinition = {
      ...filter,
      id: filter.id || generateId(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalFilter);
    onClose();
  };

  // Reset form
  const handleClose = () => {
    setFilter({
      id: "",
      name: "",
      description: "",
      isActive: true,
      group: {
        id: "root",
        operator: "AND",
        conditions: [],
        groups: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setValidation({ isValid: true, errors: [], warnings: [] });
    onClose();
  };

  return (
    <MultiWindowDialog open={isOpen} onOpenChange={handleClose}>
      <DialogFrame
        defaultFullscreen
        showFullscreenToggle
        modal={false}
        onClose={handleClose}
        title={
          <span className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {title}
          </span>
        }
        description={
          <DialogDescription>
            Erstellen Sie komplexe Filter mit mehreren Bedingungen und
            Gruppierungen.
          </DialogDescription>
        }
        footer={
          <div className="flex-shrink-0">
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!validation.isValid || !filter.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Filter speichern
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Basic Filter Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter-Name *</Label>
              <Input
                id="filter-name"
                placeholder="z.B. Hochpriorisierte Termine diese Woche"
                value={filter.name}
                onChange={(e) => updateFilter({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  id="filter-active"
                  checked={filter.isActive}
                  onCheckedChange={(isActive) => updateFilter({ isActive })}
                />
                <Label htmlFor="filter-active">Filter aktiv</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-description">Beschreibung</Label>
            <Textarea
              id="filter-description"
              placeholder="Beschreibung des Filters (optional)"
              value={filter.description || ""}
              onChange={(e) => updateFilter({ description: e.target.value })}
              rows={2}
            />
          </div>

          <Separator />

          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Fehler gefunden:
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Warnungen:
              </div>
              <ul className="list-disc list-inside text-yellow-700 text-sm">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.isValid && filter.name && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                Filter ist gültig und bereit zum Speichern.
              </div>
            </div>
          )}

          {/* Filter Builder */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Filter-Bedingungen</h3>
            {renderGroup(filter.group)}
          </div>
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default AdvancedFilterDialog;
