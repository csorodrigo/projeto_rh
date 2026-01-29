"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Candidate, ApplicationSource, CandidateRating } from "@/types/recruitment";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/recruitment/RatingDisplay";
import { MergeCandidatesModal } from "@/components/recruitment/MergeCandidatesModal";
import {
  getInitials,
  getColorForName,
  getSourceBadge,
  formatRelativeTime,
  findDuplicateCandidates,
} from "@/lib/recruitment/candidate-utils";
import {
  MoreHorizontal,
  Eye,
  FileDown,
  Merge,
  Plus,
  Filter,
  AlertCircle,
  UserPlus,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock data - substituir por chamada real à API
const mockCandidates: Candidate[] = [
  {
    id: "1",
    company_id: "company-1",
    name: "Ana Silva",
    email: "ana.silva@email.com",
    phone: "(11) 98765-4321",
    location: "São Paulo, SP",
    current_position: "Desenvolvedora Full Stack",
    current_company: "Tech Corp",
    linkedin_url: "https://linkedin.com/in/anasilva",
    portfolio_url: null,
    years_of_experience: 5,
    resume_url: "/resumes/ana-silva.pdf",
    resume_filename: "curriculo-ana-silva.pdf",
    cover_letter: null,
    source: "linkedin",
    tags: ["react", "node.js", "typescript"],
    rating: 4,
    notes: "Excelente candidata, perfil sênior",
    is_blacklisted: false,
    blacklist_reason: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T15:30:00Z",
    created_by: "user-1",
  },
  {
    id: "2",
    company_id: "company-1",
    name: "Carlos Santos",
    email: "carlos.santos@email.com",
    phone: "(21) 99876-5432",
    location: "Rio de Janeiro, RJ",
    current_position: "Product Designer",
    current_company: "Design Studio",
    linkedin_url: "https://linkedin.com/in/carlossantos",
    portfolio_url: "https://carlossantos.design",
    years_of_experience: 3,
    resume_url: "/resumes/carlos-santos.pdf",
    resume_filename: "cv-carlos-santos.pdf",
    cover_letter: "Tenho grande interesse em fazer parte da equipe...",
    source: "careers_page",
    tags: ["ui/ux", "figma", "design systems"],
    rating: 5,
    notes: null,
    is_blacklisted: false,
    blacklist_reason: null,
    created_at: "2024-01-18T14:20:00Z",
    updated_at: "2024-01-22T09:15:00Z",
    created_by: "user-1",
  },
];

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<{
    primary: Candidate;
    duplicate: Candidate;
  } | null>(null);

  // Detecta duplicados
  const duplicates = useMemo(() => {
    return findDuplicateCandidates(candidates);
  }, [candidates]);

  // Filtros
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (sourceFilter !== "all" && candidate.source !== sourceFilter) {
        return false;
      }

      if (ratingFilter !== "all") {
        const rating = parseInt(ratingFilter);
        if (!candidate.rating || candidate.rating < rating) {
          return false;
        }
      }

      if (tagFilter && !candidate.tags.some((tag) => tag.includes(tagFilter))) {
        return false;
      }

      return true;
    });
  }, [candidates, sourceFilter, ratingFilter, tagFilter]);

  const handleMerge = (candidate: Candidate, duplicate: Candidate) => {
    setSelectedForMerge({ primary: candidate, duplicate });
    setShowMergeModal(true);
  };

  const handleMergeComplete = (mergedId: string) => {
    // Atualizar lista de candidatos
    toast.success("Candidatos mesclados com sucesso!");
    // Recarregar dados...
  };

  const handleExport = () => {
    toast.success("Exportando candidatos...");
    // Implementar exportação
  };

  const columns: ColumnDef<Candidate>[] = [
    {
      id: "candidate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Candidato" />
      ),
      cell: ({ row }) => {
        const candidate = row.original;
        const hasDuplicate = Array.from(duplicates.values()).some((dups) =>
          dups.some((d) => d.id === candidate.id)
        );

        return (
          <div className="flex items-center gap-3">
            <Avatar className={getColorForName(candidate.name)}>
              <AvatarFallback className="text-white">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{candidate.name}</span>
                {hasDuplicate && (
                  <Badge
                    variant="destructive"
                    className="text-xs"
                    title="Possível duplicado detectado"
                  >
                    <AlertCircle className="mr-1 size-3" />
                    Duplicado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3" />
                {candidate.email}
              </div>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Telefone" />
      ),
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string | null;
        return phone ? (
          <div className="flex items-center gap-2">
            <Phone className="size-3 text-muted-foreground" />
            {phone}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "current_position",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cargo Atual" />
      ),
      cell: ({ row }) => {
        const position = row.getValue("current_position") as string | null;
        const company = row.original.current_company;
        return position ? (
          <div className="flex flex-col">
            <span className="font-medium">{position}</span>
            {company && (
              <span className="text-xs text-muted-foreground">{company}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Origem" />
      ),
      cell: ({ row }) => {
        const source = row.getValue("source") as ApplicationSource;
        const badge = getSourceBadge(source);
        return (
          <Badge variant="secondary" className="text-xs">
            {badge.label}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Avaliação" />
      ),
      cell: ({ row }) => {
        const rating = row.getValue("rating") as CandidateRating | null;
        return rating ? (
          <RatingStars rating={rating} showCount={false} size="sm" />
        ) : (
          <span className="text-xs text-muted-foreground">Sem avaliação</span>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Última Atividade" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("updated_at") as string;
        return (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(date)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const candidate = row.original;
        const duplicateGroup = Array.from(duplicates.values()).find((dups) =>
          dups.some((d) => d.id === candidate.id)
        );
        const possibleDuplicate =
          duplicateGroup && duplicateGroup.find((d) => d.id !== candidate.id);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/recrutamento/candidatos/${candidate.id}`)
                }
              >
                <Eye className="mr-2 size-4" />
                Ver Perfil
              </DropdownMenuItem>
              {possibleDuplicate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleMerge(candidate, possibleDuplicate)}
                  >
                    <Merge className="mr-2 size-4" />
                    Mesclar com Duplicado
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileDown className="mr-2 size-4" />
                Exportar Dados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidatos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os candidatos do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 size-4" />
            Exportar
          </Button>
          <Button asChild>
            <Link href="/recrutamento/candidatos/novo">
              <UserPlus className="mr-2 size-4" />
              Novo Candidato
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="careers_page">Site de Carreiras</SelectItem>
              <SelectItem value="indeed">Indeed</SelectItem>
              <SelectItem value="referral">Indicação</SelectItem>
              <SelectItem value="direct">Direto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Avaliações</SelectItem>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4+ estrelas</SelectItem>
              <SelectItem value="3">3+ estrelas</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filtrar por tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-[200px]"
          />

          {(sourceFilter !== "all" ||
            ratingFilter !== "all" ||
            tagFilter !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceFilter("all");
                setRatingFilter("all");
                setTagFilter("");
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Alerta de duplicados */}
      {duplicates.size > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                {duplicates.size} candidato(s) duplicado(s) detectado(s)
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Candidatos com o mesmo email foram identificados. Use a ação
                "Mesclar com Duplicado" para consolidar os registros.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={filteredCandidates}
        searchKey="candidate"
        searchPlaceholder="Buscar por nome ou email..."
        onRowClick={(row) =>
          router.push(`/recrutamento/candidatos/${row.original.id}`)
        }
      />

      {/* Modal de mesclagem */}
      {selectedForMerge && (
        <MergeCandidatesModal
          open={showMergeModal}
          onOpenChange={setShowMergeModal}
          primaryCandidate={selectedForMerge.primary}
          duplicateCandidate={selectedForMerge.duplicate}
          onMerge={handleMergeComplete}
        />
      )}
    </div>
  );
}
