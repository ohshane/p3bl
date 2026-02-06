import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { getConfiguredAIModel } from "@/lib/ai-config";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  FileText,
  Ban,
  GripVertical,
  Info,
} from "lucide-react";
import { differenceInMinutes, addMinutes, format } from "date-fns";
import { useCreatorStore } from "@/stores/creatorStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, isValidDate, safeFormatDate } from "@/lib/utils";
import type {
  DeliverableType,
  RubricItem,
  SessionDifficulty,
  CreatorSession,
} from "@/types";

// OpenRouter API configuration
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_API_URL = `${API_BASE}/chat/completions`;

const DELIVERABLE_TYPES = [
  { value: "none", label: "None", icon: Ban },
  { value: "document", label: "Document", icon: FileText },
] as const;

const DIFFICULTY_OPTIONS: {
  value: SessionDifficulty;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    bgColor: "bg-sky-500",
    textColor: "text-sky-600",
    borderColor: "border-sky-500",
  },
  {
    value: "medium",
    label: "Medium",
    bgColor: "bg-violet-500",
    textColor: "text-violet-600",
    borderColor: "border-violet-500",
  },
  {
    value: "hard",
    label: "Hard",
    bgColor: "bg-rose-500",
    textColor: "text-rose-600",
    borderColor: "border-rose-500",
  },
];

const DIFFICULTY_WEIGHTS: Record<SessionDifficulty, number> = {
  easy: 60,
  medium: 100,
  hard: 140,
};

// Format duration for display (minutes -> human readable)
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes < 10080) {
    const days = Math.round(minutes / 1440);
    return `${days} day${days > 1 ? "s" : ""}`;
  } else {
    const weeks = Math.round(minutes / 10080);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }
}

// Format session duration based on total project duration
function formatSessionDuration(
  sessionMinutes: number,
  totalMinutes: number,
): string {
  // Use the same scale as the project
  if (totalMinutes < 1440) {
    // Project is less than a day - show in minutes or hours
    if (sessionMinutes < 60) {
      return `${sessionMinutes} min`;
    }
    const hours = Math.round((sessionMinutes / 60) * 10) / 10;
    return `${hours}h`;
  } else if (totalMinutes < 10080) {
    // Project is less than a week - show in hours or days
    if (sessionMinutes < 1440) {
      const hours = Math.round(sessionMinutes / 60);
      return `${hours}h`;
    }
    const days = Math.round((sessionMinutes / 1440) * 10) / 10;
    return `${days}d`;
  } else {
    // Project is weeks - show in days
    const days = Math.round(sessionMinutes / 1440);
    return `${days} day${days > 1 ? "s" : ""}`;
  }
}

// System prompt for session generation
const getSessionGenerationPrompt = (
  divergenceLevel: number,
  toneLevel: number,
) => `You are an expert educational project designer for a project-based learning platform.
Your task is to generate appropriate learning sessions based on the project information provided.

Guidelines:
- Create sessions that scaffold learning from foundational concepts to complex applications
- Each session should have a clear learning objective tied to the driving question
- Difficulty should progress: typically start with easy/medium, build to hard, then consolidate
- Time allocation based on difficulty: easy (shorter), medium (standard), hard (longer)
- Rubric criteria should be specific, measurable, and aligned with session objectives
- Thinking Style (Divergence Level): ${divergenceLevel}/100 (0 = Highly Convergent/Structured, 100 = Highly Divergent/Creative).
  - Low divergence: Detailed guides, specific document deliverables, strict rubrics.
  - High divergence: Open-ended guides, creative deliverables, flexible rubrics.
- Tone/Style: ${toneLevel}/100 (0 = Professional/Formal, 100 = Fun/Casual).
  - Low (0-30): Strictly professional, academic, formal tone.
  - Mid (31-70): Balanced tone. Professional but accessible and engaging.
  - High (71-100): Fun, engaging, casual tone. Use emojis, exciting language.

For each session, provide:
- title: Concise session title (3-7 words)
- topic: What students will learn/do in this session (1-2 sentences)
- difficulty: "easy", "medium", or "hard"
- guide: Detailed instructions for students (2-3 paragraphs)
- deliverableType: "none" or "document" based on the project nature and divergence level
- rubric: Array of 3-4 criteria, each with criterion name, description, maxScore (25), and weight (25)`;

