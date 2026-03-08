import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  Calendar,
  Clock,
  X,
  Plus,
  MapPin,
  Building,
} from "lucide-react";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { PresetService, type WagePreset } from "@/services/presetService";
import { teamService } from "@/services/TeamService";

// Validation schema
const employeeSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().min(6, "Ungültige Telefonnummer"),
  role: z.string().min(2, "Rolle ist erforderlich"),
  department: z.string().min(2, "Abteilung ist erforderlich"),
  location: z.string().optional(),
  hourlyRate: z.number().min(0, "Stundensatz muss positiv sein"),
  availability: z.enum(["available", "busy", "vacation", "sick"]),
  skills: z.array(
    z.object({
      name: z.string().min(1, "Skill-Name ist erforderlich"),
      level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
    })
  ),
  workingHours: z.object({
    start: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Ungültiges Zeitformat (HH:MM)"
      ),
    end: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Ungültiges Zeitformat (HH:MM)"
      ),
  }),
  currentProject: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export interface Employee extends Omit<EmployeeFormData, "skills"> {
  id: string;
  skills: Array<{ name: string; level: string }>;
}

interface EmployeeProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onSuccess?: () => void;
}

const skillLevelColors = {
  beginner: "bg-blue-100 text-blue-700 border-blue-200",
  intermediate: "bg-green-100 text-green-700 border-green-200",
  advanced: "bg-purple-100 text-purple-700 border-purple-200",
  expert: "bg-orange-100 text-orange-700 border-orange-200",
};

const skillLevelLabels = {
  beginner: "Anfänger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
  expert: "Spezialist",
};

