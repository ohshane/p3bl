import { useEffect, useState } from 'react'
import { toDataURL } from 'qrcode'
import { Copy, QrCode, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { useCreatorStore } from '@/stores/creatorStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface JoinCodeProps {
  joinCode: string
  projectId: string
  creatorId: string
  projectName: string
  onRegenerate?: () => void
  size?: 'sm' | 'lg'
}

export function JoinCode({
  joinCode,
  projectId,
  creatorId,
  projectName,
  onRegenerate,
  size = 'sm',
}: JoinCodeProps) {
  const { regenerateJoinCode } = useCreatorStore()

  const [showQRDialog, setShowQRDialog] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  // Build join URL for QR code
  const baseUrl = (
    import.meta.env.VITE_BASE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '')
  const joinPath = `/explorer?joinCode=${encodeURIComponent(joinCode)}`
  const joinUrl = baseUrl
    ? `${baseUrl}/signin?redirect_uri=${encodeURIComponent(joinPath)}`
    : ''

  // Generate QR code when dialog opens
  useEffect(() => {
    if (!showQRDialog) {
      setQrCodeUrl(null)
      return
    }

    if (!joinUrl) {
      setQrCodeUrl(null)
      return
    }

    let isActive = true

    toDataURL(joinUrl, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isActive) {
          setQrCodeUrl(url)
        }
      })
      .catch(() => {
        if (isActive) {
          setQrCodeUrl(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [showQRDialog, joinUrl])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode)
    toast.success('Join code copied to clipboard')
  }

  const handleRegenerateCode = async () => {
    const newCode = await regenerateJoinCode(projectId, creatorId)
    if (newCode) {
      toast.success('Join code regenerated')
      onRegenerate?.()
    } else {
      toast.error('Failed to regenerate join code')
    }
  }

  const isLarge = size === 'lg'
  const iconSize = isLarge ? 'w-5 h-5' : 'w-4 h-4'
  const buttonSize = isLarge ? 'h-9 w-9' : 'h-8 w-8'
  const codeSize = isLarge ? 'text-2xl' : 'text-lg'
  const padding = isLarge ? 'p-4' : 'p-3'

  return (
    <>
      <div className={`bg-muted/50 rounded-lg ${padding}`}>
        <div className="flex items-center justify-between">
          <div>
            {!isLarge && (
              <span className="text-xs text-muted-foreground">Join Code</span>
            )}
            <div className={`font-mono ${codeSize} font-bold text-cyan-400`}>
              {joinCode}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCode}
              className={`${buttonSize} text-muted-foreground hover:text-foreground`}
            >
              <Copy className={iconSize} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQRDialog(true)}
              className={`${buttonSize} text-muted-foreground hover:text-foreground`}
            >
              <QrCode className={iconSize} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerateCode}
              className={`${buttonSize} text-muted-foreground hover:text-foreground`}
            >
              <RefreshCw className={iconSize} />
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent
          className="bg-card border-border sm:max-w-2xl"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code with explorers to join the project
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="w-64 h-64 bg-background rounded-lg flex items-center justify-center border border-border">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`Join ${projectName}`}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <QrCode className="w-44 h-44 text-muted-foreground" />
              )}
            </div>
            <p className="mt-5 font-mono text-3xl font-bold text-cyan-400">
              {joinCode}
            </p>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </>
  )
}