// JSON schema for structured session output
const SESSION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
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
                maxScore: { type: "number" },
                weight: { type: "number" }
              },
              required: ["criterion", "description", "maxScore", "weight"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "topic", "difficulty", "guide", "deliverableType", "rubric"],
        additionalProperties: false
      }
    }
  },
  required: ["sessions"],
  additionalProperties: false
};

interface GeneratedSession {
  title: string;
  topic: string;
  difficulty: SessionDifficulty;
  guide: string;
  deliverableType: DeliverableType;
  rubric: Omit<RubricItem, "id">[];
}

async function generateSessions(
  title: string,
  background: string,
  drivingQuestion: string,
  durationMinutes: number,
  sessionCount: number,
  divergenceLevel: number,
  toneLevel: number,
): Promise<GeneratedSession[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("API key is not configured");
  }

  const durationText = formatDuration(durationMinutes);
  
  let aiModel: string;
  try {
    aiModel = await getConfiguredAIModel();
    console.log("Using AI model:", aiModel);
  } catch (error) {
    console.error("Error getting AI model, using default:", error);
    aiModel = "openrouter/auto";
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Peabee Session Generator",
    },
    body: JSON.stringify({
      model: aiModel,
      messages: [
        {
          role: "system",
          content: getSessionGenerationPrompt(divergenceLevel, toneLevel),
        },
        {
          role: "user",
          content: `Generate exactly ${sessionCount} learning sessions for this project:

Project Title: ${title}
Background: ${background}
Driving Question: ${drivingQuestion}
Total Duration: ${durationText}

Create a well-structured learning journey that helps students answer the driving question.`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7 + (divergenceLevel / 100) * 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sessions_response",
          strict: true,
          schema: SESSION_RESPONSE_SCHEMA
        }
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in API response");
  }

  try {
    let jsonContent = content.trim();
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonContent);
    return parsed.sessions.map((s: any) => ({
      title: s.title || "",
      topic: s.topic || "",
      difficulty: (["easy", "medium", "hard"].includes(s.difficulty)
        ? s.difficulty
        : "medium") as SessionDifficulty,
      guide: s.guide || "",
      deliverableType: (["none", "document"].includes(s.deliverableType)
        ? s.deliverableType
        : "document") as DeliverableType,
      rubric: (s.rubric || []).map((r: any) => ({
        criterion: r.criterion || "",
        description: r.description || "",
        maxScore: r.maxScore || 25,
        weight: r.weight || 25,
      })),
    }));
  } catch (parseError) {
    console.error("Failed to parse JSON response:", content, parseError);
    throw new Error("Failed to parse AI response. Please try again.");
  }
}

// Calculate recommended session count based on duration (in minutes)
function getRecommendedSessionCount(minutes: number): number {
  if (minutes <= 0) return 1;
  if (minutes <= 60) return 3; // ≤1 hour
  if (minutes <= 240) return 4; // ≤4 hours
  if (minutes <= 480) return 5; // ≤8 hours
  if (minutes <= 1440) return 3; // ≤1 day
  if (minutes <= 10080) return 3; // ≤1 week
  if (minutes <= 20160) return 5; // ≤2 weeks
  if (minutes <= 40320) return 6; // ≤4 weeks
  if (minutes <= 80640) return 8; // ≤8 weeks
  return 8; // >8 weeks
}

