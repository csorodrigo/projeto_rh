"use client";

import { useState } from "react";
import { Candidate } from "@/types/recruitment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Star,
  Tag,
  Loader2,
} from "lucide-react";
import { getInitials, getColorForName } from "@/lib/recruitment/candidate-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MergeCandidatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryCandidate: Candidate;
  duplicateCandidate: Candidate;
  onMerge?: (mergedId: string) => void;
}

type FieldPreference = "primary" | "duplicate";

export function MergeCandidatesModal({
  open,
  onOpenChange,
  primaryCandidate,
  duplicateCandidate,
  onMerge,
}: MergeCandidatesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldPreferences, setFieldPreferences] = useState<
    Record<string, FieldPreference>
  >({
    name: "primary",
    email: "primary",
    phone: "primary",
    location: "primary",
    current_position: "primary",
    current_company: "primary",
    linkedin_url: "primary",
    portfolio_url: "primary",
    rating: "primary",
    tags: "primary",
    notes: "primary",
  });

  const handleFieldChange = (field: string, value: FieldPreference) => {
    setFieldPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleMerge = async () => {
    setIsSubmitting(true);

    try {
      // Aqui você faria a chamada à API
      // const response = await fetch(`/api/recruitment/candidates/${primaryCandidate.id}/merge`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     duplicate_candidate_id: duplicateCandidate.id,
      //     field_preferences: fieldPreferences,
      //   }),
      // });

      // Simulação
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Candidatos mesclados com sucesso!");
      onMerge?.(primaryCandidate.id);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao mesclar candidatos");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mesclar Candidatos Duplicados</DialogTitle>
          <DialogDescription>
            Escolha quais informações manter de cada candidato. As aplicações
            serão consolidadas no candidato principal.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. O
            candidato duplicado será removido e todas as suas aplicações serão
            transferidas para o candidato principal.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Headers dos candidatos */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
            <CandidateHeader
              candidate={primaryCandidate}
              label="Candidato Principal"
              isPrimary
            />
            <div className="flex items-center justify-center">
              <ArrowRight className="size-5 text-muted-foreground" />
            </div>
            <CandidateHeader
              candidate={duplicateCandidate}
              label="Candidato Duplicado"
            />
          </div>

          <Separator />

          {/* Comparação campo a campo */}
          <div className="space-y-4">
            <h4 className="font-semibold">Escolha os dados a manter:</h4>

            <FieldComparison
              label="Nome"
              icon={<Check className="size-4" />}
              primaryValue={primaryCandidate.name}
              duplicateValue={duplicateCandidate.name}
              field="name"
              preference={fieldPreferences.name}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="Email"
              icon={<Mail className="size-4" />}
              primaryValue={primaryCandidate.email}
              duplicateValue={duplicateCandidate.email}
              field="email"
              preference={fieldPreferences.email}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="Telefone"
              icon={<Phone className="size-4" />}
              primaryValue={primaryCandidate.phone}
              duplicateValue={duplicateCandidate.phone}
              field="phone"
              preference={fieldPreferences.phone}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="Localização"
              icon={<MapPin className="size-4" />}
              primaryValue={primaryCandidate.location}
              duplicateValue={duplicateCandidate.location}
              field="location"
              preference={fieldPreferences.location}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="Cargo Atual"
              icon={<Briefcase className="size-4" />}
              primaryValue={primaryCandidate.current_position}
              duplicateValue={duplicateCandidate.current_position}
              field="current_position"
              preference={fieldPreferences.current_position}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="Empresa Atual"
              icon={<Briefcase className="size-4" />}
              primaryValue={primaryCandidate.current_company}
              duplicateValue={duplicateCandidate.current_company}
              field="current_company"
              preference={fieldPreferences.current_company}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="LinkedIn"
              icon={<Linkedin className="size-4" />}
              primaryValue={primaryCandidate.linkedin_url}
              duplicateValue={duplicateCandidate.linkedin_url}
              field="linkedin_url"
              preference={fieldPreferences.linkedin_url}
              onChange={handleFieldChange}
              isUrl
            />

            <FieldComparison
              label="Rating"
              icon={<Star className="size-4" />}
              primaryValue={
                primaryCandidate.rating ? `${primaryCandidate.rating}/5` : null
              }
              duplicateValue={
                duplicateCandidate.rating ? `${duplicateCandidate.rating}/5` : null
              }
              field="rating"
              preference={fieldPreferences.rating}
              onChange={handleFieldChange}
            />

            <FieldComparison
              label="Tags"
              icon={<Tag className="size-4" />}
              primaryValue={
                primaryCandidate.tags.length > 0
                  ? primaryCandidate.tags.join(", ")
                  : null
              }
              duplicateValue={
                duplicateCandidate.tags.length > 0
                  ? duplicateCandidate.tags.join(", ")
                  : null
              }
              field="tags"
              preference={fieldPreferences.tags}
              onChange={handleFieldChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleMerge} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Mesclar Candidatos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CandidateHeaderProps {
  candidate: Candidate;
  label: string;
  isPrimary?: boolean;
}

function CandidateHeader({
  candidate,
  label,
  isPrimary = false,
}: CandidateHeaderProps) {
  return (
    <Card className={cn("p-4", isPrimary && "border-primary")}>
      <div className="flex items-center gap-3">
        <Avatar className={getColorForName(candidate.name)}>
          <AvatarFallback className="text-white">
            {getInitials(candidate.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{candidate.name}</p>
            {isPrimary && (
              <Badge variant="default" className="text-xs">
                Principal
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{candidate.email}</p>
        </div>
      </div>
    </Card>
  );
}

interface FieldComparisonProps {
  label: string;
  icon: React.ReactNode;
  primaryValue: string | null | undefined;
  duplicateValue: string | null | undefined;
  field: string;
  preference: FieldPreference;
  onChange: (field: string, value: FieldPreference) => void;
  isUrl?: boolean;
}

function FieldComparison({
  label,
  icon,
  primaryValue,
  duplicateValue,
  field,
  preference,
  onChange,
  isUrl = false,
}: FieldComparisonProps) {
  const hasDifference = primaryValue !== duplicateValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{label}</span>
        {!hasDifference && (
          <Badge variant="secondary" className="text-xs">
            Igual
          </Badge>
        )}
      </div>

      <RadioGroup
        value={preference}
        onValueChange={(value) => onChange(field, value as FieldPreference)}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="primary" id={`${field}-primary`} />
          <Label
            htmlFor={`${field}-primary`}
            className="flex-1 cursor-pointer rounded-md border p-3 text-sm"
          >
            {primaryValue ? (
              isUrl ? (
                <a
                  href={primaryValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {primaryValue}
                </a>
              ) : (
                primaryValue
              )
            ) : (
              <span className="text-muted-foreground">Não informado</span>
            )}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="duplicate" id={`${field}-duplicate`} />
          <Label
            htmlFor={`${field}-duplicate`}
            className="flex-1 cursor-pointer rounded-md border p-3 text-sm"
          >
            {duplicateValue ? (
              isUrl ? (
                <a
                  href={duplicateValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {duplicateValue}
                </a>
              ) : (
                duplicateValue
              )
            ) : (
              <span className="text-muted-foreground">Não informado</span>
            )}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
