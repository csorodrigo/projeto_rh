"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload, FileText, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  uploadDocumentToStorage,
  createEmployeeDocument,
  getCurrentProfile,
} from "@/lib/supabase/queries"
import type { DocumentType } from "@/types/database"

const DOCUMENT_TYPES: { value: DocumentType; label: string; category: string }[] = [
  // Documentos pessoais
  { value: "rg", label: "RG", category: "Pessoais" },
  { value: "cpf", label: "CPF", category: "Pessoais" },
  { value: "cnh", label: "CNH", category: "Pessoais" },
  { value: "titulo_eleitor", label: "Titulo de Eleitor", category: "Pessoais" },
  { value: "reservista", label: "Certificado de Reservista", category: "Pessoais" },
  { value: "certidao_nascimento", label: "Certidao de Nascimento", category: "Pessoais" },
  { value: "certidao_casamento", label: "Certidao de Casamento", category: "Pessoais" },
  { value: "comprovante_residencia", label: "Comprovante de Residencia", category: "Pessoais" },
  { value: "foto_3x4", label: "Foto 3x4", category: "Pessoais" },
  // Documentos trabalhistas
  { value: "ctps", label: "CTPS", category: "Trabalhistas" },
  { value: "pis", label: "PIS/PASEP", category: "Trabalhistas" },
  { value: "contrato_trabalho", label: "Contrato de Trabalho", category: "Trabalhistas" },
  { value: "aditivo_contrato", label: "Aditivo de Contrato", category: "Trabalhistas" },
  { value: "termo_rescisao", label: "Termo de Rescisao", category: "Trabalhistas" },
  { value: "aviso_previo", label: "Aviso Previo", category: "Trabalhistas" },
  // Documentos de admissao
  { value: "aso_admissional", label: "ASO Admissional", category: "Admissao" },
  { value: "ficha_registro", label: "Ficha de Registro", category: "Admissao" },
  { value: "declaracao_dependentes", label: "Declaracao de Dependentes", category: "Admissao" },
  { value: "opcao_vale_transporte", label: "Opcao Vale Transporte", category: "Admissao" },
  // Documentos academicos
  { value: "diploma", label: "Diploma", category: "Academicos" },
  { value: "certificado", label: "Certificado", category: "Academicos" },
  { value: "historico_escolar", label: "Historico Escolar", category: "Academicos" },
  // Atestados e laudos
  { value: "atestado_medico", label: "Atestado Medico", category: "Saude" },
  { value: "laudo_medico", label: "Laudo Medico", category: "Saude" },
  { value: "aso_periodico", label: "ASO Periodico", category: "Saude" },
  { value: "aso_demissional", label: "ASO Demissional", category: "Saude" },
  // Outros
  { value: "outros", label: "Outros", category: "Outros" },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

const uploadSchema = z.object({
  type: z.string().min(1, "Selecione o tipo de documento"),
  description: z.string().optional(),
  document_number: z.string().optional(),
  issue_date: z.string().optional(),
  expires_at: z.string().optional(),
  issuing_authority: z.string().optional(),
})

type UploadFormValues = z.infer<typeof uploadSchema>

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  companyId: string
  onSuccess: () => void
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  employeeId,
  companyId,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      type: "",
      description: "",
      document_number: "",
      issue_date: "",
      expires_at: "",
      issuing_authority: "",
    },
  })

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo nao suportado. Use PDF, JPG, PNG ou WebP.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho maximo: 10MB")
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const onSubmit = async (data: UploadFormValues) => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para upload")
      return
    }

    setIsUploading(true)

    try {
      // Get current user for uploaded_by
      const profileResult = await getCurrentProfile()

      // Upload file to storage
      const uploadResult = await uploadDocumentToStorage(
        selectedFile,
        companyId,
        employeeId
      )

      if (uploadResult.error) {
        toast.error(`Erro no upload: ${uploadResult.error.message}`)
        return
      }

      // Create document record
      const documentResult = await createEmployeeDocument({
        company_id: companyId,
        employee_id: employeeId,
        type: data.type as DocumentType,
        description: data.description || undefined,
        file_url: uploadResult.data!.url,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        document_number: data.document_number || undefined,
        issue_date: data.issue_date || undefined,
        expires_at: data.expires_at || undefined,
        issuing_authority: data.issuing_authority || undefined,
        uploaded_by: profileResult.data?.id,
      })

      if (documentResult.error) {
        toast.error(`Erro ao salvar documento: ${documentResult.error.message}`)
        return
      }

      toast.success("Documento enviado com sucesso!")
      form.reset()
      setSelectedFile(null)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error("Erro ao enviar documento. Tente novamente.")
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Group document types by category
  const groupedDocumentTypes = DOCUMENT_TYPES.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, typeof DOCUMENT_TYPES>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload de Documento</DialogTitle>
          <DialogDescription>
            Envie um documento do funcionario. Formatos aceitos: PDF, JPG, PNG, WebP (max 10MB)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-green-500 bg-green-50"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="size-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="ml-auto"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="size-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste e solte o arquivo aqui ou
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_FILE_TYPES.join(",")}
                    onChange={handleInputChange}
                  />
                </>
              )}
            </div>

            {/* Document Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(groupedDocumentTypes).map(([category, docs]) => (
                        <React.Fragment key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                            {category}
                          </div>
                          {docs.map((doc) => (
                            <SelectItem key={doc.value} value={doc.value}>
                              {doc.label}
                            </SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Input placeholder="Descricao adicional (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Number and Issue Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero do Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Numero (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Emissao</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expiration and Issuing Authority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Se aplicavel
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuing_authority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orgao Emissor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SSP/SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
