import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getRoleBasedHomePath } from '@/lib/authRedirect'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Compass, 
  Users, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  Target,
  MessageSquare,
  GraduationCap
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      navigate({ to: getRoleBasedHomePath(currentUser.role) })
    }
  }, [isAuthenticated, currentUser, navigate])

  const features = [
    {
      icon: <Compass className="w-5 h-5" />,
      title: 'Structured Sessions',
      description: 'Follow guided learning paths designed by educators with built-in AI assistance.',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Team Collaboration',
      description: 'Work with peers and AI personas in group discussions and project work.',
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: 'Progress Tracking',
      description: 'Earn badges, track competencies, and build a portfolio of completed work.',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'AI Feedback',
      description: 'Get rubric-aligned feedback to improve submissions before final review.',
    },
  ]

  const steps = [
    {
      number: '1',
      icon: <Target className="w-5 h-5" />,
      title: 'Join a Project',
      description: 'Browse and enroll in projects that match your learning goals.',
    },
    {
      number: '2',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Complete Sessions',
      description: 'Work through structured sessions with your team and AI guidance.',
    },
    {
      number: '3',
      icon: <GraduationCap className="w-5 h-5" />,
      title: 'Demonstrate Skills',
      description: 'Submit work, receive feedback, and earn recognition for competencies.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Peabee" 
              className="w-20 h-20 rounded-2xl shadow-sm"
            />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Project-Based Learning Platform
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Collaborative projects with AI-powered feedback. Join teams, complete structured sessions, and build demonstrable skills.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Free for Explorers. Creators and admins are invited.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">Features</Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              What you get
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              Three steps to get started
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="bg-card border-border text-center">
                <CardContent className="pt-6">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground mx-auto mb-4">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground mb-6">
                Create an account and join your first project.
              </p>
              <Link to="/signup">
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  Create Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Peabee" 
              className="w-6 h-6 rounded"
            />
            <span className="text-sm text-muted-foreground">Peabee</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Link to="/signin" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
