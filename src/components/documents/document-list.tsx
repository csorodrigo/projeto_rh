"use client"

import * as React from "react"
import {
  FileText,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileImage,
  File,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getEmployeeDocuments,
  deleteEmployeeDocument,
  updateDocumentStatus,
} from "@/lib/supabase/queries"
import type { EmployeeDocument, DocumentType, DocumentStatus } from "@/types/database"
import { formatDate } from "@/lib/utils"
import { DocumentUploadDialog } from "./document-upload-dialog"

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  rg: "RG",
  cpf: "CPF",
  cnh: "CNH",
  titulo_eleitor: "Titulo de Eleitor",
  reservista: "Certificado de Reservista",
  certidao_nascimento: "Certidao de Nascimento",
  certidao_casamento: "Certidao de Casamento",
  comprovante_residencia: "Comprovante de Residencia",
  foto_3x4: "Foto 3x4",
  ctps: "CTPS",
  pis: "PIS/PASEP",
  contrato_trabalho: "Contrato de Trabalho",
  aditivo_contrato: "Aditivo de Contrato",
  termo_rescisao: "Termo de Rescisao",
  aviso_previo: "Aviso Previo",
  aso_admissional: "ASO Admissional",
  ficha_registro: "Ficha de Registro",
  declaracao_dependentes: "Declaracao de Dependentes",
  opcao_vale_transporte: "Opcao Vale Transporte",
  diploma: "Diploma",
  certificado: "Certificado",
  historico_escolar: "Historico Escolar",
  atestado_medico: "Atestado Medico",
  laudo_medico: "Laudo Medico",
  aso_periodico: "ASO Periodico",
  aso_demissional: "ASO Demissional",
  outros: "Outros",
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }
> = {
  pending: { label: "Pendente", variant: "outline", icon: Clock },
  approved: { label: "Aprovado", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle },
  expired: { label: "Expirado", variant: "secondary", icon: AlertTriangle },
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File
  if (fileType.startsWith("image/")) return FileImage
  if (fileType === "application/pdf") return FileText
  return File
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function DocumentListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-6 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  )
}

interface DocumentListProps {
  employeeId: string
  companyId: string
}

export function DocumentList({ employeeId, companyId }: DocumentListProps) {
  const [documents, setDocuments] = React.useState<EmployeeDocument[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [documentToDelete, setDocumentToDelete] = React.useState<EmployeeDocument | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getEmployeeDocuments(employeeId)
      if (result.error) {
        setError(result.error.message)
        return
      }

      setDocuments(result.data || [])
    } catch (err) {
      setError("Erro ao carregar documentos")
    } finally {
      setIsLoading(false)
    }
  }, [employeeId])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDelete = async () => {
    if (!documentToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteEmployeeDocument(documentToDelete.id)
      if (result.error) {
        toast.error("Erro ao excluir documento")
        return
      }

      toast.success("Documento excluido com sucesso")
      fetchDocuments()
    } catch (err) {
      toast.error("Erro ao excluir documento")
    } finally {
      setIsDeleting(false)
      setDocumentToDelete(null)
    }
  }

  const handleStatusChange = async (documentId: string, status: "approved" | "rejected") => {
    try {
      const result = await updateDocumentStatus(documentId, status)
      if (result.error) {
        toast.error("Erro ao atualizar status")
        return
      }

      toast.success(`Documento ${status === "approved" ? "aprovado" : "rejeitado"}`)
      fetchDocuments()
    } catch (err) {
      toast.error("Erro ao atualizar status")
    }
  }

  const handleDownload = (doc: EmployeeDocument) => {
    window.open(doc.file_url, "_blank")
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-lg font-medium mb-2">Erro ao carregar documentos</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDocuments}>Tentar novamente</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-[150px] mt-1" />
                ) : (
                  `${documents.length} documento(s) cadastrado(s)`
                )}
              </CardDescription>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="mr-2 size-4" />
              Novo Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DocumentListSkeleton />
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum documento</p>
              <p className="text-muted-foreground mb-4">
                Comece adicionando o primeiro documento deste funcionario
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="mr-2 size-4" />
                Adicionar Documento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const FileIcon = getFileIcon(doc.file_type)
                  const statusConfig = STATUS_CONFIG[doc.status]
                  const StatusIcon = statusConfig.icon
                  const isExpiringSoon =
                    doc.expires_at &&
                    new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                    new Date(doc.expires_at) > new Date()
                  const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date()

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <FileIcon className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground">{doc.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="gap-1">
                          <StatusIcon className="size-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.expires_at ? (
                          <div className="flex items-center gap-1">
                            {isExpired ? (
                              <AlertTriangle className="size-4 text-destructive" />
                            ) : isExpiringSoon ? (
                              <AlertTriangle className="size-4 text-yellow-500" />
                            ) : null}
                            <span
                              className={
                                isExpired
                                  ? "text-destructive"
                                  : isExpiringSoon
                                  ? "text-yellow-600"
                                  : ""
                              }
                            >
                              {formatDate(doc.expires_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acoes</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Eye className="mr-2 size-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="mr-2 size-4" />
                              Baixar
                            </DropdownMenuItem>
                            {doc.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(doc.id, "approved")}
                                >
                                  <CheckCircle className="mr-2 size-4 text-green-600" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(doc.id, "rejected")}
                                >
                                  <XCircle className="mr-2 size-4 text-destructive" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDocumentToDelete(doc)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        employeeId={employeeId}
        companyId={companyId}
        onSuccess={fetchDocuments}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento{" "}
              <strong>{documentToDelete?.file_name}</strong>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
