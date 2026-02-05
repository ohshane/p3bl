import { Minus, Plus, User, Users } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function TeamSetup() {
  const { wizardState, updateParticipantParams } = useCreatorStore()
  const { participantParams, validationErrors } = wizardState
  const minTeamSize = 2
  const maxTeamSize = 10

  const clampTeamSize = (value: number) => Math.min(maxTeamSize, Math.max(minTeamSize, value))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Team Formation</h2>
        <p className="text-muted-foreground">
          Choose how learners will work on this project
        </p>
      </div>

      {/* Project Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => updateParticipantParams({ projectMode: 'personal' })}
          className={cn(
            'p-6 rounded-xl border-2 text-left transition-all',
            participantParams.projectMode === 'personal'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-border bg-card hover:border-border/70'
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                participantParams.projectMode === 'personal'
                  ? 'bg-cyan-500/20 text-cyan-500'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Personal</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Each learner works individually on their own project.
          </p>
        </button>

        <button
          onClick={() => updateParticipantParams({ projectMode: 'team' })}
          className={cn(
            'p-6 rounded-xl border-2 text-left transition-all',
            participantParams.projectMode === 'team'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-border bg-card hover:border-border/70'
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                participantParams.projectMode === 'team'
                  ? 'bg-cyan-500/20 text-cyan-500'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Team</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Learners collaborate together in teams.
          </p>
        </button>
      </div>

      {/* Team Size Input - only shown when team mode is selected */}
      {participantParams.projectMode === 'team' && (
        <div className="py-8 px-6 bg-card rounded-xl border border-border">
          <label className="text-sm font-medium text-foreground mb-4 block text-center">
            Team Size <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() =>
                updateParticipantParams({
                  teamSize: clampTeamSize(participantParams.teamSize - 1),
                })
              }
              disabled={participantParams.teamSize <= minTeamSize}
              className="h-14 w-14"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <Input
              type="number"
              min={minTeamSize}
              max={maxTeamSize}
              value={participantParams.teamSize}
              onChange={(e) =>
                updateParticipantParams({
                  teamSize: clampTeamSize(parseInt(e.target.value, 10) || minTeamSize),
                })
              }
              className={cn(
                'bg-background border-border w-32 h-14 text-center text-2xl font-semibold',
                validationErrors.teamSize && 'border-red-500'
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={() =>
                updateParticipantParams({
                  teamSize: clampTeamSize(participantParams.teamSize + 1),
                })
              }
              disabled={participantParams.teamSize >= maxTeamSize}
              className="h-14 w-14"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <span className="text-muted-foreground text-base">members per team</span>
          </div>
          {validationErrors.teamSize && (
            <p className="text-xs text-red-400 mt-3 text-center">{validationErrors.teamSize}</p>
          )}
        </div>
      )}
    </div>
  )
}
