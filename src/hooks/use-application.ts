"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  stage_id: string
  status: "active" | "rejected" | "hired" | "withdrawn"
  rating?: number
  created_at: string
  updated_at: string
  hired_at?: string | null
  rejected_at?: string | null
  candidate?: {
    id: string
    name: string
    email: string
    phone?: string
    source: string
  }
  job?: {
    id: string
    title: string
  }
  stage?: {
    id: string
    name: string
    order: number
  }
  activities?: Array<{
    id: string
    type: string
    description: string
    created_at: string
    created_by: string
  }>
}

/**
 * Hook to manage a single application
 *
 * Provides query and mutations for:
 * - Fetching application details
 * - Updating stage
 * - Adding activities
 * - Rating candidates
 * - Real-time updates
 *
 * @param applicationId - Application ID
 * @returns Query and mutation functions
 *
 * @example
 * ```tsx
 * function ApplicationDetails({ applicationId }: { applicationId: string }) {
 *   const {
 *     data: application,
 *     isLoading,
 *     updateStage,
 *     addActivity,
 *     rate,
 *   } = useApplication(applicationId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h1>{application.candidate.name}</h1>
 *       <button onClick={() => updateStage.mutate("next-stage-id")}>
 *         Move to Next Stage
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useApplication(applicationId: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch application details
  const query = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async (): Promise<Application> => {
      const { data, error } = await supabase
        .from("recruitment_applications")
        .select(
          `
          *,
          candidate:recruitment_candidates(*),
          job:recruitment_jobs(id, title),
          stage:recruitment_pipeline_stages(id, name, order),
          activities:recruitment_activities(*)
        `
        )
        .eq("id", applicationId)
        .single()

      if (error) throw error
      return data as Application
    },
    enabled: !!applicationId,
  })

  // Update stage mutation
  const updateStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from("recruitment_applications")
        .update({ stage_id: stageId, updated_at: new Date().toISOString() })
        .eq("id", applicationId)

      if (error) throw error

      // Add activity
      await supabase.from("recruitment_activities").insert({
        application_id: applicationId,
        type: "stage_change",
        description: `Candidato movido para novo estágio`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] })
      toast.success("Estágio atualizado com sucesso")
    },
    onError: (error) => {
      toast.error("Erro ao atualizar estágio: " + error.message)
    },
  })

  // Add activity mutation
  const addActivity = useMutation({
    mutationFn: async ({
      type,
      description,
    }: {
      type: string
      description: string
    }) => {
      const { error } = await supabase.from("recruitment_activities").insert({
        application_id: applicationId,
        type,
        description,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
      toast.success("Atividade adicionada")
    },
    onError: (error) => {
      toast.error("Erro ao adicionar atividade: " + error.message)
    },
  })

  // Rate candidate mutation
  const rate = useMutation({
    mutationFn: async (rating: number) => {
      const { error } = await supabase
        .from("recruitment_applications")
        .update({ rating, updated_at: new Date().toISOString() })
        .eq("id", applicationId)

      if (error) throw error

      // Add activity
      await supabase.from("recruitment_activities").insert({
        application_id: applicationId,
        type: "rating",
        description: `Candidato avaliado com ${rating} estrelas`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
      toast.success("Avaliação salva")
    },
    onError: (error) => {
      toast.error("Erro ao salvar avaliação: " + error.message)
    },
  })

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (status: "active" | "rejected" | "hired" | "withdrawn") => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === "hired") {
        updates.hired_at = new Date().toISOString()
      } else if (status === "rejected") {
        updates.rejected_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from("recruitment_applications")
        .update(updates)
        .eq("id", applicationId)

      if (error) throw error

      // Add activity
      await supabase.from("recruitment_activities").insert({
        application_id: applicationId,
        type: "status_change",
        description: `Status alterado para ${status}`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] })
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] })
      toast.success("Status atualizado")
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message)
    },
  })

  return {
    ...query,
    updateStage,
    addActivity,
    rate,
    updateStatus,
  }
}
