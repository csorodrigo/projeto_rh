export type JobStatus = "open" | "paused" | "closed" | "draft"

export type JobType = "full_time" | "part_time" | "contract" | "temporary" | "internship"

export type JobLocation = "onsite" | "remote" | "hybrid"

export interface Job {
  id: string
  company_id: string
  title: string
  department: string
  location: string
  location_type: JobLocation
  job_type: JobType
  status: JobStatus
  description: string
  requirements: string[]
  benefits: string[]
  salary_min?: number
  salary_max?: number
  positions: number
  positions_filled: number
  hiring_manager_id?: string
  publish_internal: boolean
  publish_external: boolean
  created_at: string
  updated_at: string
  closed_at?: string
  created_by: string

  // Relations
  hiring_manager?: {
    id: string
    name: string
    email: string
  }
  applications_count?: number
  candidates_by_stage?: {
    stage: string
    count: number
  }[]
}

export interface JobFormData {
  title: string
  department: string
  location: string
  location_type: JobLocation
  job_type: JobType
  description: string
  requirements: string[]
  benefits: string[]
  salary_min?: number
  salary_max?: number
  positions: number
  hiring_manager_id?: string
  publish_internal: boolean
  publish_external: boolean
  status: JobStatus
}

export interface JobStats {
  total_jobs: number
  open_jobs: number
  paused_jobs: number
  closed_jobs: number
  total_applications: number
  applications_this_week: number
  in_process: number
  avg_time_to_hire: number
}

export interface JobFilters {
  status?: JobStatus[]
  department?: string[]
  job_type?: JobType[]
  location_type?: JobLocation[]
  date_from?: string
  date_to?: string
}
