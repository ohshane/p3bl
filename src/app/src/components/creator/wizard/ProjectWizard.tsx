import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getConfiguredAIModel } from "@/lib/ai-config";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderPlus,
  FileText,
  Users,
  Calendar,
  ListChecks,
  Settings,
  Rocket,
  Loader2,
  Zap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { useCreatorStore } from "@/stores/creatorStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Step components
import { WizardModeSelector } from "./steps/WizardModeSelector";
import { ContentSetup } from "./steps/ContentSetup";
import { TeamSetup } from "./steps/TeamSetup";
import { TimelineSetup } from "./steps/TimelineSetup";
import { VariableSessionBuilder } from "./steps/VariableSessionBuilder";
import { ReviewAndDeploy } from "./steps/ReviewAndDeploy";

const WIZARD_STEPS = [
  { id: 1, label: "Mode", icon: Settings, description: "Choose creation mode" },
  {
    id: 2,
    label: "Content",
    icon: FileText,
    description: "Project info & content",
  },
  { id: 3, label: "Teams", icon: Users, description: "Team formation" },
  { id: 4, label: "Timeline", icon: Calendar, description: "Project duration" },
  {
    id: 5,
    label: "Sessions",
    icon: ListChecks,
    description: "Build sessions with AI",
  },
  { id: 6, label: "Deploy", icon: Rocket, description: "Review & launch" },
];

const QUICK_START_DURATIONS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
  { label: "1 day", value: 1440 },
  { label: "2 days", value: 2880 },
  { label: "1 week", value: 10080 },
];

import { aiChatCompletion } from "@/server/api/ai";

// Difficulty to weight mapping (must match creatorStore and VariableSessionBuilder)
const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 60,
  medium: 100,
  hard: 140,
};

// Calculate recommended session count based on duration (must match VariableSessionBuilder)
function getRecommendedSessionCount(minutes: number): number {
  if (minutes <= 0) return 1;
  if (minutes <= 60) return 3;    // ≤1 hour
  if (minutes <= 240) return 4;   // ≤4 hours
  if (minutes <= 480) return 5;   // ≤8 hours
  if (minutes <= 1440) return 3;  // ≤1 day
  if (minutes <= 10080) return 3; // ≤1 week
  if (minutes <= 20160) return 5; // ≤2 weeks
  if (minutes <= 40320) return 6; // ≤4 weeks
  if (minutes <= 80640) return 8; // ≤8 weeks
  return 8;                       // >8 weeks
}

// System prompt for full project generation
const QUICK_START_PROMPT = `You are an expert educational project designer.
Generate a complete PBL project structure based on a keyword and duration.
Generate exactly the number of sessions specified in the user prompt.
Each session must have a difficulty of "easy", "medium", or "hard" — vary difficulties to create a natural learning progression.
Rubric weights must be integer percentages between 0 and 100 (no decimals) and must sum to exactly 100.
IMPORTANT: Do NOT prefix or number session titles with labels like "Session 1:", "Session 2:", etc. Use descriptive, content-based titles only.
IMPORTANT: Do NOT use the word "student" or "students" anywhere in the output — not in titles, topics, guides, background, driving question, rubric criteria, or rubric descriptions. Use "learner", "participant", "team", or rephrase to avoid addressing anyone directly.`;

// JSON schema for quick start structured output
const QUICK_START_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Engaging project title" },
    background: {
      type: "string",
      description: "Context about the project (2-3 sentences)",
    },
    drivingQuestion: {
      type: "string",
      description: "The central open-ended question",
    },
    sessions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          guide: { type: "string" },
          deliverableType: { type: "string", enum: ["none", "document"] },
          rubric: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                description: { type: "string" },
                weight: { type: "integer", minimum: 0, maximum: 100 },
              },
              required: ["criterion", "description", "weight"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "title",
          "topic",
          "difficulty",
          "guide",
          "deliverableType",
          "rubric",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "background", "drivingQuestion", "sessions"],
  additionalProperties: false,
};

