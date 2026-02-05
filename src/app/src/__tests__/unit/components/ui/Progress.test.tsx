import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Progress value={50} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<Progress value={50} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('data-slot', 'progress')
    })

    it('applies custom className', () => {
      render(<Progress value={50} className="custom-progress" />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveClass('custom-progress')
    })

    it('has default styling', () => {
      render(<Progress value={50} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveClass('rounded-full')
      expect(progress).toHaveClass('overflow-hidden')
    })
  })

  describe('Value handling', () => {
    it('handles 0% value', () => {
      render(<Progress value={0} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
    })

    it('handles 50% value', () => {
      render(<Progress value={50} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
    })

    it('handles 100% value', () => {
      render(<Progress value={100} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
    })

    it('handles undefined value (defaults to 0)', () => {
      render(<Progress value={undefined} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has progressbar role', () => {
      render(<Progress value={75} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('accepts aria-label', () => {
      render(<Progress value={75} aria-label="Loading progress" />)
      const progress = screen.getByRole('progressbar', { name: 'Loading progress' })
      expect(progress).toBeInTheDocument()
    })

    it('accepts aria-valuemin', () => {
      render(<Progress value={50} aria-valuemin={0} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-valuemin', '0')
    })

    it('accepts aria-valuemax', () => {
      render(<Progress value={50} aria-valuemax={100} />)
      const progress = screen.getByRole('progressbar')
      expect(progress).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Visual indicator', () => {
    it('renders progress indicator child', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')
      expect(indicator).toBeInTheDocument()
    })

    it('indicator has transition styling', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')
      expect(indicator).toHaveClass('transition-all')
    })
  })
})
