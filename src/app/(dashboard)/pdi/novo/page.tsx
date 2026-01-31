"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  User,
  Target,
  Calendar,
  Loader2,
  Save,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getCurrentProfile, listEmployees, createPDI } from "@/lib/supabase/queries"
import type { Employee } from "@/types/database"

interface Objective {
  id: string
  title: string
  description: string
  target_date: string
  status: string
  progress: number
  category: string
}

export default function NovoPDIPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [employees, setEmployees] = React.useState<Employee[]>([])

  // Form state
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [targetDate, setTargetDate] = React.useState("")
  const [objectives, setObjectives] = React.useState<Objective[]>([])

  React.useEffect(() => {
    async function loadEmployees() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          return
        }

        const companyId = profileResult.data.company_id
        const result = await listEmployees(companyId, { status: "active" })

        if (result.data) {
          setEmployees(result.data)
        }

        // Set default target date to 6 months from now
        const defaultTarget = new Date()
        defaultTarget.setMonth(defaultTarget.getMonth() + 6)
        setTargetDate(defaultTarget.toISOString().split("T")[0])
      } catch {
        toast.error("Erro ao carregar funcionarios")
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [])

  const addObjective = () => {
    const newObjective: Objective = {
      id: `obj_${Date.now()}`,
      title: "",
      description: "",
      target_date: targetDate,
      status: "pending",
      progress: 0,
      category: "tecnica",
    }
    setObjectives([...objectives, newObjective])
  }

  const updateObjective = (id: string, field: keyof Objective, value: string | number) => {
    setObjectives(objectives.map(obj =>
      obj.id === id ? { ...obj, [field]: value } : obj
    ))
  }

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter(obj => obj.id !== id))
  }

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um funcionario")
      return
    }

    if (!title.trim()) {
      toast.error("Informe o titulo do PDI")
      return
    }

    if (!targetDate) {
      toast.error("Informe a data meta")
      return
    }

    if (objectives.length === 0) {
      toast.error("Adicione pelo menos um objetivo")
      return
    }

    const invalidObjectives = objectives.filter(obj => !obj.title.trim())
    if (invalidObjectives.length > 0) {
      toast.error("Preencha o titulo de todos os objetivos")
      return
    }

    setIsSaving(true)
    try {
      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao carregar perfil")
        return
      }

      const result = await createPDI({
        company_id: profileResult.data.company_id,
        employee_id: selectedEmployeeId,
        title,
        description,
        start_date: startDate,
        target_date: targetDate,
        objectives,
        created_by: profileResult.data.id,
      })

      if (result.error) {
        toast.error("Erro ao criar PDI")
        return
      }

      toast.success("PDI criado com sucesso!")
      router.push("/pdi")
    } catch {
      toast.error("Erro ao criar PDI")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pdi">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo PDI</h1>
          <p className="text-muted-foreground">
            Crie um Plano de Desenvolvimento Individual manualmente
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Funcionario
              </CardTitle>
              <CardDescription>
                Selecione o funcionario para este PDI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionario" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>{employee.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {employee.position} - {employee.department || "Sem departamento"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Informacoes do PDI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  placeholder="Ex: PDI 2024 - Desenvolvimento de Lideranca"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os objetivos gerais deste PDI..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Data Meta *</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="size-5" />
                    Objetivos
                  </CardTitle>
                  <CardDescription>
                    Adicione os objetivos do PDI
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addObjective}>
                  <Plus className="mr-2 size-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {objectives.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="mx-auto size-10 opacity-50 mb-2" />
                  <p>Nenhum objetivo adicionado</p>
                  <p className="text-sm">Clique em "Adicionar" para criar objetivos</p>
                </div>
              ) : (
                objectives.map((obj, index) => (
                  <div key={obj.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => removeObjective(obj.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Titulo *</Label>
                      <Input
                        placeholder="Ex: Desenvolver habilidades de comunicacao"
                        value={obj.title}
                        onChange={(e) => updateObjective(obj.id, "title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descricao</Label>
                      <Textarea
                        placeholder="Descreva este objetivo..."
                        value={obj.description}
                        onChange={(e) => updateObjective(obj.id, "description", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select
                          value={obj.category}
                          onValueChange={(value) => updateObjective(obj.id, "category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tecnica">Tecnica</SelectItem>
                            <SelectItem value="comportamental">Comportamental</SelectItem>
                            <SelectItem value="lideranca">Lideranca</SelectItem>
                            <SelectItem value="comunicacao">Comunicacao</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data Meta</Label>
                        <Input
                          type="date"
                          value={obj.target_date}
                          onChange={(e) => updateObjective(obj.id, "target_date", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-5" />
                Salvar PDI
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
