"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PublicJobCard } from "./PublicJobCard"
import { Loader2 } from "lucide-react"
import type { Job } from "@/types/recruitment"

interface PublicJobsListProps {
  filters?: {
    search?: string
    department?: string
    location?: string
    job_type?: string
    location_type?: string
  }
}

export function PublicJobsList({ filters = {} }: PublicJobsListProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('publish_externally', true)
        .eq('status', 'open')
        .order('published_at', { ascending: false })

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.department) {
        query = query.eq('department', filters.department)
      }

      if (filters.location) {
        query = query.eq('location', filters.location)
      }

      if (filters.job_type) {
        query = query.eq('employment_type', filters.job_type)
      }

      if (filters.location_type) {
        query = query.eq('location_type', filters.location_type)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching jobs:', error)
      } else {
        setJobs(data || [])
      }

      setLoading(false)
    }

    fetchJobs()
  }, [filters, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-muted-foreground mb-2">
          Nenhuma vaga encontrada
        </p>
        <p className="text-sm text-muted-foreground">
          Tente ajustar os filtros ou volte mais tarde para ver novas oportunidades.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        {jobs.length} {jobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <PublicJobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
