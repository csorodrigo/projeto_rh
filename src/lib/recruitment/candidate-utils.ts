/**
 * Candidate Utilities
 * Funções helper para gerenciamento de candidatos
 */

import {
  Candidate,
  CandidateWithApplications,
  Application,
  Activity,
  ActivityType,
  ApplicationSource,
  CandidateRating,
  ApplicationStatus,
} from '@/types/recruitment';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Globe,
  MessageSquare,
  Star,
  Calendar,
  Video,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  PhoneCall,
  Award,
  Gift,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Detecta candidatos duplicados baseado no email
 */
export function findDuplicateCandidates(
  candidates: Candidate[]
): Map<string, Candidate[]> {
  const emailMap = new Map<string, Candidate[]>();

  candidates.forEach((candidate) => {
    const normalizedEmail = candidate.email.toLowerCase().trim();
    const existing = emailMap.get(normalizedEmail) || [];
    existing.push(candidate);
    emailMap.set(normalizedEmail, existing);
  });

  // Retorna apenas emails com duplicatas
  const duplicates = new Map<string, Candidate[]>();
  emailMap.forEach((candidates, email) => {
    if (candidates.length > 1) {
      duplicates.set(email, candidates);
    }
  });

  return duplicates;
}

/**
 * Calcula o rating médio de um candidato baseado em todas as avaliações
 */
export function calculateAverageRating(activities: Activity[]): {
  average: number;
  count: number;
  byCategory: Record<string, { average: number; count: number }>;
} {
  const ratingActivities = activities.filter(
    (a) => a.type === 'rating' && a.rating
  );

  if (ratingActivities.length === 0) {
    return { average: 0, count: 0, byCategory: {} };
  }

  const total = ratingActivities.reduce((sum, a) => sum + (a.rating || 0), 0);
  const average = total / ratingActivities.length;

  // Por categoria
  const byCategory: Record<string, { ratings: number[]; average: number; count: number }> = {};

  ratingActivities.forEach((activity) => {
    const category = activity.rating_category || 'overall';
    if (!byCategory[category]) {
      byCategory[category] = { ratings: [], average: 0, count: 0 };
    }
    byCategory[category].ratings.push(activity.rating || 0);
  });

  // Calcula média por categoria
  Object.keys(byCategory).forEach((category) => {
    const ratings = byCategory[category].ratings;
    byCategory[category].average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    byCategory[category].count = ratings.length;
  });

  return {
    average,
    count: ratingActivities.length,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [
        k,
        { average: v.average, count: v.count },
      ])
    ),
  };
}

/**
 * Retorna o ícone apropriado para cada tipo de atividade
 */
export function getActivityIcon(type: ActivityType) {
  const iconMap: Record<ActivityType, any> = {
    status_change: TrendingUp,
    comment: MessageSquare,
    interview_scheduled: Calendar,
    interview_completed: CheckCircle2,
    rating: Star,
    document_uploaded: FileText,
    email_sent: Send,
    call_logged: PhoneCall,
    assessment_completed: Award,
    offer_sent: Gift,
    offer_accepted: CheckCircle2,
    offer_rejected: XCircle,
  };

  return iconMap[type] || AlertCircle;
}

/**
 * Formata a descrição de uma atividade de forma legível
 */
export function formatActivityDescription(activity: Activity): string {
  switch (activity.type) {
    case 'status_change':
      return `Mudou o status de "${getStatusLabel(activity.old_status)}" para "${getStatusLabel(activity.new_status)}"`;

    case 'comment':
      return activity.comment || 'Adicionou um comentário';

    case 'interview_scheduled':
      const interviewType = activity.interview_type
        ? getInterviewTypeLabel(activity.interview_type)
        : 'Entrevista';
      return `Agendou ${interviewType} para ${
        activity.interview_date
          ? format(new Date(activity.interview_date), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })
          : 'data a definir'
      }`;

    case 'interview_completed':
      return `Completou entrevista ${
        activity.interview_type
          ? `de ${getInterviewTypeLabel(activity.interview_type)}`
          : ''
      }`;

    case 'rating':
      const ratingText = activity.rating
        ? `${activity.rating} estrela${activity.rating > 1 ? 's' : ''}`
        : '';
      const category = activity.rating_category
        ? ` em ${activity.rating_category}`
        : '';
      return `Avaliou com ${ratingText}${category}`;

    case 'document_uploaded':
      return `Enviou documento: ${activity.document_name || 'arquivo'}`;

    case 'email_sent':
      return 'Enviou email para o candidato';

    case 'call_logged':
      return 'Registrou uma ligação telefônica';

    case 'assessment_completed':
      return 'Completou avaliação técnica';

    case 'offer_sent':
      return 'Enviou proposta de emprego';

    case 'offer_accepted':
      return 'Aceitou a proposta de emprego';

    case 'offer_rejected':
      return 'Recusou a proposta de emprego';

    default:
      return activity.action || 'Atividade registrada';
  }
}