const availabilityColors = {
  available: "bg-green-100 text-green-700 border-green-200",
  busy: "bg-red-100 text-red-700 border-red-200",
  vacation: "bg-blue-100 text-blue-700 border-blue-200",
  sick: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const availabilityLabels = {
  available: "Verfügbar",
  busy: "Beschäftigt",
  vacation: "Urlaub",
  sick: "Krank",
};

export function EmployeeProfileDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeProfileDialogProps) {
  const { toast } = useToast();
  const isEditing = !!employee;
  const [wagePresets, setWagePresets] = useState<WagePreset[]>([]);
  const [selectedWagePresetId, setSelectedWagePresetId] = useState<string>("");

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      location: "",
      hourlyRate: 0,
      availability: "available",
      skills: [{ name: "", level: "intermediate" }],
      workingHours: { start: "08:00", end: "17:00" },
      currentProject: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  useEffect(() => {
    if (employee) {
      // Type-safe skill conversion
      const validSkills = employee.skills
        .filter((s) =>
          ["beginner", "intermediate", "advanced", "expert"].includes(s.level)
        )
        .map((s) => ({
          name: s.name,
          level: s.level as "beginner" | "intermediate" | "advanced" | "expert",
        }));

      form.reset({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        location: employee.location || "",
        hourlyRate: employee.hourlyRate,
        availability: employee.availability,
        skills:
          validSkills.length > 0
            ? validSkills
            : [{ name: "", level: "intermediate" as const }],
        workingHours: employee.workingHours,
        currentProject: employee.currentProject || "",
        startDate: employee.startDate || format(new Date(), "yyyy-MM-dd"),
        notes: employee.notes || "",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        location: "",
        hourlyRate: 0,
        availability: "available",
        skills: [{ name: "", level: "intermediate" as const }],
        workingHours: { start: "08:00", end: "17:00" },
        currentProject: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    }
  }, [employee, form, open]);

  useEffect(() => {
    setWagePresets(PresetService.listWagePresets());
  }, []);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (isEditing && employee) {
        await teamService.updateMember(employee.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          department: data.department,
          location: data.location,
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          skills: data.skills as any,
          workingHours: data.workingHours as any,
          currentProject: data.currentProject,
          startDate: data.startDate,
          notes: data.notes,
        });
      } else {
        await teamService.inviteMember(data.email, data.name, data.role);
        // Note: Full member creation with all fields would require a more complete
        // create method, but for now we follow the invitation pattern.
      }

      toast({
        title: isEditing ? "Mitarbeiter aktualisiert" : "Mitarbeiter erstellt",
        description: `${data.name} wurde erfolgreich ${
          isEditing ? "aktualisiert" : "hinzugefügt"
        }.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description:
          "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const addSkill = () => {
    append({ name: "", level: "intermediate" as const });
  };

  const applyWagePreset = () => {
    if (!selectedWagePresetId) return;
    const preset = wagePresets.find((p) => p.id === selectedWagePresetId);
    if (!preset) return;
    form.setValue("hourlyRate", preset.hourlyRate);
    form.setValue("role", preset.role);
    if (preset.department) {
      form.setValue("department", preset.department);
    }
  };

  const saveWagePresetFromForm = () => {
    const role = form.getValues("role");
    const hourlyRate = form.getValues("hourlyRate");
    const department = form.getValues("department");
    if (!role || !hourlyRate) return;
    const created = PresetService.createWagePreset({
      role,
      hourlyRate,
      department,
    });
    setWagePresets((prev) => [created, ...prev]);
    setSelectedWagePresetId(created.id);
  };

  const eurFormatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        showFullscreenToggle
        width="fit-content"
        minWidth={800}
        maxWidth={1400}
        resizable={true}
        modal={false}
        onClose={() => onOpenChange(false)}
        title={
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"}
          </span>
        }
        description={
          <DialogDescription>
            {isEditing
              ? "Bearbeiten Sie die Mitarbeiterinformationen und speichern Sie die Änderungen."
              : "Fügen Sie einen neuen Mitarbeiter hinzu und legen Sie Skills und Verfügbarkeit fest."}
          </DialogDescription>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              form="employee-form"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Speichert..."
                : isEditing
                ? "Änderungen speichern"
                : "Mitarbeiter hinzufügen"}
            </Button>
          </div>
        }
      >
        <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Allgemein</TabsTrigger>
              <TabsTrigger value="skills">Skills & Qualifikationen</TabsTrigger>
              <TabsTrigger value="schedule">Arbeitszeiten</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Max Mustermann"
                      className="pl-9"
                      {...form.register("name")}
                    />
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="max.mustermann@example.com"
                      className="pl-9"
                      {...form.register("email")}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">
                    Telefon <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+49 89 123456"
                      className="pl-9"
                      {...form.register("phone")}
                    />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">
                    Rolle <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      placeholder="Bauleiter"
                      className="pl-9"
                      {...form.register("role")}
                    />
                  </div>
                  {form.formState.errors.role && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.role.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="department">
                    Abteilung <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="department"
                      placeholder="Bauleitung"
                      className="pl-9"
                      {...form.register("department")}
                    />
                  </div>
                  {form.formState.errors.department && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.department.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Standort</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="München"
                      className="pl-9"
                      {...form.register("location")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourlyRate">
                    Stundensatz (€) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    placeholder="75.00"
                    {...form.register("hourlyRate", { valueAsNumber: true })}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Select
                      value={selectedWagePresetId}
                      onValueChange={setSelectedWagePresetId}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Lohn-Preset wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {wagePresets.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.role} – {p.hourlyRate.toFixed(2)} EUR
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyWagePreset}
                      disabled={!selectedWagePresetId}
                    >
                      Preset anwenden
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveWagePresetFromForm}
                    >
                      Als Preset speichern
                    </Button>
                  </div>
                  {form.formState.errors.hourlyRate && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.hourlyRate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="availability">Verfügbarkeit</Label>
                  <Select
                    value={form.watch("availability")}
                    onValueChange={(
                      value: "available" | "busy" | "vacation" | "sick"
                    ) => form.setValue("availability", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availabilityLabels).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${
                                  availabilityColors[
                                    key as keyof typeof availabilityColors
                                  ]
                                } text-xs`}
                              >
                                {label}
                              </Badge>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currentProject">Aktuelles Projekt</Label>
                  <Input
                    id="currentProject"
                    placeholder="PRJ-2025-001"
                    {...form.register("currentProject")}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Einstellungsdatum</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      className="pl-9"
                      {...form.register("startDate")}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Input
                    id="notes"
                    placeholder="Zusätzliche Informationen..."
                    {...form.register("notes")}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">
                    Skills & Qualifikationen
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fügen Sie Fähigkeiten und deren Niveau hinzu
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSkill}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Skill hinzufügen
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="z.B. AutoCAD, Projektmanagement"
                        {...form.register(`skills.${index}.name`)}
                      />
                      {form.formState.errors.skills?.[index]?.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.skills[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-40">
                      <Select
                        value={form.watch(`skills.${index}.level`)}
                        onValueChange={(
                          value:
                            | "beginner"
                            | "intermediate"
                            | "advanced"
                            | "expert"
                        ) => form.setValue(`skills.${index}.level`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(skillLevelLabels).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {fields.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Vorschau:</p>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("skills").map(
                      (skill, index) =>
                        skill.name && (
                          <Badge
                            key={index}
                            className={`${
                              skillLevelColors[
                                skill.level as keyof typeof skillLevelColors
                              ]
                            }`}
                          >
                            <Award className="h-3 w-3 mr-1" />
                            {skill.name} -{" "}
                            {
                              skillLevelLabels[
                                skill.level as keyof typeof skillLevelLabels
                              ]
                            }
                          </Badge>
                        )
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Arbeitszeiten</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Legen Sie die regulären Arbeitszeiten fest
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">
                    Arbeitsbeginn <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="start"
                      type="time"
                      className="pl-9"
                      {...form.register("workingHours.start")}
                    />
                  </div>
                  {form.formState.errors.workingHours?.start && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.workingHours.start.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end">
                    Arbeitsende <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="end"
                      type="time"
                      className="pl-9"
                      {...form.register("workingHours.end")}
                    />
                  </div>
                  {form.formState.errors.workingHours?.end && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.workingHours.end.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Zusammenfassung:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Reguläre Arbeitszeit:
                    </span>
                    <span className="font-medium">
                      {form.watch("workingHours.start")} -{" "}
                      {form.watch("workingHours.end")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stundensatz:</span>
                    <span className="font-medium">
                      {eurFormatter.format(form.watch("hourlyRate") || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      className={`${
                        availabilityColors[form.watch("availability")]
                      }`}
                    >
                      {availabilityLabels[form.watch("availability")]}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogFrame>
    </MultiWindowDialog>
  );
}
