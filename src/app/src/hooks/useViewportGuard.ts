import { useState, useEffect } from 'react'

const MIN_VIEWPORT_WIDTH = 1024

export function useViewportGuard() {
  const [isDesktop, setIsDesktop] = useState(true)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : MIN_VIEWPORT_WIDTH
  )

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      setIsDesktop(width >= MIN_VIEWPORT_WIDTH)
    }

    // Initial check
    checkViewport()

    // Listen for resize
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  return {
    isDesktop,
    viewportWidth,
    minWidth: MIN_VIEWPORT_WIDTH,
  }
}
