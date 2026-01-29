/**
 * Recruitment Filters Utilities
 *
 * Functions for filtering jobs, candidates, and applications with Supabase queries.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface JobFilters {
  status?: string[]
  department?: string[]
  location_type?: string[]
  employment_type?: string[]
  search?: string
}

export interface CandidateFilters {
  source?: string[]
  rating?: number[]
  search?: string
}

export interface ApplicationFilters {
  status?: string[]
  stage_id?: string[]
  job_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

/**
 * Filter jobs based on criteria
 */
export function filterJobs<T extends Record<string, any>>(
  jobs: T[],
  filters: JobFilters
): T[] {
  let filtered = [...jobs]

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((job) => filters.status!.includes(job.status))
  }

  if (filters.department && filters.department.length > 0) {
    filtered = filtered.filter((job) =>
      filters.department!.includes(job.department)
    )
  }

  if (filters.location_type && filters.location_type.length > 0) {
    filtered = filtered.filter((job) =>
      filters.location_type!.includes(job.location_type)
    )
  }

  if (filters.employment_type && filters.employment_type.length > 0) {
    filtered = filtered.filter((job) =>
      filters.employment_type!.includes(job.employment_type)
    )
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (job) =>
        job.title?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.department?.toLowerCase().includes(searchLower)
    )
  }

  return filtered
}

/**
 * Filter candidates based on criteria
 */
export function filterCandidates<T extends Record<string, any>>(
  candidates: T[],
  filters: CandidateFilters
): T[] {
  let filtered = [...candidates]

  if (filters.source && filters.source.length > 0) {
    filtered = filtered.filter((candidate) =>
      filters.source!.includes(candidate.source)
    )
  }

  if (filters.rating && filters.rating.length > 0) {
    filtered = filtered.filter((candidate) =>
      filters.rating!.includes(candidate.rating)
    )
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (candidate) =>
        candidate.name?.toLowerCase().includes(searchLower) ||
        candidate.email?.toLowerCase().includes(searchLower) ||
        candidate.phone?.toLowerCase().includes(searchLower)
    )
  }

  return filtered
}

/**
 * Filter applications based on criteria
 */
export function filterApplications<T extends Record<string, any>>(
  applications: T[],
  filters: ApplicationFilters
): T[] {
  let filtered = [...applications]

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((app) => filters.status!.includes(app.status))
  }

  if (filters.stage_id && filters.stage_id.length > 0) {
    filtered = filtered.filter((app) =>
      filters.stage_id!.includes(app.stage_id)
    )
  }

  if (filters.job_id) {
    filtered = filtered.filter((app) => app.job_id === filters.job_id)
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (app) =>
        app.candidate?.name?.toLowerCase().includes(searchLower) ||
        app.candidate?.email?.toLowerCase().includes(searchLower) ||
        app.job?.title?.toLowerCase().includes(searchLower)
    )
  }

  if (filters.date_from) {
    filtered = filtered.filter(
      (app) => new Date(app.created_at) >= new Date(filters.date_from!)
    )
  }

  if (filters.date_to) {
    filtered = filtered.filter(
      (app) => new Date(app.created_at) <= new Date(filters.date_to!)
    )
  }

  return filtered
}

/**
 * Build Supabase query from job filters
 */
export function buildJobFilterQuery(
  query: ReturnType<SupabaseClient['from']>,
  filters: JobFilters
) {
  let q = query

  if (filters.status && filters.status.length > 0) {
    q = q.in('status', filters.status)
  }

  if (filters.department && filters.department.length > 0) {
    q = q.in('department', filters.department)
  }

  if (filters.location_type && filters.location_type.length > 0) {
    q = q.in('location_type', filters.location_type)
  }

  if (filters.employment_type && filters.employment_type.length > 0) {
    q = q.in('employment_type', filters.employment_type)
  }

  if (filters.search) {
    q = q.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,department.ilike.%${filters.search}%`
    )
  }

  return q
}

/**
 * Build Supabase query from candidate filters
 */
export function buildCandidateFilterQuery(
  query: ReturnType<SupabaseClient['from']>,
  filters: CandidateFilters
) {
  let q = query

  if (filters.source && filters.source.length > 0) {
    q = q.in('source', filters.source)
  }

  if (filters.rating && filters.rating.length > 0) {
    q = q.in('rating', filters.rating)
  }

  if (filters.search) {
    q = q.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    )
  }

  return q
}

/**
 * Build Supabase query from application filters
 */
export function buildApplicationFilterQuery(
  query: ReturnType<SupabaseClient['from']>,
  filters: ApplicationFilters
) {
  let q = query

  if (filters.status && filters.status.length > 0) {
    q = q.in('status', filters.status)
  }

  if (filters.stage_id && filters.stage_id.length > 0) {
    q = q.in('stage_id', filters.stage_id)
  }

  if (filters.job_id) {
    q = q.eq('job_id', filters.job_id)
  }

  if (filters.date_from) {
    q = q.gte('created_at', filters.date_from)
  }

  if (filters.date_to) {
    q = q.lte('created_at', filters.date_to)
  }

  // Note: search on related tables would need separate join logic
  // This would be handled in the query function itself

  return q
}
