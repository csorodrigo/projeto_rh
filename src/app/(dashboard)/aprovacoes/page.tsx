/**
 * Página de Aprovações - Dashboard de workflows
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApprovalCard } from '@/components/workflows/ApprovalCard';
import { DelegationModal } from '@/components/workflows/DelegationModal';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  UserCog,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WorkflowEngine } from '@/lib/workflows/engine';
import {
  getPendingApprovals,
  getApprovalHistory,
  getOverdueApprovals,
  getApprovalStats,
} from '@/lib/supabase/queries/workflows';
import type { PendingApproval, Profile, WorkflowType } from '@/types/database';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ApprovalsPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estado
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [approvedHistory, setApprovedHistory] = useState<PendingApproval[]>([]);
  const [rejectedHistory, setRejectedHistory] = useState<PendingApproval[]>([]);
  const [overdueApprovals, setOverdueApprovals] = useState<PendingApproval[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    overdue: 0,
  });

  // Filtros
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<WorkflowType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingApprovalId, setRejectingApprovalId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState<Profile[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profileCompanyId = (profile as { company_id?: string } | null)?.company_id;

      if (!profileCompanyId) {
        toast.error('Perfil não encontrado');
        return;
      }

      setCurrentUserId(user.id);
      setCompanyId(profileCompanyId);

      // Carregar aprovações e estatísticas
      const [pending, approved, rejected, overdue, statsData] = await Promise.all([
        getPendingApprovals(user.id),
        getApprovalHistory(user.id, 'approved'),
        getApprovalHistory(user.id, 'rejected'),
        getOverdueApprovals(user.id),
        getApprovalStats(user.id),
      ]);

      setPendingApprovals(pending);
      setApprovedHistory(approved);
      setRejectedHistory(rejected);
      setOverdueApprovals(overdue);
      setStats(statsData);

      // Buscar usuários elegíveis para delegação (mesmo role ou superior)
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profileCompanyId)
        .neq('id', user.id);

      setEligibleUsers((users as Profile[]) || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar aprovações
  const filterApprovals = (approvals: PendingApproval[]) => {
    return approvals.filter((approval) => {
      // Filtro por tipo
      if (filterType !== 'all' && approval.instance.workflow_type !== filterType) {
        return false;
      }

      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const requesterName = approval.instance.requester.name.toLowerCase();
        return requesterName.includes(searchLower);
      }

      return true;
    });
  };

  // Aprovação individual
  const handleApprove = async (approvalId: string) => {
    try {
      const approval = pendingApprovals.find((a) => a.id === approvalId);
      if (!approval) return;

      const engine = new WorkflowEngine(companyId);
      await engine.approveStep(approval.instance_id, currentUserId);

      toast.success('Aprovação realizada com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Erro ao aprovar');
    }
  };

  // Rejeição individual
  const handleReject = (approvalId: string) => {
    setRejectingApprovalId(approvalId);
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      const approval = pendingApprovals.find((a) => a.id === rejectingApprovalId);
      if (!approval) return;

      const engine = new WorkflowEngine(companyId);
      await engine.rejectStep(approval.instance_id, currentUserId, rejectReason);

      toast.success('Solicitação rejeitada');
      setRejectModalOpen(false);
      setRejectReason('');
      setRejectingApprovalId('');
      await loadData();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Erro ao rejeitar');
    }
  };

  // Aprovação em massa
  const handleBulkApprove = async () => {
    if (selectedApprovals.size === 0) {
      toast.error('Selecione ao menos uma aprovação');
      return;
    }

    try {
      const engine = new WorkflowEngine(companyId);

      for (const approvalId of selectedApprovals) {
        const approval = pendingApprovals.find((a) => a.id === approvalId);
        if (approval) {
          await engine.approveStep(approval.instance_id, currentUserId);
        }
      }

      toast.success(`${selectedApprovals.size} aprovações realizadas`);
      setSelectedApprovals(new Set());
      await loadData();
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('Erro ao aprovar selecionados');
    }
  };

  // Rejeição em massa
  const handleBulkReject = () => {
    if (selectedApprovals.size === 0) {
      toast.error('Selecione ao menos uma aprovação');
      return;
    }
    setRejectingApprovalId('bulk');
    setRejectModalOpen(true);
  };

  const confirmBulkReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      const engine = new WorkflowEngine(companyId);

      for (const approvalId of selectedApprovals) {
        const approval = pendingApprovals.find((a) => a.id === approvalId);
        if (approval) {
          await engine.rejectStep(approval.instance_id, currentUserId, rejectReason);
        }
      }

      toast.success(`${selectedApprovals.size} solicitações rejeitadas`);
      setRejectModalOpen(false);
      setRejectReason('');
      setRejectingApprovalId('');
      setSelectedApprovals(new Set());
      await loadData();
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      toast.error('Erro ao rejeitar selecionados');
    }
  };

  // Toggle seleção
  const toggleSelection = (approvalId: string, selected: boolean) => {
    const newSelection = new Set(selectedApprovals);
    if (selected) {
      newSelection.add(approvalId);
    } else {
      newSelection.delete(approvalId);
    }
    setSelectedApprovals(newSelection);
  };

  // Selecionar todos
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const filtered = filterApprovals(pendingApprovals);
      setSelectedApprovals(new Set(filtered.map((a) => a.id)));
    } else {
      setSelectedApprovals(new Set());
    }
  };

  const filteredPending = filterApprovals(pendingApprovals);
  const filteredOverdue = filterApprovals(overdueApprovals);

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aprovações</h1>
          <p className="text-muted-foreground">
            Gerencie solicitações pendentes de aprovação
          </p>
        </div>

        <Button onClick={() => setDelegationModalOpen(true)}>
          <UserCog className="mr-2 h-4 w-4" />
          Delegar Aprovações
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações em massa */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as WorkflowType | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="absence">Ausências</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                  <SelectItem value="time_adjustment">Ajustes de Ponto</SelectItem>
                  <SelectItem value="document_approval">Documentos</SelectItem>
                  <SelectItem value="data_change">Alterações de Dados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedApprovals.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">{selectedApprovals.size} selecionados</Badge>
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar Selecionados
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar Selecionados
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes
            {stats.pending > 0 && (
              <Badge className="ml-2" variant="secondary">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          <TabsTrigger value="overdue">
            Com Atraso
            {stats.overdue > 0 && (
              <Badge className="ml-2" variant="destructive">
                {stats.overdue}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredPending.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                checked={selectedApprovals.size === filteredPending.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Selecionar todos</span>
            </div>
          )}

          {filteredPending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma aprovação pendente</p>
              </CardContent>
            </Card>
          ) : (
            filteredPending.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                selected={selectedApprovals.has(approval.id)}
                onSelect={(selected) => toggleSelection(approval.id, selected)}
                onApprove={handleApprove}
                onReject={handleReject}
                showCheckbox
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma aprovação no histórico</p>
              </CardContent>
            </Card>
          ) : (
            approvedHistory.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma rejeição no histórico</p>
              </CardContent>
            </Card>
          ) : (
            rejectedHistory.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {filteredOverdue.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma aprovação atrasada</p>
              </CardContent>
            </Card>
          ) : (
            filteredOverdue.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Delegação */}
      <DelegationModal
        open={delegationModalOpen}
        onOpenChange={setDelegationModalOpen}
        userId={currentUserId}
        eligibleUsers={eligibleUsers}
        onSuccess={loadData}
      />

      {/* Modal de Rejeição */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Este comentário será visível para o solicitante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
              <Textarea
                id="reject-reason"
                placeholder="Ex: Documentação incompleta, período não disponível, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={rejectingApprovalId === 'bulk' ? confirmBulkReject : confirmReject}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
