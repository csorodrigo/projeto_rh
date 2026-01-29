"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Clock,
  Calendar,
  FileText,
  Heart,
  Target,
  DollarSign,
  Settings,
  Search,
  Briefcase,
  UserPlus,
  TrendingUp,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-64"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar funcionários, ausências, documentos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Navegação">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <Search className="mr-2 h-4 w-4 text-purple-600" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/funcionarios"))}
            >
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              <span>Funcionários</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/ponto"))}
            >
              <Clock className="mr-2 h-4 w-4 text-green-600" />
              <span>Ponto</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/ausencias"))}
            >
              <Calendar className="mr-2 h-4 w-4 text-orange-600" />
              <span>Ausências</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/pdi"))}
            >
              <Target className="mr-2 h-4 w-4 text-pink-600" />
              <span>PDI</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/saude"))}
            >
              <Heart className="mr-2 h-4 w-4 text-red-600" />
              <span>Saúde</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/folha"))}
            >
              <DollarSign className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Folha</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/recrutamento"))}
            >
              <Briefcase className="mr-2 h-4 w-4 text-purple-500" />
              <span>Recrutamento</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Ações Rápidas">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/funcionarios/novo"))}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Novo Funcionário</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/ponto/registro"))}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>Registrar Ponto</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/ausencias/solicitar"))}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Solicitar Ausência</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/relatorios"))}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Gerar Relatório</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/recrutamento/vagas/nova"))}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Nova Vaga</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/recrutamento/pipeline"))}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Ver Pipeline</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/recrutamento/candidatos/novo"))}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Adicionar Candidato</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Configurações">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/config"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
