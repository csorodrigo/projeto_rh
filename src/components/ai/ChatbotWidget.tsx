'use client'

/**
 * Chatbot Widget
 * Widget flutuante no canto inferior direito
 */

import { useState } from 'react'
import { MessageCircle, X, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChatInterface } from './ChatInterface'
import { cn } from '@/lib/utils'

interface ChatbotWidgetProps {
  className?: string
}

export function ChatbotWidget({ className }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
    setUnreadCount(0)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50',
          className
        )}
      >
        <Button
          size="lg"
          onClick={handleOpen}
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Abrir assistente virtual"
        >
          <MessageCircle className="h-6 w-6" />

          {/* Notification Badge */}
          {hasUnread && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}

          {/* Pulse Animation */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary" />
          )}
        </Button>
      </div>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[700px] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Assistente Virtual RH</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Como posso ajudar você hoje?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span className="sr-only">Minimizar</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ChatInterface onNewMessage={() => setHasUnread(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
