"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { JobFormData } from "@/lib/types/recruitment"
import { Button } from "@/components/ui/button"
import { JobForm } from "@/components/recruitment/JobForm"

export default function NovaVagaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (data: JobFormData) => {
    setIsLoading(true)

    try {
      // TODO: Implement API call to create job
      console.log("Creating job:", data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Vaga criada com sucesso!")
      router.push("/recrutamento/vagas")
    } catch (error) {
      console.error("Error creating job:", error)
      toast.error("Erro ao criar vaga. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recrutamento/vagas">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Vaga</h1>
          <p className="text-muted-foreground">
            Crie uma nova vaga de emprego para sua empresa
          </p>
        </div>
      </div>

      {/* Form */}
      <JobForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Criar Vaga" />
    </div>
  )
}
