import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders with children', () => {
      render(<Alert>Alert content</Alert>)
      expect(screen.getByText('Alert content')).toBeInTheDocument()
    })

    it('has alert role', () => {
      render(<Alert>Alert</Alert>)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<Alert>Alert</Alert>)
      expect(screen.getByRole('alert')).toHaveAttribute('data-slot', 'alert')
    })

    it('applies custom className', () => {
      render(<Alert className="custom-alert">Alert</Alert>)
      expect(screen.getByRole('alert')).toHaveClass('custom-alert')
    })

    it('has default styling', () => {
      render(<Alert>Alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('rounded-lg')
      expect(alert).toHaveClass('border')
    })
  })

  describe('Alert Variants', () => {
    it('applies default variant', () => {
      render(<Alert variant="default">Default</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-card')
    })

    it('applies destructive variant', () => {
      render(<Alert variant="destructive">Error</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-destructive')
    })
  })

  describe('AlertTitle', () => {
    it('renders title text', () => {
      render(<AlertTitle>Title</AlertTitle>)
      expect(screen.getByText('Title')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<AlertTitle>Title</AlertTitle>)
      expect(screen.getByText('Title')).toHaveAttribute('data-slot', 'alert-title')
    })

    it('has font-medium styling', () => {
      render(<AlertTitle>Title</AlertTitle>)
      expect(screen.getByText('Title')).toHaveClass('font-medium')
    })

    it('applies custom className', () => {
      render(<AlertTitle className="custom-title">Title</AlertTitle>)
      expect(screen.getByText('Title')).toHaveClass('custom-title')
    })
  })

  describe('AlertDescription', () => {
    it('renders description text', () => {
      render(<AlertDescription>Description text</AlertDescription>)
      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<AlertDescription>Description</AlertDescription>)
      expect(screen.getByText('Description')).toHaveAttribute('data-slot', 'alert-description')
    })

    it('has muted foreground styling', () => {
      render(<AlertDescription>Description</AlertDescription>)
      expect(screen.getByText('Description')).toHaveClass('text-muted-foreground')
    })

    it('applies custom className', () => {
      render(<AlertDescription className="custom-desc">Description</AlertDescription>)
      expect(screen.getByText('Description')).toHaveClass('custom-desc')
    })
  })

  describe('Full Alert Composition', () => {
    it('renders a complete alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the CLI.
          </AlertDescription>
        </Alert>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Heads up!')).toBeInTheDocument()
      expect(screen.getByText(/You can add components/)).toBeInTheDocument()
    })

    it('renders destructive alert with icon', () => {
      render(
        <Alert variant="destructive">
          <svg data-testid="error-icon" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Your session has expired. Please log in again.
          </AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('text-destructive')
      expect(screen.getByTestId('error-icon')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText(/session has expired/)).toBeInTheDocument()
    })

    it('renders info alert', () => {
      render(
        <Alert variant="default">
          <svg data-testid="info-icon" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            This is an informational message.
          </AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Information')).toBeInTheDocument()
      expect(screen.getByText(/informational message/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper alert role for screen readers', () => {
      render(
        <Alert>
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>Please read this message.</AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('alert content is readable by screen readers', () => {
      render(
        <Alert>
          <AlertTitle>System Update</AlertTitle>
          <AlertDescription>A new version is available.</AlertDescription>
        </Alert>
      )

      // The content should be accessible
      expect(screen.getByText('System Update')).toBeVisible()
      expect(screen.getByText('A new version is available.')).toBeVisible()
    })
  })
})
