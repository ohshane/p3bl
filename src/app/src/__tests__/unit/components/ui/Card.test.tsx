import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Card className="custom-card">Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveClass('custom-card')
    })

    it('has data-slot attribute', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveAttribute('data-slot', 'card')
    })

    it('has default styling classes', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveClass('rounded-xl')
      expect(card).toHaveClass('shadow-sm')
    })
  })

  describe('CardHeader', () => {
    it('renders with children', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<CardHeader>Header</CardHeader>)
      expect(screen.getByText('Header')).toHaveAttribute('data-slot', 'card-header')
    })

    it('applies custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>)
      expect(screen.getByText('Header')).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders title text', () => {
      render(<CardTitle>My Title</CardTitle>)
      expect(screen.getByText('My Title')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<CardTitle>Title</CardTitle>)
      expect(screen.getByText('Title')).toHaveAttribute('data-slot', 'card-title')
    })

    it('has font-semibold class', () => {
      render(<CardTitle>Title</CardTitle>)
      expect(screen.getByText('Title')).toHaveClass('font-semibold')
    })
  })

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(<CardDescription>My description</CardDescription>)
      expect(screen.getByText('My description')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<CardDescription>Description</CardDescription>)
      expect(screen.getByText('Description')).toHaveAttribute('data-slot', 'card-description')
    })

    it('has muted text styling', () => {
      render(<CardDescription>Description</CardDescription>)
      expect(screen.getByText('Description')).toHaveClass('text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('renders content', () => {
      render(<CardContent>Main content</CardContent>)
      expect(screen.getByText('Main content')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<CardContent>Content</CardContent>)
      expect(screen.getByText('Content')).toHaveAttribute('data-slot', 'card-content')
    })

    it('has padding classes', () => {
      render(<CardContent>Content</CardContent>)
      expect(screen.getByText('Content')).toHaveClass('px-6')
    })
  })

  describe('CardFooter', () => {
    it('renders footer content', () => {
      render(<CardFooter>Footer content</CardFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<CardFooter>Footer</CardFooter>)
      expect(screen.getByText('Footer')).toHaveAttribute('data-slot', 'card-footer')
    })

    it('has flex styling', () => {
      render(<CardFooter>Footer</CardFooter>)
      expect(screen.getByText('Footer')).toHaveClass('flex')
    })
  })

  describe('CardAction', () => {
    it('renders action content', () => {
      render(<CardAction>Action button</CardAction>)
      expect(screen.getByText('Action button')).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      render(<CardAction>Action</CardAction>)
      expect(screen.getByText('Action')).toHaveAttribute('data-slot', 'card-action')
    })
  })

  describe('Full Card Composition', () => {
    it('renders a complete card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Project Title</CardTitle>
            <CardDescription>Project description goes here</CardDescription>
            <CardAction>
              <button>Edit</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Main content of the card</p>
          </CardContent>
          <CardFooter>
            <button>Save</button>
            <button>Cancel</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Project Title')).toBeInTheDocument()
      expect(screen.getByText('Project description goes here')).toBeInTheDocument()
      expect(screen.getByText('Main content of the card')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })
  })
})
