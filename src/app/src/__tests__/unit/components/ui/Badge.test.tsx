import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(<Badge>New</Badge>)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<Badge>Badge</Badge>)
      expect(screen.getByText('Badge')).toHaveAttribute('data-slot', 'badge')
    })

    it('applies custom className', () => {
      render(<Badge className="custom-badge">Badge</Badge>)
      expect(screen.getByText('Badge')).toHaveClass('custom-badge')
    })

    it('renders as span by default', () => {
      render(<Badge>Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge.tagName).toBe('SPAN')
    })
  })

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<Badge variant="default">Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toHaveAttribute('data-variant', 'default')
    })

    it('applies secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>)
      const badge = screen.getByText('Secondary')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('applies destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>)
      const badge = screen.getByText('Error')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('applies outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)
      const badge = screen.getByText('Outline')
      expect(badge).toHaveAttribute('data-variant', 'outline')
    })

    it('applies ghost variant', () => {
      render(<Badge variant="ghost">Ghost</Badge>)
      const badge = screen.getByText('Ghost')
      expect(badge).toHaveAttribute('data-variant', 'ghost')
    })

    it('applies link variant', () => {
      render(<Badge variant="link">Link</Badge>)
      const badge = screen.getByText('Link')
      expect(badge).toHaveAttribute('data-variant', 'link')
    })
  })

  describe('Styling', () => {
    it('has rounded-full class', () => {
      render(<Badge>Badge</Badge>)
      expect(screen.getByText('Badge')).toHaveClass('rounded-full')
    })

    it('has inline-flex class', () => {
      render(<Badge>Badge</Badge>)
      expect(screen.getByText('Badge')).toHaveClass('inline-flex')
    })

    it('has text-xs class', () => {
      render(<Badge>Badge</Badge>)
      expect(screen.getByText('Badge')).toHaveClass('text-xs')
    })
  })

  describe('asChild prop', () => {
    it('renders as a different element when asChild is true', () => {
      render(
        <Badge asChild>
          <a href="/notifications">5 new</a>
        </Badge>
      )
      const link = screen.getByRole('link', { name: /5 new/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/notifications')
    })
  })

  describe('Common use cases', () => {
    it('renders status badge', () => {
      render(<Badge variant="default">Active</Badge>)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders notification count badge', () => {
      render(<Badge variant="destructive">99+</Badge>)
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('renders with icons', () => {
      render(
        <Badge>
          <svg data-testid="icon" />
          <span>With Icon</span>
        </Badge>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })
  })
})
