import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
  CheckCircle,
  Calendar,
  DollarSign,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  templateGeneratorService,
  ProjectTemplate,
} from "@/services/templateGeneratorService";
import { useToast } from "@/hooks/use-toast";

export const TemplateWizard: React.FC = () => {
  const [step, setStep] = useState<"input" | "generating" | "preview">("input");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [generatedTemplate, setGeneratedTemplate] =
    useState<ProjectTemplate | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!description) return;

    setStep("generating");
    try {
      const template = await templateGeneratorService.generateTemplate(
        description,
        projectType
      );
      setGeneratedTemplate(template);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate template. Please try again.",
        variant: "destructive",
      });
      setStep("input");
    }
  };

  const handleUseTemplate = () => {
    toast({
      title: "Template Applied",
      description: "New project created from AI template!",
    });
    // Reset
    setStep("input");
    setDescription("");
    setProjectType("");
    setGeneratedTemplate(null);
  };

  return (
    <Card className="h-full border-l-4 border-l-purple-500 bg-gradient-to-br from-card to-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-500" />
          <CardTitle className="text-lg">AI Project Architect</CardTitle>
        </div>
        <CardDescription>
          Describe your project, get a complete plan
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Type</label>
                <Input
                  placeholder="e.g., Renovation, New Build, Landscaping"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your project goals, constraints, and key requirements..."
                  className="min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleGenerate}
                disabled={!description}
              >
                <Wand2 className="w-4 h-4 mr-2" /> Generate Plan
              </Button>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Analyzing requirements...
              </p>
            </motion.div>
          )}

          {step === "preview" && generatedTemplate && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-background/50 p-3 rounded-lg border">
                <h4 className="font-semibold text-purple-600 mb-1">
                  {generatedTemplate.name}
                </h4>
                <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />{" "}
                    {generatedTemplate.estimatedDurationWeeks} weeks
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" /> €
                    {generatedTemplate.estimatedCostRange.min.toLocaleString()}{" "}
                    -{" "}
                    {generatedTemplate.estimatedCostRange.max.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {generatedTemplate.phases.map((phase, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium flex items-center">
                          <Layers className="w-3 h-3 mr-1 text-muted-foreground" />{" "}
                          {phase.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {phase.durationWeeks}w
                        </Badge>
                      </div>
                      <ul className="list-disc list-inside pl-2 text-xs text-muted-foreground">
                        {phase.tasks.slice(0, 2).map((t, j) => (
                          <li key={j}>{t}</li>
                        ))}
                        {phase.tasks.length > 2 && (
                          <li>+{phase.tasks.length - 2} more tasks</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("input")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleUseTemplate}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Create Project
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
