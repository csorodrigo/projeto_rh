"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckCircle,
  User,
  FileText,
  Clock,
  Building,
  Loader2,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Calendar,
  ArrowLeft
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCurrentProfile } from "@/lib/supabase/queries"
import { getApplications } from "@/lib/supabase/queries/recruitment"
import type { ApplicationWithDetails } from "@/types/recruitment"

// Checklist de onboarding
const onboardingChecklist = [
  { id: 'documents', label: 'Documentos recebidos', description: 'RG, CPF, CTPS, comprovante de residencia', icon: FileText },
  { id: 'contract', label: 'Contrato assinado', description: 'Contrato de trabalho e acordo de confidencialidade', icon: FileText },
  { id: 'badge', label: 'Cracha emitido', description: 'Foto tirada e cracha de identificacao emitido', icon: User },
  { id: 'equipment', label: 'Equipamentos entregues', description: 'Notebook, mouse, headset e demais equipamentos', icon: Building },
  { id: 'training', label: 'Treinamento inicial', description: 'Treinamento de integracao e cultura da empresa', icon: Clock },
  { id: 'system_access', label: 'Acesso aos sistemas', description: 'Email corporativo, sistemas internos e ferramentas', icon: CheckCircle },
]

interface OnboardingState {
  [candidateId: string]: {
    [checklistId: string]: boolean
  }
}

