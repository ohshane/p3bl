import { Monitor } from 'lucide-react'

interface MobileBlockerProps {
  minWidth: number
}

export function MobileBlocker({ minWidth }: MobileBlockerProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Logo placeholder */}
        <div className="mb-8 flex justify-center">
          <img 
            src="/android-chrome-192x192.png" 
            alt="Peabee" 
            className="w-20 h-20 rounded-2xl"
          />
        </div>
        
        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Peabee works best on desktop
        </h1>
        
        <p className="text-gray-400 mb-6">
          Please switch to a device with a larger screen for the full experience.
        </p>
        
        {/* Desktop icon */}
        <div className="flex justify-center mb-6">
          <Monitor className="w-16 h-16 text-gray-500" />
        </div>
        
        {/* Minimum width info */}
        <p className="text-sm text-gray-500">
          Minimum screen width: {minWidth}px
        </p>
      </div>
    </div>
  )
}
