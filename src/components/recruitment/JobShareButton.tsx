"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { Share2, Link2, MessageCircle } from "lucide-react"
import { useState } from "react"

interface JobShareButtonProps {
  jobId: string
  jobTitle: string
}

export function JobShareButton({ jobId, jobTitle }: JobShareButtonProps) {
  const [open, setOpen] = useState(false)

  const jobUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/vagas/${jobId}`
    : ''

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl)
      toast.success("Link copiado para a área de transferência!")
      setOpen(false)
    } catch (error) {
      toast.error("Não foi possível copiar o link.")
    }
  }

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`
    window.open(url, '_blank', 'width=600,height=600')
    setOpen(false)
  }

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Confira esta vaga: ${jobTitle}\n${jobUrl}`)
    const url = `https://wa.me/?text=${text}`
    window.open(url, '_blank')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium mb-3">Compartilhar vaga</p>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={copyToClipboard}
          >
            <Link2 className="h-4 w-4" />
            Copiar link
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={shareOnLinkedIn}
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={shareOnWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