export function VariableSessionBuilder() {
  const { wizardState, addSession, updateSession, removeSession, setSessions } =
    useCreatorStore();
  const { sessions, timeline, basicInfo, validationErrors } = wizardState;

  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [divergenceLevel, setDivergenceLevel] = useState([50]);
  const [toneLevel, setToneLevel] = useState([50]);

  // Timeline drag state
  const [draggingHandle, setDraggingHandle] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Session reorder drag state
  const [draggedSessionIndex, setDraggedSessionIndex] = useState<number | null>(null);
  const [dragOverSessionIndex, setDragOverSessionIndex] = useState<number | null>(null);

  // Calculate total duration in minutes
  const totalMinutes = useMemo(() => {
    if (!isValidDate(timeline.startDate) || !isValidDate(timeline.endDate))
      return 0;
    return differenceInMinutes(
      new Date(timeline.endDate),
      new Date(timeline.startDate),
    );
  }, [timeline.startDate, timeline.endDate]);

  // Session count state with recommended default
  const [sessionCount, setSessionCount] = useState(() =>
    getRecommendedSessionCount(totalMinutes),
  );

  // Calculate normalized weights and session dates
  const totalWeight = sessions.reduce((sum, s) => sum + s.weight, 0);

  const sessionsWithDates = useMemo(() => {
    if (!isValidDate(timeline.startDate) || sessions.length === 0) {
      return sessions.map((session, index) => ({
        ...session,
        index,
        calculatedStartDate: "",
        calculatedEndDate: "",
        isoStartDate: "",
        isoEndDate: "",
        sessionMinutes: 0,
        percentage: sessions.length > 0 ? Math.round(100 / sessions.length) : 0,
      }));
    }

    let currentDate = new Date(timeline.startDate);
    return sessions.map((session, index) => {
      const proportion = totalWeight > 0 ? session.weight / totalWeight : 0;
      const sessionMinutes = Math.max(1, Math.round(totalMinutes * proportion));
      const startDate = currentDate;
      const endDate = addMinutes(currentDate, sessionMinutes);
      currentDate = endDate;

      return {
        ...session,
        index,
        calculatedStartDate: format(startDate, "yyyy-MM-dd HH:mm"),
        calculatedEndDate: format(endDate, "yyyy-MM-dd HH:mm"),
        isoStartDate: startDate.toISOString(),
        isoEndDate: endDate.toISOString(),
        sessionMinutes,
        percentage: Math.round(proportion * 100),
      };
    });
  }, [sessions, timeline.startDate, totalMinutes, totalWeight]);

  // Handle drag for timeline distribution
  const handleTimelineDrag = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (draggingHandle === null || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const totalWidth = rect.width;

      // Calculate cumulative percentage up to the handle
      let cumulativePercent = 0;
      for (let i = 0; i < draggingHandle; i++) {
        cumulativePercent += sessionsWithDates[i]?.percentage || 0;
      }

      // Calculate new percentage at mouse position
      const newPercent = Math.max(5, Math.min(95, (mouseX / totalWidth) * 100));

      // Calculate the change needed
      const leftSession = sessions[draggingHandle];
      const rightSession = sessions[draggingHandle + 1];

      if (!leftSession || !rightSession) return;

      // Get current percentages
      const leftPercent = sessionsWithDates[draggingHandle]?.percentage || 0;
      const rightPercent = sessionsWithDates[draggingHandle + 1]?.percentage || 0;
      const combinedPercent = leftPercent + rightPercent;

      // Calculate new left percentage based on mouse position relative to the combined block
      const newLeftPercent = Math.max(
        5,
        Math.min(combinedPercent - 5, newPercent - cumulativePercent)
      );

      // Convert percentages back to weights
      const totalWeightForBoth = leftSession.weight + rightSession.weight;
      const newLeftWeight = Math.max(
        1,
        Math.round((newLeftPercent / combinedPercent) * totalWeightForBoth)
      );
      const newRightWeight = Math.max(1, totalWeightForBoth - newLeftWeight);

      // Update both sessions
      updateSession(draggingHandle, { weight: newLeftWeight });
      updateSession(draggingHandle + 1, { weight: newRightWeight });
    },
    [draggingHandle, sessions, sessionsWithDates, updateSession]
  );

  // Mouse up handler to stop dragging
  const handleMouseUp = useCallback(() => {
    setDraggingHandle(null);
  }, []);

  // Add global mouse events when dragging
  useEffect(() => {
    if (draggingHandle !== null) {
      const handleMove = (e: MouseEvent) => handleTimelineDrag(e);
      const handleUp = () => handleMouseUp();

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);

      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [draggingHandle, handleTimelineDrag, handleMouseUp]);

  // Session reorder handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedSessionIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSessionIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverSessionIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedSessionIndex;
    
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedSessionIndex(null);
      setDragOverSessionIndex(null);
      return;
    }

    // Reorder sessions
    const newSessions = [...sessions];
    const [draggedSession] = newSessions.splice(dragIndex, 1);
    newSessions.splice(dropIndex, 0, draggedSession);
    setSessions(newSessions);

    setDraggedSessionIndex(null);
    setDragOverSessionIndex(null);
    
    // Update expanded session index if needed
    if (expandedSession === dragIndex) {
      setExpandedSession(dropIndex);
    } else if (expandedSession !== null) {
      if (dragIndex < expandedSession && dropIndex >= expandedSession) {
        setExpandedSession(expandedSession - 1);
      } else if (dragIndex > expandedSession && dropIndex <= expandedSession) {
        setExpandedSession(expandedSession + 1);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedSessionIndex(null);
    setDragOverSessionIndex(null);
  };

  // Sync calculated dates to session state
  useEffect(() => {
    if (!isValidDate(timeline.startDate)) return;

    sessionsWithDates.forEach((calculated, index) => {
      const currentSession = sessions[index];
      // We check for formatted equality to avoid infinite loops with slightly different ISO strings
      // or just trust that if we set it, it sticks.
      // But wait, calculated is derived from timeline.startDate.
      // We want to save this derived value to the session object so it gets persisted to DB.

      if (
        currentSession.startDate !== calculated.isoStartDate ||
        currentSession.endDate !== calculated.isoEndDate
      ) {
        // We use a timeout to batch updates or avoid render cycle warning?
        // Ideally we should batch this.
        // But updateSession triggers a re-render.
        // Doing this in a loop is bad.
        // Better to update all at once.
      }
    });

    // Batch update check
    const updatesNeeded = sessionsWithDates.some((calculated, index) => {
      const currentSession = sessions[index];
      return (
        currentSession.startDate !== calculated.isoStartDate ||
        currentSession.endDate !== calculated.isoEndDate
      );
    });

    if (updatesNeeded) {
      const newSessions = sessions.map((session, index) => {
        const calculated = sessionsWithDates[index];
        return {
          ...session,
          startDate: calculated.isoStartDate,
          endDate: calculated.isoEndDate,
        };
      });
      // We need a way to set all sessions. setSessions does that.
      // But we need to be careful not to create a loop.
      // setSessions updates 'sessions'.
      // sessionsWithDates depends on 'sessions'.
      // recalculates.
      // updatesNeeded check -> should be false now.
      setSessions(newSessions);
    }
  }, [sessionsWithDates, sessions, setSessions, timeline.startDate]);

  // Generate all sessions with AI
  const handleGenerateAllSessions = async () => {
    if (!basicInfo.title || !basicInfo.drivingQuestion) {
      setGenerationError(
        "Please fill in project title and driving question first (Step 2: Content)",
      );
      return;
    }

    if (!OPENROUTER_API_KEY) {
      setGenerationError(
        "AI generation is not configured. Please add sessions manually.",
      );
      return;
    }

    setIsGeneratingAll(true);
    setGenerationError(null);

    try {
      const generated = await generateSessions(
        basicInfo.title,
        basicInfo.background,
        basicInfo.drivingQuestion,
        totalMinutes || 20160, // default 2 weeks
        sessionCount,
        divergenceLevel[0],
        toneLevel[0],
      );

      const newSessions: Omit<CreatorSession, "id">[] = generated.map(
        (g, index) => ({
          index,
          title: g.title,
          topic: g.topic,
          guide: g.guide,
          difficulty: g.difficulty,
          weight: DIFFICULTY_WEIGHTS[g.difficulty],
          startDate: "",
          endDate: "",
          deliverableType: g.deliverableType,
          rubric: g.rubric.map((r) => ({
            id: `rubric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...r,
          })),
          resources: [],
          templates: [],
          llmModel: "gpt-4",
        }),
      );

      setSessions(newSessions);
      setExpandedSession(0);
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate sessions. Please try again.",
      );
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Rubric management
  const addRubricItem = (sessionIndex: number) => {
    const currentRubric = sessions[sessionIndex].rubric || [];
    const newItem: RubricItem = {
      id: `rubric_${Date.now()}`,
      criterion: "",
      description: "",
      maxScore: 25,
      weight: 25,
    };
    updateSession(sessionIndex, { rubric: [...currentRubric, newItem] });
  };

  const updateRubricItem = (
    sessionIndex: number,
    rubricIndex: number,
    updates: Partial<RubricItem>,
  ) => {
    const currentRubric = [...(sessions[sessionIndex].rubric || [])];
    currentRubric[rubricIndex] = { ...currentRubric[rubricIndex], ...updates };
    updateSession(sessionIndex, { rubric: currentRubric });
  };

  const removeRubricItem = (sessionIndex: number, rubricIndex: number) => {
    const currentRubric = sessions[sessionIndex].rubric.filter(
      (_, i) => i !== rubricIndex,
    );
    updateSession(sessionIndex, { rubric: currentRubric });
  };

  // Update session count when totalMinutes changes
  const recommendedCount = getRecommendedSessionCount(totalMinutes);

  // Format date/time display based on duration scale
  const formatTimelineDate = (dateStr: string) => {
    if (totalMinutes < 1440) {
      // Less than a day - show time
      return safeFormatDate(dateStr, "MMM d HH:mm", "?");
    }
    return safeFormatDate(dateStr, "MMM d", "?");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Variable Session Builder
        </h2>
        <p className="text-muted-foreground">
          AI generates sessions based on your project info. Customize as needed.
        </p>
      </div>

      {/* Session Generation Controls */}
      <div className="p-4 bg-card rounded-xl border border-border space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Duration Info */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Project Duration
              </div>
              <div className="text-foreground font-medium">
                {totalMinutes > 0 ? (
                  <>
                    {formatDuration(totalMinutes)}
                    <span className="text-muted-foreground font-normal ml-2 text-sm">
                      ({formatTimelineDate(timeline.startDate)} -{" "}
                      {formatTimelineDate(timeline.endDate)})
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </div>
            </div>

            {/* Session Count Selector */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Number of Sessions
                {sessionCount === recommendedCount && (
                  <span className="text-cyan-500 ml-1">(recommended)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSessionCount(Math.max(1, sessionCount - 1))}
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors"
                  disabled={sessionCount <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center text-xl font-bold text-foreground">
                  {sessionCount}
                </span>
                <button
                  onClick={() =>
                    setSessionCount(Math.min(10, sessionCount + 1))
                  }
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors"
                  disabled={sessionCount >= 10}
                >
                  +
                </button>
                {sessionCount !== recommendedCount && (
                  <button
                    onClick={() => setSessionCount(recommendedCount)}
                    className="text-xs text-cyan-500 hover:text-cyan-600 ml-2"
                  >
                    Reset to {recommendedCount}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateAllSessions}
            disabled={isGeneratingAll || !basicInfo.title}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {sessionCount} Sessions
              </>
            )}
          </Button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/50">
          {/* Divergence Slider */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>Convergent</span>
              <span className="text-cyan-500 font-medium">Thinking Style</span>
              <span>Divergent</span>
            </div>
            <Slider
              value={divergenceLevel}
              onValueChange={setDivergenceLevel}
              max={100}
              step={50}
              className="py-1 cursor-pointer"
            />
          </div>

          {/* Tone Slider */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>Professional</span>
              <span className="text-purple-500 font-medium">Tone</span>
              <span>Fun/Casual</span>
            </div>
            <Slider
              value={toneLevel}
              onValueChange={setToneLevel}
              max={100}
              step={50}
              className="py-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {generationError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-500">{generationError}</p>
        </div>
      )}

      {/* Timeline Preview */}
      {sessions.length > 0 && (
        <div className="p-4 bg-card rounded-lg border border-border">
          <label className="text-sm font-medium text-foreground mb-3 block">
            Timeline Distribution
            <span className="text-xs text-muted-foreground font-normal ml-2">
              (drag handles to adjust)
            </span>
          </label>
          <div className="px-8">
            <div
              ref={timelineRef}
              className={cn(
                "flex h-14 rounded-lg overflow-hidden border border-border bg-muted/30 relative",
                draggingHandle !== null && "cursor-col-resize"
              )}
            >
            {sessionsWithDates.map((session, index) => (
              <div
                key={index}
                className="relative h-full"
                style={{ width: `${session.percentage}%` }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-full flex flex-col items-center justify-center text-foreground bg-background border-y border-l border-border/70 transition-colors duration-200 ease-out hover:bg-cyan-500/35",
                          expandedSession === index && "bg-cyan-500/35",
                          index === sessionsWithDates.length - 1 && "border-r"
                        )}
                        onClick={() => setExpandedSession(index)}
                      >
                        <span className="text-xs font-semibold">{index + 1}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatSessionDuration(session.sessionMinutes, totalMinutes)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">
                        {session.title || `Session ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSessionDuration(
                          session.sessionMinutes,
                          totalMinutes,
                        )}{" "}
                        ({session.percentage}%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Draggable handle between sessions */}
                {index < sessionsWithDates.length - 1 && (
                  <div
                    className={cn(
                      "absolute right-0 top-0 h-full w-3 cursor-col-resize z-10 flex items-center justify-center translate-x-1/2 group",
                      draggingHandle === index && "bg-cyan-500/20"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingHandle(index);
                    }}
                  >
                    <div
                      className={cn(
                        "w-1 h-8 rounded-full bg-border transition-colors",
                        "group-hover:bg-cyan-500 group-hover:w-1.5",
                        draggingHandle === index && "bg-cyan-500 w-1.5"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
            </div>
            {/* Timeline markers showing start/end times for each block */}
            <div className="relative flex mt-1 pb-4">
              {sessionsWithDates.map((session, index) => (
                <div
                  key={index}
                  className="relative text-[10px] text-muted-foreground"
                  style={{ width: `${session.percentage}%` }}
                >
                  {/* Start time - show for first block or when there's enough space */}
                  <span className="absolute left-0 -translate-x-1/2">
                    {index === 0 && formatTimelineDate(session.isoStartDate)}
                  </span>
                  {/* End time - always show on the right edge */}
                  <span className="absolute right-0 translate-x-1/2">
                    {formatTimelineDate(session.isoEndDate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 bg-muted/40 rounded-lg border border-border">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Click "Generate {sessionCount} Sessions" above or add sessions
              manually
            </p>
            <Button
              onClick={() => addSession()}
              variant="outline"
              className="border-border"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </div>
        ) : (
          sessionsWithDates.map((session, index) => (
            <div
              key={index}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "bg-card rounded-lg border border-border overflow-hidden transition-all",
                draggedSessionIndex === index && "opacity-50",
                dragOverSessionIndex === index && draggedSessionIndex !== index && "border-cyan-500 border-2"
              )}
            >
              {/* Session Header */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/70 transition-colors cursor-grab active:cursor-grabbing"
                onClick={() =>
                  setExpandedSession(expandedSession === index ? null : index)
                }
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-foreground font-semibold border border-border bg-background shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">
                      {session.title || `Session ${index + 1}`}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{session.topic || "No objective set"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-nowrap">
                  <div className="flex items-center gap-3 min-w-[210px] justify-end whitespace-nowrap">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold capitalize",
                        session.difficulty === "easy" &&
                          "bg-sky-500/10 text-sky-600",
                        session.difficulty === "medium" &&
                          "bg-violet-500/10 text-violet-600",
                        session.difficulty === "hard" &&
                          "bg-rose-500/10 text-rose-600",
                      )}
                    >
                      {session.difficulty}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatSessionDuration(
                        session.sessionMinutes,
                        totalMinutes,
                      )}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSession(index);
                    }}
                    className="text-muted-foreground hover:text-red-500"
                    disabled={sessions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedSession === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Session Details (Expanded) */}
              {expandedSession === index && (
                <div className="p-4 border-t border-border space-y-6">
                  {/* Title & Objective */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Session Title
                      </label>
                      <Input
                        value={session.title}
                        onChange={(e) =>
                          updateSession(index, { title: e.target.value })
                        }
                        placeholder={`Session ${index + 1}`}
                        className="bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Objective
                      </label>
                      <Input
                        value={session.topic}
                        onChange={(e) =>
                          updateSession(index, { topic: e.target.value })
                        }
                        placeholder="What will students learn?"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() =>
                            updateSession(index, { difficulty: opt.value })
                          }
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                            session.difficulty === opt.value
                              ? `${opt.bgColor} text-white border-transparent`
                              : `bg-muted/50 ${opt.textColor} ${opt.borderColor} border-opacity-40 hover:border-opacity-100`,
                          )}
                        >
                          {opt.label}
                          <span className="ml-2 text-xs opacity-80">
                            x{(DIFFICULTY_WEIGHTS[opt.value] / 100).toFixed(1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Session Guide */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Session Guide
                    </label>
                    <Textarea
                      value={session.guide}
                      onChange={(e) =>
                        updateSession(index, { guide: e.target.value })
                      }
                      placeholder="Provide instructions and guidance for this session"
                      className="bg-background border-border min-h-[100px]"
                    />
                  </div>

                  {/* Deliverable Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Deliverable Type
                    </label>
                    <div className="flex gap-3 w-full">
                      {DELIVERABLE_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected =
                          session.deliverableType === type.value;

                        return (
                          <button
                            key={type.value}
                            onClick={() =>
                              updateSession(index, {
                                deliverableType: type.value,
                              })
                            }
                            className={cn(
                              "p-3 rounded-lg border flex flex-col items-center gap-2 transition-all flex-1",
                              isSelected
                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                                : "border-border text-muted-foreground hover:border-border/70",
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rubric - Modern Card Design */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-foreground">
                        Rubric Criteria
                      </label>
                      <button
                        onClick={() => addRubricItem(index)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 bg-background hover:bg-accent/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Criterion
                      </button>
                    </div>

                    {session.rubric.length === 0 ? (
                      <div className="text-center py-8 rounded-lg border border-dashed border-border/50 bg-background/50">
                        <p className="text-sm text-muted-foreground mb-3">
                          No rubric criteria defined
                        </p>
                        <button
                          onClick={() => addRubricItem(index)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 bg-background hover:bg-accent/50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add First Criterion
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {session.rubric.map((item, rubricIndex) => (
                          <div
                            key={item.id}
                            className="p-3 bg-background rounded-lg border border-border/50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={item.criterion}
                                  onChange={(e) =>
                                    updateRubricItem(index, rubricIndex, {
                                      criterion: e.target.value,
                                    })
                                  }
                                  placeholder="Criterion name"
                                  className="bg-background border-border/50 text-sm"
                                />
                                <Input
                                  value={item.description}
                                  onChange={(e) =>
                                    updateRubricItem(index, rubricIndex, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Description"
                                  className="bg-background border-border/50 text-sm"
                                />
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Max Score
                                    </label>
                                    <Input
                                      type="number"
                                      value={item.maxScore}
                                      onChange={(e) =>
                                        updateRubricItem(index, rubricIndex, {
                                          maxScore:
                                            parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="bg-background border-border/50 text-sm"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Weight %
                                    </label>
                                    <Input
                                      type="number"
                                      value={item.weight}
                                      onChange={(e) =>
                                        updateRubricItem(index, rubricIndex, {
                                          weight: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="bg-background border-border/50 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  removeRubricItem(index, rubricIndex)
                                }
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Session Buttons */}
      {sessions.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={() => {
              addSession();
              setExpandedSession(sessions.length);
            }}
            variant="outline"
            className="flex-1 border-border hover:border-border/70"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Session
          </Button>
        </div>
      )}

      {/* Validation Error */}
      {validationErrors.sessions && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-500">{validationErrors.sessions}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-muted/40 rounded-lg border border-border">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong className="text-foreground">AI-Powered Sessions:</strong>{" "}
              Based on your project title, background, and driving question, AI
              generates sessions with appropriate difficulty, time allocation,
              and rubric criteria.
            </p>
            <p>
              <strong className="text-foreground">Difficulty = Time:</strong>{" "}
              Easy sessions get less time, hard sessions get more. Adjust the
              weight slider for fine-tuning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
