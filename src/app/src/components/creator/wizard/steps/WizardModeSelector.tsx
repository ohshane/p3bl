import { FileText, Wand2, Upload } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { cn } from '@/lib/utils'
import type { WizardMode } from '@/types'

const WIZARD_MODES = [
  {
    id: 'manual' as WizardMode,
    icon: FileText,
    title: 'Manual Builder',
    description: 'Create your project from scratch with full control over every detail.',
    recommended: false,
  },
  {
    id: 'keyword' as WizardMode,
    icon: Wand2,
    title: 'Keyword Generator',
    description: 'Enter keywords and let AI generate a project structure for you.',
    recommended: true,
  },
  {
    id: 'document' as WizardMode,
    icon: Upload,
    title: 'Document-Driven',
    description: 'Upload your syllabus or lecture materials and AI will auto-generate a project.',
    recommended: false,
  },
]

export function WizardModeSelector() {
  const { wizardState, setWizardMode } = useCreatorStore()
  const { mode } = wizardState

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          How would you like to create your project?
        </h2>
        <p className="text-muted-foreground">
          Choose a creation mode that fits your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {WIZARD_MODES.map((option) => {
          const Icon = option.icon
          const isSelected = mode === option.id

          return (
            <button
              key={option.id}
              onClick={() => setWizardMode(option.id)}
              className={cn(
                'relative p-6 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-border bg-card hover:border-border/70'
              )}
            >
              {option.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-600 text-white text-xs rounded-full">
                  Recommended
                </span>
              )}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                  isSelected ? 'bg-cyan-500/20 text-cyan-500' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{option.title}</h3>
              <p className="text-sm text-muted-foreground">{option.description}</p>
              
              {/* Selection indicator */}
              <div
                className={cn(
                  'absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500'
                    : 'border-border'
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {mode === 'keyword' && (
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-sm text-cyan-500">
            <Wand2 className="w-4 h-4 inline mr-2" />
            AI will help you generate a project structure based on keywords you provide in the next step.
          </p>
        </div>
      )}

      {mode === 'document' && (
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-sm text-cyan-500">
            <Upload className="w-4 h-4 inline mr-2" />
            Upload your syllabus, lecture notes, or other materials in the next step. AI will extract goals, schedules, and assignments.
          </p>
        </div>
      )}
    </div>
  )
}
