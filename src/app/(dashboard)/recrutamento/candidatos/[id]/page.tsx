"use client";

import { useState, use } from "react";
import { Candidate, ApplicationWithJob, ActivityWithUser, CandidateRating } from "@/types/recruitment";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidateProfile } from "@/components/recruitment/CandidateProfile";
import { CandidateTimeline } from "@/components/recruitment/CandidateTimeline";
import { CandidateApplicationsList } from "@/components/recruitment/CandidateApplicationsList";
import { RatingStars, RatingSummary } from "@/components/recruitment/RatingDisplay";
import { ResumeViewer } from "@/components/recruitment/ResumeViewer";
import { AddActivityForm } from "@/components/recruitment/AddActivityForm";
import {
  getInitials,
  getColorForName,
  getSourceBadge,
} from "@/lib/recruitment/candidate-utils";
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  FileText,
  MessageSquare,
  Star,
  Trash2,
  UserMinus,
  UserCheck,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock data - substituir por chamada real à API
const mockCandidate: Candidate = {
  id: "1",
  company_id: "company-1",
  name: "Ana Silva",
  email: "ana.silva@email.com",
  phone: "(11) 98765-4321",
  location: "São Paulo, SP",
  current_position: "Desenvolvedora Full Stack",
  current_company: "Tech Corp",
  linkedin_url: "https://linkedin.com/in/anasilva",
  portfolio_url: "https://anasilva.dev",
  years_of_experience: 5,
  resume_url: "/resumes/ana-silva.pdf",
  resume_text: null,
  resume_filename: "curriculo-ana-silva.pdf",
  source: "linkedin",
  source_details: null,
  expected_salary: null,
  available_from: null,
  tags: ["react", "node.js", "typescript", "aws"],
  rating: 4,
  notes: "Excelente candidata, perfil sênior com experiência em produtos SaaS",
  custom_fields: {},
  consent_given: true,
  consent_date: "2024-01-15T10:00:00Z",
  gdpr_data_retention_until: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z",
};

// Using 'as any' for mock data since this will be replaced with real API calls
const mockApplications = [
  {
    id: "app-1",
    job_id: "job-1",
    candidate_id: "1",
    stage_id: "stage-2",
    status: "active" as const,
    applied_at: "2024-01-15T10:00:00Z",
    cover_letter: null,
    rating: 4,
    tags: [],
    interview_scheduled_at: "2024-01-25T14:00:00Z",
    interview_completed_at: null,
    interview_feedback: null,
    rejected_at: null,
    rejected_by: null,
    rejection_reason: null,
    hired_at: null,
    hired_by: null,
    employee_id: null,
    withdrawn_at: null,
    withdrawn_reason: null,
    custom_fields: {},
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T15:30:00Z",
    job: {
      id: "job-1",
      company_id: "company-1",
      title: "Desenvolvedor Full Stack Sênior",
      description: "Buscamos desenvolvedor full stack...",
      requirements: ["React", "Node.js"],
      benefits: [],
      department: "Engenharia",
      location: "São Paulo, SP",
      location_type: "hybrid" as const,
      employment_type: "clt" as const,
      salary_range_min: 10000,
      salary_range_max: 15000,
      show_salary: true,
      status: "open" as const,
      publish_internally: true,
      publish_externally: true,
      openings_count: 2,
      hiring_manager_id: "user-1",
      created_by: null,
      created_at: "2024-01-10T00:00:00Z",
      updated_at: "2024-01-10T00:00:00Z",
      published_at: "2024-01-10T00:00:00Z",
      closed_at: null,
      custom_fields: {},
    },
  },
] as ApplicationWithJob[];

