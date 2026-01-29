/**
 * Zoom Controls Component
 * Controls for zooming and panning the org chart
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFitView: () => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  currentZoom?: number
}

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitView,
  onToggleFullscreen,
  isFullscreen = false,
  currentZoom = 1,
}: ZoomControlsProps) {
  const zoomPercentage = Math.round(currentZoom * 100)

  return (
    <Card className="fixed bottom-6 right-6 z-10 p-2 flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={onZoomOut}
        title="Zoom Out (Ctrl + -)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="text-xs font-medium min-w-[3rem] text-center">
        {zoomPercentage}%
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={onZoomIn}
        title="Zoom In (Ctrl + +)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        size="icon"
        variant="ghost"
        onClick={onZoomReset}
        title="Reset Zoom (Ctrl + 0)"
      >
        1:1
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onFitView}
        title="Fit to Screen (Ctrl + F)"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {onToggleFullscreen && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F11)'}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </>
      )}
    </Card>
  )
}
