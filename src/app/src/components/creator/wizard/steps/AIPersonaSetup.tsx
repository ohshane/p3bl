import { Check } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function AIPersonaSetup() {
  const { wizardState, aiPersonas, setSelectedAIPersonas } = useCreatorStore()
  const { selectedAIPersonaIds } = wizardState

  const togglePersona = (personaId: string) => {
    if (selectedAIPersonaIds.includes(personaId)) {
      setSelectedAIPersonas(selectedAIPersonaIds.filter(id => id !== personaId))
    } else {
      setSelectedAIPersonas([...selectedAIPersonaIds, personaId])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">AI Classmate Setup</h2>
        <p className="text-muted-foreground">
          Select AI personas to assist teams throughout the project. They will participate in group chat and provide guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiPersonas.map((persona) => {
          const isSelected = selectedAIPersonaIds.includes(persona.id)

          return (
            <button
              key={persona.id}
              onClick={() => togglePersona(persona.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-border bg-card hover:border-border/70'
              )}
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    {persona.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{persona.name}</h3>
                  <p className="text-sm text-muted-foreground">{persona.role}</p>
                  <p className="text-sm text-muted-foreground mt-2">{persona.personality}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {persona.expertise.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-border text-muted-foreground"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection indicator */}
              <div
                className={cn(
                  'absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500'
                    : 'border-border'
                )}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>
          )
        })}
      </div>

      {selectedAIPersonaIds.length === 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-500">
            Consider selecting at least one AI persona to help guide teams through the project.
          </p>
        </div>
      )}

      {selectedAIPersonaIds.length > 0 && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-sm text-cyan-500">
            {selectedAIPersonaIds.length} AI persona(s) selected. They will automatically participate in team discussions and provide assistance.
          </p>
        </div>
      )}
    </div>
  )
}
