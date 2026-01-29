"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  calculateTimeToHire,
  calculateConversionRate,
  groupBySource,
} from "@/lib/recruitment/stats"

export interface RecruitmentStats {
  totalJobs: number
  totalOpenJobs: number
  totalCandidates: number
  totalApplications: number
  avgTimeToHire: number
  conversionRate: number
  candidatesByStage: Array<{
    stage: string
    count: number
  }>
  candidatesBySource: Record<string, number>
}

/**
 * Hook to fetch recruitment statistics
 *
 * Fetches and calculates key recruitment metrics including:
 * - Total jobs and open positions
 * - Total candidates and applications
 * - Average time to hire
 * - Conversion rate
 * - Candidates by stage and source
 *
 * @param companyId - Company ID to fetch stats for
 * @returns Query result with statistics data
 *
 * @example
 * ```tsx
 * function DashboardStats({ companyId }: { companyId: string }) {
 *   const { data, isLoading, error } = useRecruitmentStats(companyId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       <p>Open Jobs: {data.totalOpenJobs}</p>
 *       <p>Total Candidates: {data.totalCandidates}</p>
 *       <p>Avg Time to Hire: {data.avgTimeToHire} days</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRecruitmentStats(companyId: string) {
  return useQuery({
    queryKey: ["recruitment-stats", companyId],
    queryFn: async (): Promise<RecruitmentStats> => {
      const supabase = createClient()

      // Fetch jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("recruitment_jobs")
        .select("id, status")
        .eq("company_id", companyId)

      if (jobsError) throw jobsError

      // Fetch applications with related data
      const { data: applications, error: applicationsError } = await supabase
        .from("recruitment_applications")
        .select(
          `
          id,
          status,
          stage_id,
          created_at,
          hired_at,
          rejected_at,
          candidate:recruitment_candidates(id, source)
        `
        )
        .eq("company_id", companyId)

      if (applicationsError) throw applicationsError

      // Fetch stages for grouping
      const { data: stages, error: stagesError } = await supabase
        .from("recruitment_pipeline_stages")
        .select("id, name, order")
        .eq("company_id", companyId)
        .order("order")

      if (stagesError) throw stagesError

      // Calculate stats
      const totalJobs = jobs?.length || 0
      const totalOpenJobs =
        jobs?.filter((job) => job.status === "open").length || 0

      const totalApplications = applications?.length || 0

      // Get unique candidates
      const uniqueCandidateIds = new Set(
        applications?.map((app: any) => app.candidate?.id).filter(Boolean)
      )
      const totalCandidates = uniqueCandidateIds.size

      // Calculate time to hire
      const avgTimeToHire = calculateTimeToHire(applications || [])

      // Calculate overall conversion rate
      const conversionRate = calculateConversionRate(applications || [])

      // Group candidates by stage
      const candidatesByStage =
        stages?.map((stage) => ({
          stage: stage.name,
          count:
            applications?.filter((app: any) => app.stage_id === stage.id)
              .length || 0,
        })) || []

      // Group candidates by source
      const candidates =
        applications
          ?.map((app: any) => app.candidate)
          .filter(Boolean) || []
      const candidatesBySource = groupBySource(candidates)

      return {
        totalJobs,
        totalOpenJobs,
        totalCandidates,
        totalApplications,
        avgTimeToHire,
        conversionRate,
        candidatesByStage,
        candidatesBySource,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}
