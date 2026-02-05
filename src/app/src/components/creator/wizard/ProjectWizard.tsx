import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Bot,
  Users,
  Calendar,
  ListChecks,
  Settings,
  Rocket,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useCreatorStore } from '@/stores/creatorStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// Step components
import { WizardModeSelector } from './steps/WizardModeSelector'
import { ContentSetup } from './steps/ContentSetup'
import { AIPersonaSetup } from './steps/AIPersonaSetup'
import { TeamSetup } from './steps/TeamSetup'
import { TimelineSetup } from './steps/TimelineSetup'
import { VariableSessionBuilder } from './steps/VariableSessionBuilder'
import { ReviewAndDeploy } from './steps/ReviewAndDeploy'

const WIZARD_STEPS = [
  { id: 1, label: 'Mode', icon: Settings, description: 'Choose creation mode' },
  { id: 2, label: 'Content', icon: FileText, description: 'Project info & content' },
  { id: 3, label: 'AI Personas', icon: Bot, description: 'Select AI classmates' },
  { id: 4, label: 'Teams', icon: Users, description: 'Team formation' },
  { id: 5, label: 'Timeline', icon: Calendar, description: 'Project duration' },
  { id: 6, label: 'Sessions', icon: ListChecks, description: 'Build sessions with AI' },
  { id: 7, label: 'Deploy', icon: Rocket, description: 'Review & launch' },
]

export function ProjectWizard() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const [isCreating, setIsCreating] = useState(false)
  const {
    wizardState,
    setWizardStep,
    nextStep,
    prevStep,
    resetWizard,
    createProject,
  } = useCreatorStore()

  const { currentStep, totalSteps } = wizardState
  const isPersonalTeamStep =
    currentStep === 4 && wizardState.participantParams.projectMode === 'personal'
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  // Reset wizard on mount
  useEffect(() => {
    resetWizard()
  }, [])

  const handleBack = () => {
    if (currentStep === 1) {
      navigate({ to: '/creator' })
    } else {
      prevStep()
    }
  }

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      // Final step - create project
      if (!currentUser?.id) {
        toast.error('You must be logged in to create a project')
        return
      }
      setIsCreating(true)
      try {
        const project = await createProject(currentUser.id)
        if (project) {
          toast.success('Project created successfully!')
          navigate({ to: '/creator' })
        } else {
          toast.error('Please fix validation errors before continuing')
        }
      } finally {
        setIsCreating(false)
      }
    } else {
      nextStep()
    }
  }

  const handleStepClick = (step: number) => {
    // Only allow going to previous steps or adjacent step
    if (step < currentStep || step === currentStep + 1) {
      setWizardStep(step)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WizardModeSelector />
      case 2:
        return <ContentSetup />
      case 3:
        return <AIPersonaSetup />
      case 4:
        return <TeamSetup />
      case 5:
        return <TimelineSetup />
      case 6:
        return <VariableSessionBuilder />
      case 7:
        return <ReviewAndDeploy />
      default:
        return null
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/creator' })}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
        <p className="text-muted-foreground mt-1">
          Step {currentStep} of {totalSteps}: {WIZARD_STEPS[currentStep - 1]?.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="hidden lg:flex items-center justify-between w-full mb-8 overflow-x-auto py-2 px-2">
        {WIZARD_STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isClickable = step.id < currentStep || step.id === currentStep + 1

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  isClickable && !isCurrent && 'cursor-pointer hover:opacity-80',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    isCompleted && 'bg-green-600 text-white',
                    isCurrent && 'bg-cyan-600 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-background',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCurrent ? 'text-cyan-500' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < WIZARD_STEPS.length - 1 && null}
            </div>
          )
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
        {WIZARD_STEPS.map((step) => (
          <div
            key={step.id}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              currentStep === step.id && 'w-6 bg-cyan-500',
              currentStep > step.id && 'bg-green-500',
              currentStep < step.id && 'bg-border'
            )}
          />
        ))}
      </div>

      {/* Step Content */}
      <div
        className={cn(
          'bg-card border border-border rounded-xl p-6',
          isPersonalTeamStep ? 'min-h-[260px]' : 'min-h-[400px]'
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
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={isCreating}
          className={cn(
            currentStep === totalSteps
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
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
    </div>
  )
}
