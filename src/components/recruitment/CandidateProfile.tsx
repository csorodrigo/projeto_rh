"use client";

import { useState } from "react";
import { Candidate } from "@/types/recruitment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Globe,
  Calendar,
  Edit2,
  Save,
  X,
  Tag,
  User,
  Building2,
} from "lucide-react";
import { formatFullDate, getSourceBadge } from "@/lib/recruitment/candidate-utils";
import { toast } from "sonner";

interface CandidateProfileProps {
  candidate: Candidate;
  onUpdate?: (candidate: Candidate) => void;
}

export function CandidateProfile({
  candidate,
  onUpdate,
}: CandidateProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState(candidate);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Aqui você faria a chamada à API
      // const response = await fetch(`/api/recruitment/candidates/${candidate.id}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(editedCandidate),
      // });

      // Simulação
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Perfil atualizado com sucesso!");
      onUpdate?.(editedCandidate);
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCandidate(candidate);
    setIsEditing(false);
  };

  const sourceBadge = getSourceBadge(candidate.source);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Informações do Candidato</h3>
            <p className="text-sm text-muted-foreground">
              Dados pessoais e profissionais
            </p>
          </div>

          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="mr-2 size-4" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-2 size-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 size-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Informações Pessoais */}
        <div className="space-y-4">
          <h4 className="font-medium">Informações Pessoais</h4>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoField
              icon={<User className="size-4" />}
              label="Nome Completo"
              value={candidate.name}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({ ...editedCandidate, name: value })
              }
              editValue={editedCandidate.name}
            />

            <InfoField
              icon={<Mail className="size-4" />}
              label="Email"
              value={candidate.email}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({ ...editedCandidate, email: value })
              }
              editValue={editedCandidate.email}
              type="email"
            />

            <InfoField
              icon={<Phone className="size-4" />}
              label="Telefone"
              value={candidate.phone}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({ ...editedCandidate, phone: value })
              }
              editValue={editedCandidate.phone}
              type="tel"
            />

            <InfoField
              icon={<MapPin className="size-4" />}
              label="Localização"
              value={candidate.location}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({ ...editedCandidate, location: value })
              }
              editValue={editedCandidate.location}
            />
          </div>
        </div>

        <Separator />

        {/* Informações Profissionais */}
        <div className="space-y-4">
          <h4 className="font-medium">Informações Profissionais</h4>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoField
              icon={<Briefcase className="size-4" />}
              label="Cargo Atual"
              value={candidate.current_position}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({
                  ...editedCandidate,
                  current_position: value,
                })
              }
              editValue={editedCandidate.current_position}
            />

            <InfoField
              icon={<Building2 className="size-4" />}
              label="Empresa Atual"
              value={candidate.current_company}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({
                  ...editedCandidate,
                  current_company: value,
                })
              }
              editValue={editedCandidate.current_company}
            />

            <InfoField
              icon={<Linkedin className="size-4" />}
              label="LinkedIn"
              value={candidate.linkedin_url}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({ ...editedCandidate, linkedin_url: value })
              }
              editValue={editedCandidate.linkedin_url}
              isUrl
            />

            <InfoField
              icon={<Globe className="size-4" />}
              label="Portfólio"
              value={candidate.portfolio_url}
              isEditing={isEditing}
              onChange={(value) =>
                setEditedCandidate({ ...editedCandidate, portfolio_url: value })
              }
              editValue={editedCandidate.portfolio_url}
              isUrl
            />
          </div>

          {candidate.years_of_experience !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="font-medium">Experiência:</span>
              <span>{candidate.years_of_experience} anos</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Metadata */}
        <div className="space-y-4">
          <h4 className="font-medium">Informações Adicionais</h4>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Origem:</span>
              <Badge variant="secondary">{sourceBadge.label}</Badge>
            </div>

            {candidate.tags.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Tag className="mt-0.5 size-4 text-muted-foreground" />
                <div className="flex-1">
                  <span className="font-medium">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {candidate.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <Label>Notas Internas</Label>
                <Textarea
                  value={editedCandidate.notes || ""}
                  onChange={(e) =>
                    setEditedCandidate({
                      ...editedCandidate,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Adicione notas sobre o candidato..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            ) : (
              candidate.notes && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Notas Internas:</span>
                  <p className="text-sm text-muted-foreground">
                    {candidate.notes}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <Separator />

        {/* Auditoria */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Criado em {formatFullDate(candidate.created_at)}</span>
          <span>Atualizado em {formatFullDate(candidate.updated_at)}</span>
        </div>
      </div>
    </Card>
  );
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  isEditing: boolean;
  onChange: (value: string) => void;
  editValue: string | null | undefined;
  type?: string;
  isUrl?: boolean;
}

function InfoField({
  icon,
  label,
  value,
  isEditing,
  onChange,
  editValue,
  type = "text",
  isUrl = false,
}: InfoFieldProps) {
  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            {icon}
          </div>
          <Input
            type={type}
            value={editValue || ""}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9"
            placeholder={`Digite ${label.toLowerCase()}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? (
          isUrl ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm">{value}</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Não informado</p>
        )}
      </div>
    </div>
  );
}
