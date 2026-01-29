"use client"

import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Integração com serviço de chat
      console.log('Mensagem enviada:', message)
      setMessage('')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Abrir chat de suporte</span>
        </Button>
      ) : (
        <Card className="w-80 shadow-2xl">
          <CardHeader className="bg-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Suporte RH</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-purple-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-purple-100">
              Estamos online para ajudar você
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="h-64 overflow-y-auto space-y-3">
              <div className="flex gap-2">
                <div className="rounded-lg bg-purple-100 px-3 py-2 text-sm">
                  Olá! Como posso ajudar você hoje?
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage()
                  }
                }}
              />
              <Button
                size="icon"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