export default function AdmissaoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiredCandidates, setHiredCandidates] = useState<ApplicationWithDetails[]>([])
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({})
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationWithDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar candidatos contratados
  const loadHiredCandidates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const profile = await getCurrentProfile()

      if (!profile.data?.company_id) {
        setError("Nao foi possivel identificar a empresa")
        return
      }

      const result = await getApplications({
        status: 'hired',
        pageSize: 100
      })

      if (result.applications) {
        // Filtrar apenas candidatos que ainda nao foram convertidos em funcionarios
        const pendingOnboarding = result.applications.filter(
          app => app.status === 'hired' && !app.employee_id
        )
        setHiredCandidates(pendingOnboarding)

        // Inicializar estado de onboarding
        const initialState: OnboardingState = {}
        pendingOnboarding.forEach(candidate => {
          initialState[candidate.id] = {}
          onboardingChecklist.forEach(item => {
            initialState[candidate.id][item.id] = false
          })
        })
        setOnboardingState(initialState)
      }
    } catch (err) {
      console.error("Erro ao carregar candidatos:", err)
      setError("Erro ao carregar candidatos contratados")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHiredCandidates()
  }, [])

  // Alternar item do checklist
  const toggleChecklistItem = (candidateId: string, itemId: string) => {
    setOnboardingState(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        [itemId]: !prev[candidateId]?.[itemId]
      }
    }))
  }

  // Calcular progresso do onboarding
  const getProgress = (candidateId: string): number => {
    const state = onboardingState[candidateId]
    if (!state) return 0

    const total = onboardingChecklist.length
    const completed = Object.values(state).filter(Boolean).length
    return Math.round((completed / total) * 100)
  }

  // Verificar se onboarding esta completo
  const isOnboardingComplete = (candidateId: string): boolean => {
    return getProgress(candidateId) === 100
  }

  // Abrir dialog de confirmacao
  const handleFinishOnboarding = (candidate: ApplicationWithDetails) => {
    if (!isOnboardingComplete(candidate.id)) {
      toast.error("Complete todos os itens do checklist antes de finalizar")
      return
    }
    setSelectedCandidate(candidate)
    setIsDialogOpen(true)
  }

  // Converter candidato em funcionario
  const handleConfirmConversion = async () => {
    if (!selectedCandidate) return

    setIsSubmitting(true)
    try {
      // TODO: Implementar chamada real para converter candidato em funcionario
      // Isso deveria criar um registro na tabela employees e atualizar application.employee_id
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success(`${selectedCandidate.candidate_name} foi adicionado como funcionario!`)

      // Remover da lista de onboarding
      setHiredCandidates(prev => prev.filter(c => c.id !== selectedCandidate.id))
      setIsDialogOpen(false)
      setSelectedCandidate(null)
    } catch (err) {
      console.error("Erro ao converter candidato:", err)
      toast.error("Erro ao finalizar admissao")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Formatar data
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recrutamento">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admissao / Onboarding</h1>
            <p className="text-muted-foreground">
              Gerencie o processo de admissao de novos funcionarios
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erro ao carregar dados</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadHiredCandidates}>
              <RefreshCw className="mr-2 size-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/recrutamento">
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissao / Onboarding</h1>
          <p className="text-muted-foreground">
            Gerencie o processo de admissao de novos funcionarios
          </p>
        </div>
        <Button variant="outline" onClick={loadHiredCandidates} disabled={isLoading}>
          <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aguardando Onboarding
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : hiredCandidates.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Candidatos contratados pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Progresso
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                hiredCandidates.filter(c => {
                  const progress = getProgress(c.id)
                  return progress > 0 && progress < 100
                }).length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Com checklist parcialmente completo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prontos para Finalizar
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                hiredCandidates.filter(c => isOnboardingComplete(c.id)).length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Com checklist 100% completo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hiredCandidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <UserPlus className="size-16 text-muted-foreground opacity-20 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum candidato aguardando onboarding</p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Quando um candidato for contratado no processo seletivo, ele aparecera aqui para o processo de admissao.
            </p>
            <Button variant="outline" asChild>
              <Link href="/recrutamento/pipeline">
                <ChevronRight className="mr-2 size-4" />
                Ver Pipeline de Recrutamento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {hiredCandidates.map((candidate) => {
            const progress = getProgress(candidate.id)
            const complete = isOnboardingComplete(candidate.id)

            return (
              <Card key={candidate.id} className={complete ? "border-green-500/50" : undefined}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(candidate.candidate_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">
                          {candidate.candidate_name}
                        </CardTitle>
                        {complete && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Pronto
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Briefcase className="size-3" />
                        {candidate.job_title}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Candidate Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3" />
                      <span className="truncate">{candidate.candidate_email}</span>
                    </div>
                    {candidate.candidate_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3" />
                        <span>{candidate.candidate_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>Contratado em: {formatDate(candidate.hired_at)}</span>
                    </div>
                    {candidate.job_department && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="size-3" />
                        <span>{candidate.job_department}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progresso do Onboarding</span>
                      <span className={`font-bold ${complete ? "text-green-500" : ""}`}>
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    {onboardingChecklist.map((item) => {
                      const IconComponent = item.icon
                      const isChecked = onboardingState[candidate.id]?.[item.id] || false

                      return (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                            isChecked ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            id={`${candidate.id}-${item.id}`}
                            checked={isChecked}
                            onCheckedChange={() => toggleChecklistItem(candidate.id, item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`${candidate.id}-${item.id}`}
                              className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${
                                isChecked ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              <IconComponent className="size-4 shrink-0" />
                              {item.label}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={!complete}
                    onClick={() => handleFinishOnboarding(candidate)}
                  >
                    {complete ? (
                      <>
                        <UserPlus className="mr-2 size-4" />
                        Finalizar Admissao
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 size-4" />
                        Complete o checklist ({progress}%)
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Admissao</DialogTitle>
            <DialogDescription>
              Voce esta prestes a converter o candidato em funcionario.
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedCandidate.candidate_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedCandidate.candidate_name}</p>
                  <p className="text-muted-foreground">{selectedCandidate.job_title}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedCandidate.candidate_email}</span>
                </div>
                {selectedCandidate.job_department && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departamento:</span>
                    <span>{selectedCandidate.job_department}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de Contratacao:</span>
                  <span>{formatDate(selectedCandidate.hired_at)}</span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Ao confirmar, um novo registro de funcionario sera criado e o candidato sera removido da lista de onboarding.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmConversion}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  Confirmar Admissao
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
