import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Award,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  BookOpen,
} from "lucide-react";

// Add DialogFrame import for standardized layout
import { DialogFrame } from "@/components/ui/dialog-frame";

export interface SkillData {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface EmployeeSkillData {
  id: string;
  name: string;
  department: string;
  role: string;
  skills: SkillData[];
}

interface SkillMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeSkillData[];
}

const skillLevelConfig = {
  beginner: {
    label: "Anfänger",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    score: 1,
  },
  intermediate: {
    label: "Fortgeschritten",
    color: "bg-green-100 text-green-700 border-green-300",
    score: 2,
  },
  advanced: {
    label: "Experte",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    score: 3,
  },
  expert: {
    label: "Spezialist",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    score: 4,
  },
};

export function SkillMatrixDialog({
  open,
  onOpenChange,
  employees,
}: SkillMatrixDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [minLevelFilter, setMinLevelFilter] = useState<string>("all");

  // Extract all unique skills from all employees
  const allSkills = Array.from(
    new Set(employees.flatMap((emp) => emp.skills.map((s) => s.name)))
  ).sort();

  // Extract unique departments
  const departments = Array.from(
    new Set(employees.map((e) => e.department))
  ).sort();

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || emp.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  // Calculate skill statistics
  const skillStats = allSkills.map((skillName) => {
    const employeesWithSkill = employees.filter((emp) =>
      emp.skills.some((s) => s.name === skillName)
    );

    const levelDistribution = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };

    employeesWithSkill.forEach((emp) => {
      const skill = emp.skills.find((s) => s.name === skillName);
      if (skill) {
        levelDistribution[skill.level]++;
      }
    });

    const averageLevel =
      employeesWithSkill.reduce((sum, emp) => {
        const skill = emp.skills.find((s) => s.name === skillName);
        return sum + (skill ? skillLevelConfig[skill.level].score : 0);
      }, 0) / (employeesWithSkill.length || 1);

    return {
      name: skillName,
      count: employeesWithSkill.length,
      coverage: (employeesWithSkill.length / employees.length) * 100,
      levelDistribution,
      averageLevel,
    };
  });

  // Filter skill stats based on selected skill filter
  const filteredSkillStats = skillStats.filter((stat) => {
    if (skillFilter === "all") return true;
    return stat.name === skillFilter;
  });

  // Get employee skill level for a specific skill
  const getEmployeeSkillLevel = (
    employee: EmployeeSkillData,
    skillName: string
  ) => {
    return employee.skills.find((s) => s.name === skillName);
  };

  // Filter skills for matrix based on min level
  const matrixSkills = skillFilter === "all" ? allSkills : [skillFilter];

  // Skill gap analysis
  const criticalSkills = skillStats
    .filter((stat) => stat.coverage < 50) // Less than 50% coverage
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 5);

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        showFullscreenToggle
        width="fit-content"
        minWidth={1200}
        maxWidth={1800}
        resizable={true}
        modal={false}
        onClose={() => onOpenChange(false)}
        title={
          <span className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Skill Matrix & Kompetenzanalyse
          </span>
        }
        description={
          <DialogDescription>
            Übersicht über Team-Kompetenzen, Skill-Verteilung und
            Kompetenzlücken
          </DialogDescription>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Schulungen planen
            </Button>
          </div>
        }
      >
        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matrix">Skill Matrix</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          </TabsList>

          {/* Matrix View */}
          <TabsContent value="matrix" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Mitarbeiter suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle Abteilungen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Abteilungen</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Skills</SelectItem>
                  {allSkills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Matrix Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Kompetenzmatrix ({filteredEmployees.length} Mitarbeiter)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">
                          Mitarbeiter
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Abteilung
                        </TableHead>
                        {matrixSkills.map((skill) => (
                          <TableHead
                            key={skill}
                            className="min-w-[100px] text-center"
                          >
                            {skill}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{employee.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {employee.role}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {employee.department}
                          </TableCell>
                          {matrixSkills.map((skillName) => {
                            const skill = getEmployeeSkillLevel(
                              employee,
                              skillName
                            );
                            return (
                              <TableCell
                                key={skillName}
                                className="text-center"
                              >
                                {skill ? (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      skillLevelConfig[skill.level].color
                                    }`}
                                  >
                                    {skillLevelConfig[skill.level].score}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Legende:</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(skillLevelConfig).map(([level, config]) => (
                      <div key={level} className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${config.color}`}
                        >
                          {config.score}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Gesamt Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allSkills.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Verschiedene Kompetenzen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />Ø Abdeckung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      skillStats.reduce((sum, stat) => sum + stat.coverage, 0) /
                        skillStats.length
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Pro Skill</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />Ø Skill Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      skillStats.reduce(
                        (sum, stat) => sum + stat.averageLevel,
                        0
                      ) / skillStats.length
                    ).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Von 4.0</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skill-Verteilung</CardTitle>
                <CardDescription>
                  Detaillierte Übersicht aller Kompetenzen im Team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSkillStats.map((stat) => (
                    <div key={stat.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold">{stat.name}</h4>
                        </div>
                        <Badge variant="outline">
                          {stat.count} Mitarbeiter ({Math.round(stat.coverage)}
                          %)
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {Object.entries(stat.levelDistribution).map(
                          ([level, count]) => (
                            <div
                              key={level}
                              className={`p-2 rounded text-center ${
                                skillLevelConfig[
                                  level as keyof typeof skillLevelConfig
                                ].color
                              }`}
                            >
                              <div className="text-lg font-bold">{count}</div>
                              <div className="text-xs">
                                {
                                  skillLevelConfig[
                                    level as keyof typeof skillLevelConfig
                                  ].label
                                }
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Durchschnittliches Level:
                        </span>
                        <span className="font-medium">
                          {stat.averageLevel.toFixed(2)} / 4.0
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skill Gaps View */}
          <TabsContent value="gaps" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Kritische Kompetenzlücken
                </CardTitle>
                <CardDescription>
                  Skills mit geringer Teamabdeckung (weniger als 50%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {criticalSkills.length > 0 ? (
                  <div className="space-y-4">
                    {criticalSkills.map((stat) => (
                      <div
                        key={stat.name}
                        className="border border-orange-200 bg-orange-50 dark:bg-orange-950 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              {stat.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Nur {stat.count} von {employees.length}{" "}
                              Mitarbeitern ({Math.round(stat.coverage)}%)
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-orange-100 border-orange-300"
                          >
                            {Math.round(stat.coverage)}% Abdeckung
                          </Badge>
                        </div>

                        <div className="mt-3 pt-3 border-t border-orange-200">
                          <p className="text-sm font-medium mb-2">
                            Empfohlene Maßnahmen:
                          </p>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>
                                Schulungen für interessierte Mitarbeiter
                                organisieren
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>
                                Externe Experten hinzuziehen oder einstellen
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>Mentoring-Programme einrichten</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      Keine kritischen Lücken
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Alle wichtigen Skills haben eine gute Teamabdeckung
                      (&gt;50%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Skill-Entwicklungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          Fortgeschrittene zu Experten entwickeln
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Identifizieren Sie Mitarbeiter mit
                          "Fortgeschritten"-Level und bieten Sie
                          Spezialisierungsprogramme an
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          Cross-Training fördern
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Etablieren Sie Wissenstransfer zwischen Experten und
                          Anfängern in kritischen Skills
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          Strategische Neueinstellungen
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Priorisieren Sie Skills mit geringer Abdeckung bei
                          zukünftigen Einstellungen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogFrame>
    </MultiWindowDialog>
  );
}
