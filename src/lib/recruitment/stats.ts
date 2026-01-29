/**
 * Recruitment Statistics Utilities
 *
 * Functions for calculating recruitment KPIs and analytics.
 */

import { differenceInDays } from 'date-fns'

export interface Application {
  id: string
  status: 'active' | 'rejected' | 'hired' | 'withdrawn'
  stage_id?: string
  created_at: string
  hired_at?: string | null
  rejected_at?: string | null
}

export interface Stage {
  id: string
  name: string
  order: number
}

export interface Candidate {
  id: string
  source: 'portal' | 'linkedin' | 'indicacao' | 'outro'
}

export interface FunnelData {
  stage: string
  count: number
  conversionRate: number
  dropoffRate: number
}

/**
 * Calculate average time to hire in days
 */
export function calculateTimeToHire(applications: Application[]): number {
  const hiredApplications = applications.filter(
    (app) => app.status === 'hired' && app.hired_at
  )

  if (hiredApplications.length === 0) return 0

  const totalDays = hiredApplications.reduce((sum, app) => {
    const startDate = new Date(app.created_at)
    const endDate = new Date(app.hired_at!)
    return sum + differenceInDays(endDate, startDate)
  }, 0)

  return Math.round(totalDays / hiredApplications.length)
}

/**
 * Calculate conversion rate for a specific stage or overall
 */
export function calculateConversionRate(
  applications: Application[],
  targetStage?: string
): number {
  if (applications.length === 0) return 0

  let converted = 0

  if (targetStage) {
    // Stage-specific conversion
    converted = applications.filter((app) => app.stage_id === targetStage).length
  } else {
    // Overall conversion to hired
    converted = applications.filter((app) => app.status === 'hired').length
  }

  return Math.round((converted / applications.length) * 100)
}

/**
 * Calculate funnel data with conversion and dropoff rates
 */
export function calculateFunnelData(
  applications: Application[],
  stages: Stage[]
): FunnelData[] {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order)
  const totalApplications = applications.length

  if (totalApplications === 0) {
    return sortedStages.map((stage) => ({
      stage: stage.name,
      count: 0,
      conversionRate: 0,
      dropoffRate: 0,
    }))
  }

  return sortedStages.map((stage, index) => {
    const count = applications.filter((app) => app.stage_id === stage.id).length
    const conversionRate = (count / totalApplications) * 100

    // Calculate dropoff from previous stage
    let dropoffRate = 0
    if (index > 0) {
      const previousStage = sortedStages[index - 1]
      const previousCount = applications.filter(
        (app) => app.stage_id === previousStage.id
      ).length

      if (previousCount > 0) {
        dropoffRate = ((previousCount - count) / previousCount) * 100
      }
    }

    return {
      stage: stage.name,
      count,
      conversionRate: Math.round(conversionRate),
      dropoffRate: Math.round(dropoffRate),
    }
  })
}

/**
 * Group candidates by source
 */
export function groupBySource(candidates: Candidate[]): Record<string, number> {
  const grouped: Record<string, number> = {
    portal: 0,
    linkedin: 0,
    indicacao: 0,
    outro: 0,
  }

  candidates.forEach((candidate) => {
    grouped[candidate.source] = (grouped[candidate.source] || 0) + 1
  })

  return grouped
}

/**
 * Calculate stage dropoff analysis
 */
export function calculateStageDropoff(
  applications: Application[],
  stages: Stage[]
): Array<{
  stage: string
  entered: number
  exited: number
  dropoffCount: number
  dropoffRate: number
}> {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  return sortedStages.map((stage, index) => {
    const entered = applications.filter((app) => app.stage_id === stage.id).length

    // Calculate how many moved to next stage
    let exited = 0
    if (index < sortedStages.length - 1) {
      const nextStageId = sortedStages[index + 1].id
      exited = applications.filter((app) => app.stage_id === nextStageId).length
    } else {
      // Last stage - count hired
      exited = applications.filter((app) => app.status === 'hired').length
    }

    const dropoffCount = entered - exited
    const dropoffRate = entered > 0 ? (dropoffCount / entered) * 100 : 0

    return {
      stage: stage.name,
      entered,
      exited,
      dropoffCount,
      dropoffRate: Math.round(dropoffRate),
    }
  })
}

/**
 * Calculate recruitment velocity metrics
 */
export interface VelocityMetrics {
  avgDaysInStage: Record<string, number>
  slowestStage: string
  fastestStage: string
}

export function calculateVelocity(
  applications: Application[],
  stages: Stage[]
): VelocityMetrics {
  const stageVelocity: Record<string, { total: number; count: number }> = {}

  // Initialize
  stages.forEach((stage) => {
    stageVelocity[stage.name] = { total: 0, count: 0 }
  })

  // Calculate (this is a simplified version - in production you'd track stage transitions)
  applications.forEach((app) => {
    const stage = stages.find((s) => s.id === app.stage_id)
    if (stage) {
      const daysInStage = differenceInDays(
        new Date(),
        new Date(app.created_at)
      )
      stageVelocity[stage.name].total += daysInStage
      stageVelocity[stage.name].count += 1
    }
  })

  // Calculate averages
  const avgDaysInStage: Record<string, number> = {}
  let slowestStage = ''
  let fastestStage = ''
  let maxDays = 0
  let minDays = Infinity

  Object.entries(stageVelocity).forEach(([stageName, data]) => {
    const avg = data.count > 0 ? Math.round(data.total / data.count) : 0
    avgDaysInStage[stageName] = avg

    if (avg > maxDays) {
      maxDays = avg
      slowestStage = stageName
    }
    if (avg < minDays && avg > 0) {
      minDays = avg
      fastestStage = stageName
    }
  })

  return {
    avgDaysInStage,
    slowestStage,
    fastestStage,
  }
}