// Using simplified mock data for activities
const mockActivities = [
  {
    id: "act-1",
    application_id: "app-1",
    type: "interview_scheduled" as const,
    from_stage_id: null,
    to_stage_id: null,
    comment: "Entrevista agendada com o tech lead",
    rating: null,
    metadata: { interview_type: "technical", interview_date: "2024-01-25T14:00:00Z" },
    created_by: "user-1",
    created_at: "2024-01-20T15:30:00Z",
    user_name: "João Silva",
    user_avatar: null,
  },
  {
    id: "act-2",
    application_id: "app-1",
    type: "rating" as const,
    from_stage_id: null,
    to_stage_id: null,
    comment: "Candidata demonstrou excelente conhecimento em React e Node.js",
    rating: 4,
    metadata: { category: "technical" },
    created_by: "user-1",
    created_at: "2024-01-18T16:00:00Z",
    user_name: "João Silva",
    user_avatar: null,
  },
  {
    id: "act-3",
    application_id: "app-1",
    type: "status_change" as const,
    from_stage_id: "stage-1",
    to_stage_id: "stage-2",
    comment: null,
    rating: null,
    metadata: {},
    created_by: "user-1",
    created_at: "2024-01-18T14:00:00Z",
    user_name: "João Silva",
    user_avatar: null,
  },
] as ActivityWithUser[];

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate>(mockCandidate);
  const [applications, setApplications] = useState<ApplicationWithJob[]>(mockApplications);
  const [activities, setActivities] = useState<ActivityWithUser[]>(mockActivities);
  const [showAddActivity, setShowAddActivity] = useState(false);

  const sourceBadge = getSourceBadge(candidate.source);

  const handleReject = () => {
    toast.success("Candidato rejeitado");
    // Implementar lógica de rejeição
  };

  const handleBlacklist = () => {
    toast.success("Candidato adicionado à blacklist");
    // Implementar lógica de blacklist
  };

  const handleDelete = () => {
    toast.success("Candidato removido");
    router.push("/recrutamento/candidatos");
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/recrutamento/candidatos">
          <ArrowLeft className="mr-2 size-4" />
          Voltar para Candidatos
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Card do candidato */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Avatar e nome */}
              <div className="flex flex-col items-center text-center">
                <Avatar className={`size-20 ${getColorForName(candidate.name)}`}>
                  <AvatarFallback className="text-2xl text-white">
                    {getInitials(candidate.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-xl font-bold">{candidate.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {candidate.current_position || "Candidato"}
                </p>
              </div>

              <Separator />

              {/* Rating médio */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-sm font-medium">Avaliação Geral</span>
                {candidate.rating ? (
                  <RatingStars rating={candidate.rating} size="lg" showCount={false} />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem avaliação</p>
                )}
              </div>

              <Separator />

              {/* Tags */}
              {candidate.tags.length > 0 && (
                <>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {candidate.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Origem */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Origem</span>
                <Badge variant="outline">{sourceBadge.label}</Badge>
              </div>

              <Separator />

              {/* Ações */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowAddActivity(true)}
                >
                  <MessageSquare className="mr-2 size-4" />
                  Adicionar Nota
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`mailto:${candidate.email}`}>
                    <Mail className="mr-2 size-4" />
                    Enviar Email
                  </Link>
                </Button>

                {candidate.phone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`tel:${candidate.phone}`}>
                      <Phone className="mr-2 size-4" />
                      Ligar
                    </Link>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <MoreVertical className="mr-2 size-4" />
                      Mais Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[240px]" align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Briefcase className="mr-2 size-4" />
                      Mover para Vaga
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserCheck className="mr-2 size-4" />
                      Converter em Funcionário
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleReject}>
                      <UserMinus className="mr-2 size-4" />
                      Rejeitar Candidato
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlacklist}>
                      <UserMinus className="mr-2 size-4" />
                      Adicionar à Blacklist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Excluir Candidato
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>

          {/* Informações de contato */}
          <Card className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Contato</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a
                    href={`mailto:${candidate.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {candidate.email}
                  </a>
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{candidate.location}</span>
                  </div>
                )}
                {candidate.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="size-4 text-muted-foreground" />
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {candidate.portfolio_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <a
                      href={candidate.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Portfólio
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div>
          <Tabs defaultValue="perfil" className="space-y-4">
            <TabsList>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="curriculo">Currículo</TabsTrigger>
              <TabsTrigger value="aplicacoes">
                Aplicações ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline ({activities.length})
              </TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-4">
              <CandidateProfile
                candidate={candidate}
                onUpdate={setCandidate}
              />
            </TabsContent>

            <TabsContent value="curriculo" className="space-y-4">
              <ResumeViewer
                resumeUrl={candidate.resume_url}
                resumeFilename={candidate.resume_filename}
              />
            </TabsContent>

            <TabsContent value="aplicacoes" className="space-y-4">
              <CandidateApplicationsList applications={applications} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">Histórico de Atividades</h3>
                <Button onClick={() => setShowAddActivity(true)}>
                  <Plus className="mr-2 size-4" />
                  Adicionar Atividade
                </Button>
              </div>
              <CandidateTimeline activities={activities} />
            </TabsContent>

            <TabsContent value="avaliacoes" className="space-y-4">
              <RatingSummary
                ratings={applications.filter(app => app.rating !== null).map(app => ({ rating: app.rating!, application_id: app.id }))}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de adicionar atividade */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
          </DialogHeader>
          <AddActivityForm
            applicationId={applications[0]?.id || ""}
            candidateId={candidate.id}
            onSuccess={() => {
              setShowAddActivity(false);
              // Recarregar atividades
            }}
            onCancel={() => setShowAddActivity(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
