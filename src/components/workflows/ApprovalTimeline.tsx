/**
 * ApprovalTimeline - Timeline visual de aprovações
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, User, XCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { WorkflowInstanceWithDetails } from '@/types/database';
import { cn } from '@/lib/utils';

interface ApprovalTimelineProps {
  instance: WorkflowInstanceWithDetails;
}

type StepStatus = 'completed' | 'rejected' | 'pending' | 'skipped';

interface TimelineStepProps {
  icon: React.ReactNode;
  label: string;
  user?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
  date?: string;
  status: StepStatus;
  comments?: string;
  isLast?: boolean;
}

function TimelineStep({
  icon,
  label,
  user,
  date,
  status,
  comments,
  isLast = false,
}: TimelineStepProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      case 'skipped':
        return 'text-gray-400 bg-gray-50';
      default:
        return 'text-gray-400 bg-gray-50';
    }
  };

  const getLineColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-200';
      case 'rejected':
        return 'bg-red-200';
      case 'pending':
        return 'bg-blue-200';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-6 top-12 w-0.5 h-full -ml-px',
            getLineColor()
          )}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10',
          getStatusColor()
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{label}</h4>
            {user && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{user.name}</span>
              </div>
            )}
            {comments && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                "{comments}"
              </p>
            )}
          </div>
          {date && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ApprovalTimeline({ instance }: ApprovalTimelineProps) {
  const steps = instance.definition.steps;
  const approvals = instance.approvals || [];

  // Agrupar aprovações por step level
  const approvalsByStep = approvals.reduce(
    (acc, approval) => {
      if (!acc[approval.step_level]) {
        acc[approval.step_level] = [];
      }
      acc[approval.step_level].push(approval);
      return acc;
    },
    {} as Record<number, typeof approvals>
  );

  const getStepStatus = (stepLevel: number): StepStatus => {
    const stepApprovals = approvalsByStep[stepLevel] || [];

    if (stepApprovals.length === 0) {
      return stepLevel === instance.current_step ? 'pending' : 'pending';
    }

    const hasRejected = stepApprovals.some((a) => a.decision === 'rejected');
    if (hasRejected) {
      return 'rejected';
    }

    const allApproved = stepApprovals.every((a) => a.decision === 'approved');
    if (allApproved) {
      return 'completed';
    }

    const hasApproved = stepApprovals.some((a) => a.decision === 'approved');
    if (hasApproved && !instance.definition.rules.requireAll) {
      return 'completed';
    }

    return 'pending';
  };

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6" />;
      case 'rejected':
        return <XCircle className="h-6 w-6" />;
      case 'pending':
        return <Clock className="h-6 w-6" />;
      case 'skipped':
        return <Circle className="h-6 w-6" />;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {/* Solicitação */}
          <TimelineStep
            icon={<User className="h-6 w-6" />}
            label="Solicitado"
            user={{
              name: instance.requester.name,
              email: instance.requester.email,
              avatar_url: instance.requester.avatar_url,
            }}
            date={instance.created_at}
            status="completed"
          />

          {/* Steps de aprovação */}
          {steps.map((step, index) => {
            const stepLevel = step.level;
            const stepApprovals = approvalsByStep[stepLevel] || [];
            const status = getStepStatus(stepLevel);
            const isLast = index === steps.length - 1;

            // Se há múltiplos aprovadores no step
            if (stepApprovals.length > 1) {
              return (
                <div key={stepLevel}>
                  <TimelineStep
                    icon={getStepIcon(status)}
                    label={step.name}
                    status={status}
                    isLast={false}
                  />
                  {stepApprovals.map((approval, approvalIndex) => (
                    <div key={approval.id} className="ml-16 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={approval.approver.avatar_url || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {approval.approver.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {approval.approver.name}
                          </p>
                          {approval.decision && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  approval.decision === 'approved'
                                    ? 'default'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                {approval.decision === 'approved'
                                  ? 'Aprovado'
                                  : 'Rejeitado'}
                              </Badge>
                              {approval.decided_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(approval.decided_at),
                                    "dd/MM/yyyy 'às' HH:mm",
                                    { locale: ptBR }
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                          {approval.comments && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              "{approval.comments}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            // Step com um único aprovador
            const approval = stepApprovals[0];
            return (
              <TimelineStep
                key={stepLevel}
                icon={getStepIcon(status)}
                label={step.name}
                user={
                  approval
                    ? {
                        name: approval.approver.name,
                        email: approval.approver.email,
                        avatar_url: approval.approver.avatar_url,
                      }
                    : undefined
                }
                date={approval?.decided_at || undefined}
                status={status}
                comments={approval?.comments || undefined}
                isLast={isLast && (!approval || approval.decision !== null)}
              />
            );
          })}

          {/* Status final */}
          {instance.status === 'approved' && (
            <TimelineStep
              icon={<CheckCircle className="h-6 w-6" />}
              label="Aprovado"
              date={instance.completed_at || undefined}
              status="completed"
              isLast
            />
          )}

          {instance.status === 'rejected' && (
            <TimelineStep
              icon={<XCircle className="h-6 w-6" />}
              label="Rejeitado"
              date={instance.completed_at || undefined}
              status="rejected"
              isLast
            />
          )}

          {instance.status === 'cancelled' && (
            <TimelineStep
              icon={<XCircle className="h-6 w-6" />}
              label="Cancelado"
              date={instance.completed_at || undefined}
              status="rejected"
              isLast
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
