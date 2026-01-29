"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResumeViewerProps {
  resumeUrl: string | null;
  resumeFilename?: string | null;
  className?: string;
}

export function ResumeViewer({
  resumeUrl,
  resumeFilename,
  className,
}: ResumeViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [viewerError, setViewerError] = useState(false);

  if (!resumeUrl) {
    return (
      <Card className={cn("p-12 text-center", className)}>
        <div className="flex flex-col items-center gap-3">
          <FileText className="size-12 text-muted-foreground opacity-20" />
          <div>
            <p className="font-medium">Nenhum currículo anexado</p>
            <p className="text-sm text-muted-foreground">
              O candidato ainda não enviou um currículo
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isPDF = resumeUrl.toLowerCase().endsWith(".pdf");
  const isDoc = resumeUrl.toLowerCase().match(/\.(doc|docx)$/);
  const canEmbed = isPDF && !viewerError;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {resumeFilename || "Currículo"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canEmbed && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="min-w-[60px] text-center text-sm">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="size-4" />
              </Button>
              <div className="mx-2 h-6 w-px bg-border" />
            </>
          )}

          <Button variant="outline" size="sm" asChild>
            <Link href={resumeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Abrir em nova aba
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <a href={resumeUrl} download={resumeFilename || "curriculo.pdf"}>
              <Download className="mr-2 size-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <Card className="overflow-hidden">
        {canEmbed ? (
          <div className="relative bg-gray-100 dark:bg-gray-900">
            <iframe
              src={`${resumeUrl}#toolbar=0`}
              className="w-full"
              style={{
                height: "800px",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                width: `${(100 / zoom) * 100}%`,
              }}
              onError={() => setViewerError(true)}
              title="Visualizador de Currículo"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <AlertCircle className="size-12 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {viewerError
                  ? "Não foi possível carregar o currículo"
                  : "Visualização não disponível"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isDoc
                  ? "Arquivos Word não podem ser visualizados diretamente. Use o botão abaixo para fazer o download."
                  : "Use os botões acima para abrir em uma nova aba ou fazer download."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 size-4" />
                  Abrir em nova aba
                </Link>
              </Button>
              <Button asChild>
                <a href={resumeUrl} download={resumeFilename || "curriculo"}>
                  <Download className="mr-2 size-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        Dica: Use Ctrl+F (Cmd+F no Mac) para buscar palavras-chave no currículo
      </p>
    </div>
  );
}
