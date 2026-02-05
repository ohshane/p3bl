import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle,
  X,
  Bot,
  Loader2,
} from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, safeFormatDate } from '@/lib/utils'

interface SignalRiskCenterProps {
  projectId: string
}

export function SignalRiskCenter({ projectId }: SignalRiskCenterProps) {
  const { currentUser } = useAuthStore()
  const { 
    getProject, 
    getProjectInterventions, 
    fetchInterventions,
    proposeIntervention, 
    approveIntervention, 
    rejectIntervention,
  } = useCreatorStore()
  
  const project = getProject(projectId)
  const interventions = getProjectInterventions(projectId)

  const [showInterventionDialog, setShowInterventionDialog] = useState(false)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [interventionMessage, setInterventionMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch interventions on mount
  useEffect(() => {
    fetchInterventions(projectId)
  }, [projectId, fetchInterventions])

  if (!project) return null

  const riskTeams = project.teams.filter(t => t.riskLevel === 'red' || t.riskLevel === 'yellow')

  const handleProposeIntervention = async () => {
    if (selectedTeamIds.length === 0 || !interventionMessage.trim()) return
    
    setIsSubmitting(true)
    try {
      await proposeIntervention(projectId, {
        timestamp: new Date().toISOString(),
        type: 'proactive',
        description: interventionMessage,
        targetTeamIds: selectedTeamIds,
      }, currentUser?.id)
      
      setShowInterventionDialog(false)
      setSelectedTeamIds([])
      setInterventionMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveIntervention = async (interventionId: string) => {
    await approveIntervention(interventionId)
  }

  const handleRejectIntervention = async (interventionId: string) => {
    await rejectIntervention(interventionId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Signal & Risk Center</h2>
        <Button
          onClick={() => setShowInterventionDialog(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          disabled={riskTeams.length === 0}
        >
          <Zap className="w-4 h-4 mr-2" />
          AI Intervention
        </Button>
      </div>

      {/* Traffic Light Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">On Track</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {project.teams.filter(t => t.riskLevel === 'green').length}
          </div>
          <div className="text-sm text-muted-foreground">teams</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Needs Attention</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {project.teams.filter(t => t.riskLevel === 'yellow').length}
          </div>
          <div className="text-sm text-muted-foreground">teams</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">At Risk</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {project.teams.filter(t => t.riskLevel === 'red').length}
          </div>
          <div className="text-sm text-muted-foreground">teams</div>
        </div>
      </div>

      {/* Risk Team List */}
      {riskTeams.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Teams Requiring Attention</h3>
          {riskTeams.map((team) => (
            <div
              key={team.id}
              className={cn(
                'p-4 rounded-lg border',
                team.riskLevel === 'yellow'
                  ? 'bg-yellow-500/5 border-yellow-500/30'
                  : 'bg-red-500/5 border-red-500/30'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      team.riskLevel === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                  />
                  <div>
                    <h4 className="font-medium text-foreground">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">{team.memberIds.length} members</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    team.riskLevel === 'yellow'
                      ? 'border-yellow-500/50 text-yellow-500'
                      : 'border-red-500/50 text-red-500'
                  )}
                >
                  {team.riskLevel === 'yellow' ? 'Warning' : 'Critical'}
                </Badge>
              </div>
              
              {team.riskReason && (
                <div className="mt-3 p-2 bg-muted/50 rounded flex items-center gap-2 border border-border">
                  <AlertTriangle className={cn(
                    'w-4 h-4',
                    team.riskLevel === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                  )} />
                  <span className="text-sm text-muted-foreground">{team.riskReason}</span>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last activity: {safeFormatDate(team.lastActivityAt, 'MMM d, h:mm a', 'Unknown')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-green-500/5 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
          <h3 className="text-lg font-medium text-foreground">All Teams On Track</h3>
          <p className="text-sm text-muted-foreground">No immediate risks detected</p>
        </div>
      )}

      {/* AI Intervention History */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Intervention History</h3>
        {interventions.length === 0 ? (
          <div className="text-center py-6 bg-muted/40 rounded-lg border border-border">
            <Bot className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No interventions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interventions.map((intervention) => (
              <div
                key={intervention.id}
                className="p-4 bg-card rounded-lg border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={cn(
                      'w-4 h-4',
                      intervention.status === 'approved' ? 'text-green-500' :
                      intervention.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                    )} />
                    <span className="text-sm text-foreground capitalize">{intervention.type} Intervention</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      intervention.status === 'approved' ? 'border-green-500/50 text-green-500' :
                      intervention.status === 'rejected' ? 'border-red-500/50 text-red-500' :
                      intervention.status === 'executed' ? 'border-blue-500/50 text-blue-500' :
                      'border-yellow-500/50 text-yellow-500'
                    )}
                  >
                    {intervention.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{intervention.description}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  {safeFormatDate(intervention.timestamp, 'MMM d, yyyy h:mm a', 'Unknown')}
                </div>
                
                {intervention.status === 'proposed' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleApproveIntervention(intervention.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectIntervention(intervention.id)}
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intervention Dialog */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Propose AI Intervention</DialogTitle>
            <DialogDescription>
              Send a supportive message to selected teams through the AI assistant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select Teams</label>
              <div className="flex flex-wrap gap-2">
                {riskTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (selectedTeamIds.includes(team.id)) {
                        setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id))
                      } else {
                        setSelectedTeamIds([...selectedTeamIds, team.id])
                      }
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full border text-sm transition-all',
                      selectedTeamIds.includes(team.id)
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-500'
                        : 'border-border text-muted-foreground hover:border-border/70'
                    )}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Intervention Message</label>
              <Textarea
                value={interventionMessage}
                onChange={(e) => setInterventionMessage(e.target.value)}
                placeholder="The AI will send this supportive message to the selected teams..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInterventionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProposeIntervention}
              disabled={selectedTeamIds.length === 0 || !interventionMessage.trim() || isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Propose Intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
