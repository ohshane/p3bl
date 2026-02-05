import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Compass, Users, Trophy, Sparkles, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'admin') {
        navigate({ to: '/admin' })
      } else if (currentUser.role === 'creator' || currentUser.role === 'pioneer') {
        navigate({ to: '/creator' })
      } else {
        navigate({ to: '/explorer' })
      }
    }
  }, [isAuthenticated, currentUser, navigate])

  const features = [
    {
      icon: <Compass className="w-8 h-8" />,
      title: 'Guided Learning Journey',
      description: 'Navigate through structured sessions with AI-powered assistance at every step.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Collaboration',
      description: 'Work together with peers and AI personas in dynamic group discussions.',
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Track Your Growth',
      description: 'Earn badges, level up, and build a portfolio that showcases your competencies.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Feedback',
      description: 'Get instant, rubric-aligned feedback to improve your work before submission.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="relative max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Peabee" 
              className="w-20 h-20 rounded-2xl shadow-lg shadow-cyan-500/25"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Project-Based Learning,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join collaborative projects, work with AI teammates, and build real skills 
            that matter. Your learning journey starts here.
          </p>

          {/* Auth Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-lg px-8 py-6 h-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/10 text-lg px-8 py-6 h-auto"
              >
                Sign In
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Free to join as an Explorer. Creators and admins are invited.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything you need to succeed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl border border-slate-700 p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start learning?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Create your free account and join thousands of learners building real-world skills through collaborative projects.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Peabee - Project-Based Learning Platform</p>
        </div>
      </footer>
    </div>
  )
}