export function ProjectWizard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingQuickStart, setIsGeneratingQuickStart] = useState(false);
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const [quickStartKeyword, setQuickStartKeyword] = useState("");
  const [durationIndex, setDurationIndex] = useState(0); // Default to 5 min

  const {
    wizardState,
    setWizardStep,
    nextStep,
    prevStep,
    resetWizard,
    setTimeline,
    setLastSessionDifficulty,
    createProject,
    quickStart,
  } = useCreatorStore();

  const { currentStep, totalSteps } = wizardState;
  const isPersonalTeamStep =
    currentStep === 3 &&
    wizardState.participantParams.projectMode === "personal";
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const isCurrentStepValid = () => {
    const step = currentStep;

    if (step === 2) {
      return (
        !!wizardState.basicInfo.title.trim() &&
        !!wizardState.basicInfo.drivingQuestion.trim()
      );
    }

    if (step === 3) {
      return (
        wizardState.participantParams.projectMode === "personal" ||
        wizardState.participantParams.teamSize >= 2
      );
    }

    if (step === 4) {
      return !!wizardState.timeline.startDate && !!wizardState.timeline.endDate;
    }

    if (step === 5) {
      if (wizardState.sessions.length === 0) return false;
      for (const session of wizardState.sessions) {
        if (session.deliverableType !== "none" && session.rubric.length > 0) {
          const totalWeight = session.rubric.reduce(
            (sum, r) => sum + r.weight,
            0,
          );
          if (totalWeight !== 100) return false;
        }
      }
    }

    if (step === totalSteps) {
      return wizardState.isValid;
    }

    return true;
  };
  const canProceed = !isCreating && isCurrentStepValid();

  // Reset wizard on mount
  useEffect(() => {
    resetWizard();
    const minStart = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    setTimeline({ startDate: minStart, endDate: "" });
  }, []);

  useEffect(() => {
    if (currentUser?.defaultSessionDifficulty) {
      setLastSessionDifficulty(currentUser.defaultSessionDifficulty);
    }
  }, [currentUser, setLastSessionDifficulty]);

  const handleBack = () => {
    if (currentStep === 1) {
      navigate({ to: "/creator" });
    } else {
      prevStep();
    }
  };

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      // Final step - create project
      if (!currentUser?.id) {
        toast.error("You must be logged in to create a project");
        return;
      }
      setIsCreating(true);
      try {
        const project = await createProject(currentUser.id);
        if (project) {
          toast.success("Project created successfully!");
          navigate({ to: "/creator" });
        } else {
          toast.error("Please fix validation errors before continuing");
        }
      } finally {
        setIsCreating(false);
      }
    } else {
      if (currentStep === 1 && wizardState.mode === "quickstart") {
        setShowQuickStartModal(true);
      } else {
        const result = nextStep();
        if (!result.success && result.error) {
          toast.error(result.error);
        }
      }
    }
  };

  const handleQuickStartConfirm = async () => {
    if (!quickStartKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    setIsGeneratingQuickStart(true);

    try {
      const selectedDuration = QUICK_START_DURATIONS[durationIndex];
      const recommendedCount = getRecommendedSessionCount(selectedDuration.value);

      let aiModel: string;
      try {
        aiModel = await getConfiguredAIModel();
      } catch (error) {
        console.error("Error getting AI model, using default:", error);
        aiModel = "openrouter/auto";
      }

      const result = await aiChatCompletion({
        data: {
          model: aiModel,
          messages: [
            { role: "system", content: QUICK_START_PROMPT },
            {
              role: "user",
              content: `Generate a project for keyword: "${quickStartKeyword}" with total duration: ${selectedDuration.label}. Generate exactly ${recommendedCount} sessions.`,
            },
          ],
          max_tokens: 3000,
          temperature: 0.7,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quick_start_response",
              strict: true,
              schema: QUICK_START_SCHEMA,
            },
          },
        },
      });

      if (!result.success) throw new Error(result.error || "API request failed");

      const content = result.content;

      let jsonContent = content.trim();
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) jsonContent = codeBlockMatch[1].trim();
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonContent = jsonMatch[0];

      const parsed = JSON.parse(jsonContent);

      // Calculate timeline
      const now = new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
      const start = now;
      const end = new Date(
        start.getTime() + selectedDuration.value * 60 * 1000,
      );

      // Build sessions with proper difficulty-based weights
      const mappedSessions = parsed.sessions.map((s: any, idx: number) => {
        const difficulty = ["easy", "medium", "hard"].includes(s.difficulty) ? s.difficulty : "medium";
        return {
          ...s,
          index: idx,
          difficulty,
          weight: DIFFICULTY_WEIGHTS[difficulty] || 100,
          durationMinutes: DIFFICULTY_WEIGHTS[difficulty] || 100,
          startDate: "",
          endDate: "",
          rubric: s.rubric.map((r: any, rIdx: number) => ({
            id: `quick_r_${idx}_${rIdx}`,
            ...r,
          })),
          resources: [],
          templates: [],
          llmModel: "gpt-4",
        };
      });

      // Distribute session dates proportionally based on weights (matching VariableSessionBuilder logic)
      const totalWeight = mappedSessions.reduce((sum: number, s: any) => sum + s.weight, 0);
      const totalMinutes = selectedDuration.value;
      let currentDate = new Date(start.getTime());

      for (const session of mappedSessions) {
        const proportion = totalWeight > 0 ? session.weight / totalWeight : 1 / mappedSessions.length;
        const sessionMinutes = Math.max(1, Math.round(totalMinutes * proportion));
        session.durationMinutes = sessionMinutes;
        session.startDate = currentDate.toISOString();
        currentDate = new Date(currentDate.getTime() + sessionMinutes * 60 * 1000);
        session.endDate = currentDate.toISOString();
      }

      quickStart({
        basicInfo: {
          title: parsed.title,
          background: parsed.background,
          drivingQuestion: parsed.drivingQuestion,
        },
        sessions: mappedSessions,
        timeline: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });

      toast.success("Project generated successfully!");
      setShowQuickStartModal(false);
      setWizardStep(6);
    } catch (error) {
      console.error("Quick Start generation error:", error);
      toast.error("Failed to generate project. Please try again.");
    } finally {
      setIsGeneratingQuickStart(false);
    }
  };

  const handleStepClick = (step: number) => {
    // No click disable logic (except back to Step 1)
    if (step === 1 && currentStep > 1) return;
    setWizardStep(step);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WizardModeSelector />;
      case 2:
        return <ContentSetup />;
      case 3:
        return <TeamSetup />;
      case 4:
        return <TimelineSetup />;
      case 5:
        return <VariableSessionBuilder />;
      case 6:
        return <ReviewAndDeploy />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderPlus className="w-8 h-8 text-cyan-500" />
            Create New Project
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {currentStep} of {totalSteps}:{" "}
            {WIZARD_STEPS[currentStep - 1]?.description}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/creator" })}
          className="text-muted-foreground hover:text-foreground border-border"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Step Indicators */}
      <div className="hidden lg:flex items-center w-full mb-12 py-2 relative">
        {WIZARD_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          // Step 1 is restricted once left, others are free
          const isClickable = step.id === 1 ? currentStep === 1 : true;

          return (
            <div
              key={step.id}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Connector Line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-[50%] right-[-50%] h-0.5 z-0 transition-colors",
                    isCompleted ? "bg-green-600" : "bg-muted",
                  )}
                />
              )}

              <button
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all z-10 relative",
                  isClickable &&
                    !isCurrent &&
                    "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm z-20 relative",
                    isCompleted && "bg-green-600 text-white",
                    isCurrent &&
                      "bg-cyan-600 text-white border-4 border-background ring-2 ring-cyan-500",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-background text-muted-foreground border-2 border-muted",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col items-center min-h-[20px]">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-tight",
                      isCurrent
                        ? "text-cyan-500"
                        : isCompleted
                          ? "text-green-600"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        {WIZARD_STEPS.map((step) => (
          <div
            key={step.id}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentStep === step.id && "w-6 bg-cyan-500",
              currentStep > step.id && "bg-green-500",
              currentStep < step.id && "bg-border",
            )}
          />
        ))}
      </div>

      {/* Step Content */}
      <div
        className={cn(
          "bg-card border border-border rounded-xl p-6",
          isPersonalTeamStep ? "min-h-[260px]" : "min-h-[400px]",
        )}
      >
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-border"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className={cn(
            currentStep === totalSteps
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-cyan-600 hover:bg-cyan-700 text-white",
            !canProceed && "opacity-60",
          )}
        >
          {currentStep === totalSteps ? (
            isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Create Project
              </>
            )
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Quick Start Configuration Modal */}
      <Dialog open={showQuickStartModal} onOpenChange={setShowQuickStartModal}>
        <DialogContent
          className="sm:max-w-[425px]"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Quick Start Configuration
            </DialogTitle>
            <DialogDescription>
              Provide a keyword and duration to instantly set up your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                placeholder="e.g. Climate Change, Blockchain, Cooking"
                value={quickStartKeyword}
                onChange={(e) => setQuickStartKeyword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="duration">Duration</Label>
                <span className="text-sm font-medium text-purple-600">
                  {QUICK_START_DURATIONS[durationIndex].label}
                </span>
              </div>
              <div className="py-4">
                <Slider
                  id="duration"
                  min={0}
                  max={QUICK_START_DURATIONS.length - 1}
                  step={1}
                  value={[durationIndex]}
                  onValueChange={(value) => setDurationIndex(value[0])}
                  className="cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{QUICK_START_DURATIONS[0].label}</span>
                <span>
                  {
                    QUICK_START_DURATIONS[
                      Math.floor(QUICK_START_DURATIONS.length / 2)
                    ].label
                  }
                </span>
                <span>
                  {
                    QUICK_START_DURATIONS[QUICK_START_DURATIONS.length - 1]
                      .label
                  }
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuickStartModal(false)}
              disabled={isGeneratingQuickStart}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickStartConfirm}
              disabled={isGeneratingQuickStart}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white min-w-[120px]"
            >
              {isGeneratingQuickStart ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