/**
 * Retorna o status agregado de um candidato baseado em todas as aplicações
 */
export function getCandidateStatus(
  applications: Application[]
): {
  status: ApplicationStatus;
  label: string;
  color: string;
} {
  if (applications.length === 0) {
    return { status: 'applied', label: 'Sem aplicações', color: 'gray' };
  }

  // Prioridade de status
  const statusPriority: ApplicationStatus[] = [
    'hired',
    'offer',
    'interviewing',
    'screening',
    'applied',
    'withdrawn',
    'rejected',
  ];

  for (const status of statusPriority) {
    const hasStatus = applications.some((app) => app.status === status);
    if (hasStatus) {
      return {
        status,
        label: getStatusLabel(status),
        color: getStatusColor(status),
      };
    }
  }

  return {
    status: 'applied',
    label: 'Candidato',
    color: 'gray',
  };
}

/**
 * Badge colorido por origem do candidato
 */
export function getSourceBadge(source: ApplicationSource): {
  label: string;
  color: string;
} {
  const sourceMap: Record<
    ApplicationSource,
    { label: string; color: string }
  > = {
    careers_page: { label: 'Site de Carreiras', color: 'blue' },
    linkedin: { label: 'LinkedIn', color: 'indigo' },
    indeed: { label: 'Indeed', color: 'orange' },
    referral: { label: 'Indicação', color: 'green' },
    direct: { label: 'Direto', color: 'purple' },
    recruitment_agency: { label: 'Agência', color: 'pink' },
    university: { label: 'Universidade', color: 'yellow' },
    other: { label: 'Outro', color: 'gray' },
  };

  return sourceMap[source] || { label: 'Desconhecido', color: 'gray' };
}

/**
 * Retorna label traduzido para status
 */
export function getStatusLabel(status?: ApplicationStatus): string {
  if (!status) return 'N/A';

  const statusMap: Record<ApplicationStatus, string> = {
    applied: 'Aplicado',
    screening: 'Triagem',
    interviewing: 'Em Entrevista',
    offer: 'Proposta Enviada',
    hired: 'Contratado',
    rejected: 'Rejeitado',
    withdrawn: 'Desistiu',
  };

  return statusMap[status] || status;
}

/**
 * Retorna cor para status
 */
export function getStatusColor(status: ApplicationStatus): string {
  const colorMap: Record<ApplicationStatus, string> = {
    applied: 'blue',
    screening: 'yellow',
    interviewing: 'purple',
    offer: 'green',
    hired: 'emerald',
    rejected: 'red',
    withdrawn: 'gray',
  };

  return colorMap[status] || 'gray';
}

/**
 * Retorna label para tipo de entrevista
 */
export function getInterviewTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    phone_screen: 'Triagem Telefônica',
    technical: 'Técnica',
    behavioral: 'Comportamental',
    panel: 'Painel',
    final: 'Final',
    cultural_fit: 'Fit Cultural',
    case_study: 'Estudo de Caso',
  };

  return typeMap[type] || type;
}

/**
 * Formata timestamp relativo ("2 horas atrás")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Formata data completa
 */
export function formatFullDate(date: string | Date): string {
  try {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Calcula score de match do candidato (simplificado)
 */
export function calculateMatchScore(
  candidate: Candidate,
  searchTerms?: string[]
): number {
  let score = 0;

  if (!searchTerms || searchTerms.length === 0) {
    return 100; // Sem filtros = match perfeito
  }

  const candidateText = `
    ${candidate.name}
    ${candidate.email}
    ${candidate.current_position || ''}
    ${candidate.current_company || ''}
    ${candidate.tags.join(' ')}
  `.toLowerCase();

  searchTerms.forEach((term) => {
    if (candidateText.includes(term.toLowerCase())) {
      score += 20;
    }
  });

  return Math.min(100, score);
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]{8,}$/;
  return phoneRegex.test(phone);
}

/**
 * Formata telefone para exibição
 */
export function formatPhoneDisplay(phone: string): string {
  // Remove tudo que não é dígito
  const digits = phone.replace(/\D/g, '');

  // Formata no padrão brasileiro
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Gera initials do nome para avatar
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Retorna cor consistente baseada no nome (para avatars)
 */
export function getColorForName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Exporta candidato para formato JSON
 */
export function exportCandidateData(
  candidate: CandidateWithApplications
): string {
  const data = {
    candidate: {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      current_position: candidate.current_position,
      current_company: candidate.current_company,
      linkedin: candidate.linkedin_url,
      portfolio: candidate.portfolio_url,
      source: candidate.source,
      tags: candidate.tags,
      rating: candidate.rating,
    },
    applications: candidate.applications.map((app) => ({
      job_title: app.job_title,
      department: app.job_department,
      status: app.status,
      applied_at: app.applied_at,
      source: app.source,
    })),
    export_date: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}
