import { useEffect } from 'react'
import { differenceInDays } from 'date-fns'
import {
  FileText,
  Bot,
  Users,
  Calendar,
  ListChecks,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { Badge } from '@/components/ui/badge'
import { cn, safeFormatDate, isValidDate } from '@/lib/utils'

export function ReviewAndDeploy() {
  const { wizardState, aiPersonas, validateWizard } = useCreatorStore()
  const {
    basicInfo,
    selectedAIPersonaIds,
    participantParams,
    timeline,
    sessions,
    isValid,
    validationErrors,
  } = wizardState

  // Run validation on mount and when wizard state changes
  useEffect(() => {
    validateWizard()
  }, [basicInfo, participantParams, timeline, sessions, validateWizard])

  const isValidProject = isValid

  const duration = isValidDate(timeline.startDate) && isValidDate(timeline.endDate)
    ? differenceInDays(new Date(timeline.endDate), new Date(timeline.startDate))
    : 0

  const selectedPersonas = aiPersonas.filter(p => selectedAIPersonaIds.includes(p.id))

  const sections = [
    {
      icon: FileText,
      title: 'Project Information',
      valid: !!basicInfo.title && !!basicInfo.drivingQuestion,
      content: (
        <div className="space-y-2">
          <div>
            <span className="text-muted-foreground">Title: </span>
            <span className="text-foreground">{basicInfo.title || <span className="text-red-500">Not set</span>}</span>
          </div>
          {basicInfo.background && (
            <div>
              <span className="text-muted-foreground">Background: </span>
              <span className="text-foreground line-clamp-2">{basicInfo.background}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Driving Question: </span>
            <span className="text-foreground">{basicInfo.drivingQuestion || <span className="text-red-500">Not set</span>}</span>
          </div>
        </div>
      ),
    },
    {
      icon: Bot,
      title: 'AI Personas',
      valid: true, // Optional
      content: (
        <div>
          {selectedPersonas.length === 0 ? (
            <span className="text-muted-foreground">No AI personas selected</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedPersonas.map(p => (
                <Badge key={p.id} variant="outline" className="border-border">
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      icon: Users,
      title: 'Team Formation',
      valid: participantParams.projectMode === 'personal' || participantParams.teamSize >= 2,
      content: (
        <div className="space-y-1">
          <div>
            <span className="text-muted-foreground">Mode: </span>
            <span className="text-foreground capitalize">{participantParams.projectMode}</span>
          </div>
          {participantParams.projectMode === 'team' && (
            <div>
              <span className="text-muted-foreground">Team Size: </span>
              <span className="text-foreground">{participantParams.teamSize} members</span>
            </div>
          )}
        </div>
      ),
    },
    {
      icon: Calendar,
      title: 'Timeline',
      valid: !!timeline.startDate && !!timeline.endDate,
      content: (
        <div className="space-y-1">
          <div>
            <span className="text-muted-foreground">Duration: </span>
            <span className="text-foreground">{duration} days</span>
          </div>
          {isValidDate(timeline.startDate) && (
            <div>
              <span className="text-muted-foreground">Start: </span>
              <span className="text-foreground">{safeFormatDate(timeline.startDate, 'MMM d, yyyy HH:mm')}</span>
            </div>
          )}
          {isValidDate(timeline.endDate) && (
            <div>
              <span className="text-muted-foreground">End: </span>
              <span className="text-foreground">{safeFormatDate(timeline.endDate, 'MMM d, yyyy HH:mm')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      icon: ListChecks,
      title: 'Sessions',
      valid: sessions.length > 0,
      content: (
        <div>
          {sessions.length === 0 ? (
            <span className="text-red-500">No sessions defined</span>
          ) : (
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">Total Sessions: </span>
                <span className="text-foreground">{sessions.length}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {sessions.map((s, i) => (
                  <Badge key={i} variant="outline" className="border-border text-xs">
                    {s.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Review & Deploy</h2>
        <p className="text-muted-foreground">
          Review your project configuration before creating it
        </p>
      </div>

      {/* Validation Status */}
      <div
        className={cn(
          'p-4 rounded-lg border',
          isValidProject
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        )}
      >
        <div className="flex items-center gap-3">
          {isValidProject ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">Your project is ready to be created!</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-medium">Please fix the following issues:</span>
            </>
          )}
        </div>
        {!isValidProject && Object.keys(validationErrors).length > 0 && (
          <ul className="mt-2 ml-8 list-disc text-sm text-red-500">
            {Object.entries(validationErrors).map(([key, error]) => (
              <li key={key}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, index) => {
          const Icon = section.icon

          return (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg border',
                section.valid
                  ? 'bg-card border-border'
                  : 'bg-red-500/5 border-red-500/30'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn('w-4 h-4', section.valid ? 'text-cyan-500' : 'text-red-500')} />
                <h3 className="font-medium text-foreground">{section.title}</h3>
                {section.valid ? (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
                )}
              </div>
              <div className="text-sm">{section.content}</div>
            </div>
          )
        })}
      </div>

      {/* Deploy Info */}
      <div className="p-4 bg-muted/40 rounded-lg border border-border">
        <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Your project will be created in <strong className="text-cyan-500">Draft</strong> status</li>
          <li>A unique join code will be generated for learners</li>
          <li>You can review and edit the project before activating it</li>
          <li>Activate the project when you're ready for learners to join</li>
        </ul>
      </div>
    </div>
  )
}
