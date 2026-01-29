"use client";

import { useState, useEffect } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Absence {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  days: number;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

const absenceTypes = [
  { value: "vacation", label: "Férias" },
  { value: "sick", label: "Atestado Médico" },
  { value: "personal", label: "Assuntos Pessoais" },
  { value: "family", label: "Assuntos Familiares" },
  { value: "study", label: "Estudos" },
  { value: "other", label: "Outros" },
];

export default function MobileAbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [showNewAbsence, setShowNewAbsence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    loadAbsences();
  }, []);

  const loadAbsences = async () => {
    try {
      const response = await fetch("/api/ausencias");
      if (response.ok) {
        const data = await response.json();
        setAbsences(data.absences || []);
      }
    } catch (error) {
      console.error("Erro ao carregar ausências:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.startDate || !formData.endDate) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ausencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowNewAbsence(false);
        setFormData({ type: "", startDate: "", endDate: "", reason: "" });
        await loadAbsences();
      } else {
        throw new Error("Erro ao criar ausência");
      }
    } catch (error) {
      console.error("Erro ao criar ausência:", error);
      alert("Erro ao solicitar ausência. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingAbsences = absences.filter((a) => a.status === "pending");
  const approvedAbsences = absences.filter((a) => a.status === "approved");
  const rejectedAbsences = absences.filter((a) => a.status === "rejected");

  const totalPendingDays = pendingAbsences.reduce(
    (sum, a) => sum + a.days,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="container max-w-lg space-y-6 p-4">
        {/* Header com Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {pendingAbsences.length}
              </div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">
                {approvedAbsences.length}
              </div>
              <p className="text-sm text-muted-foreground">Aprovadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Botão Nova Solicitação */}
        <Button
          onClick={() => setShowNewAbsence(true)}
          size="lg"
          className="w-full"
        >
          <Plus className="mr-2 h-5 w-5" />
          Solicitar Ausência
        </Button>

        {/* Ausências Pendentes */}
        {pendingAbsences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Aguardando Aprovação ({totalPendingDays} dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAbsences.map((absence) => (
                <button
                  key={absence.id}
                  onClick={() => setSelectedAbsence(absence)}
                  className="w-full text-left"
                >
                  <AbsenceCard absence={absence} />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Ausências Aprovadas */}
        {approvedAbsences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvedAbsences.map((absence) => (
                <button
                  key={absence.id}
                  onClick={() => setSelectedAbsence(absence)}
                  className="w-full text-left"
                >
                  <AbsenceCard absence={absence} />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Ausências Rejeitadas */}
        {rejectedAbsences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rejectedAbsences.map((absence) => (
                <button
                  key={absence.id}
                  onClick={() => setSelectedAbsence(absence)}
                  className="w-full text-left"
                >
                  <AbsenceCard absence={absence} />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Estado Vazio */}
        {absences.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma ausência registrada
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal Nova Ausência */}
      <Dialog open={showNewAbsence} onOpenChange={setShowNewAbsence}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar Ausência</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Ausência *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate}
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">
                  Total:{" "}
                  {differenceInDays(
                    new Date(formData.endDate),
                    new Date(formData.startDate)
                  ) + 1}{" "}
                  dias
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da ausência..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAbsence(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Solicitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes da Ausência */}
      <Dialog
        open={!!selectedAbsence}
        onOpenChange={() => setSelectedAbsence(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedAbsence && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Ausência</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      selectedAbsence.status === "approved"
                        ? "default"
                        : selectedAbsence.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {getStatusLabel(selectedAbsence.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="font-medium">
                    {getTypeLabel(selectedAbsence.type)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Período</span>
                  <span className="font-medium">
                    {format(parseISO(selectedAbsence.startDate), "dd/MM/yyyy")} -{" "}
                    {format(parseISO(selectedAbsence.endDate), "dd/MM/yyyy")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dias</span>
                  <span className="font-medium">{selectedAbsence.days}</span>
                </div>

                {selectedAbsence.reason && (
                  <div>
                    <span className="text-sm text-muted-foreground">Motivo</span>
                    <p className="mt-1 text-sm">{selectedAbsence.reason}</p>
                  </div>
                )}

                {selectedAbsence.approvedBy && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p>
                      {selectedAbsence.status === "approved"
                        ? "Aprovado"
                        : "Rejeitado"}{" "}
                      por {selectedAbsence.approvedBy}
                    </p>
                    {selectedAbsence.approvedAt && (
                      <p className="text-muted-foreground">
                        em{" "}
                        {format(
                          parseISO(selectedAbsence.approvedAt),
                          "dd/MM/yyyy 'às' HH:mm"
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setSelectedAbsence(null)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AbsenceCard({ absence }: { absence: Absence }) {
  const StatusIcon =
    absence.status === "approved"
      ? CheckCircle2
      : absence.status === "rejected"
        ? XCircle
        : Clock;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-start gap-3">
        <StatusIcon
          className={`mt-0.5 h-5 w-5 ${
            absence.status === "approved"
              ? "text-green-500"
              : absence.status === "rejected"
                ? "text-destructive"
                : "text-yellow-500"
          }`}
        />
        <div>
          <p className="font-medium">{getTypeLabel(absence.type)}</p>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(absence.startDate), "dd/MM/yyyy")} -{" "}
            {format(parseISO(absence.endDate), "dd/MM/yyyy")}
          </p>
          <p className="text-xs text-muted-foreground">{absence.days} dias</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function getTypeLabel(type: string): string {
  const typeMap = absenceTypes.find((t) => t.value === type);
  return typeMap?.label || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Rejeitada",
  };
  return labels[status] || status;
}
