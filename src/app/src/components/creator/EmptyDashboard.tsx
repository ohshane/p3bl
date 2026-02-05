import { FolderPlus, Sparkles, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
}

export function EmptyDashboard({ onCreateProject }: EmptyDashboardProps) {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Project Design',
      description: 'Let AI help you create engaging project-based learning experiences from your lecture materials.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart Team Formation',
      description: 'Automatically create balanced teams or manually assign learners based on your preferences.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Real-Time Monitoring',
      description: 'Track learner progress, identify at-risk teams, and intervene proactively with AI assistance.',
    },
  ]

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <FolderPlus className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to Your Creator Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create your first project-based learning experience. Design engaging projects, 
          form teams, and guide learners through their educational journey.
        </p>
      </div>

      {/* Create Project CTA */}
      <div className="flex justify-center mb-12">
        <Button
          onClick={onCreateProject}
          size="lg"
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 py-6"
        >
          <FolderPlus className="w-5 h-5 mr-2" />
          Create Your First Project
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Getting Started Steps */}
      <div className="mt-12 bg-muted/40 border border-border rounded-xl p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
          Getting Started in 3 Steps
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
              1
            </div>
            <span className="text-muted-foreground">Create a project</span>
          </div>
          <div className="hidden md:block w-12 h-[2px] bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
              2
            </div>
            <span className="text-muted-foreground">Share the join code</span>
          </div>
          <div className="hidden md:block w-12 h-[2px] bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
              3
            </div>
            <span className="text-muted-foreground">Monitor & assess</span>
          </div>
        </div>
      </div>
    </div>
  )
}
