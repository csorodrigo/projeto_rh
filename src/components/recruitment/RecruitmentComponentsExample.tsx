"use client"

import * as React from "react"
import { Briefcase } from "lucide-react"

import {
  JobStatusBadge,
  ApplicationStatusBadge,
  SourceBadge,
  LocationBadge,
  EmploymentTypeBadge,
  RatingStars,
  TagInput,
  EmptyState,
  RecruitmentStats,
  HiringFunnel,
  SourceChart,
} from "@/components/recruitment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

/**
 * RecruitmentComponentsExample
 *
 * Example page demonstrating all recruitment module components.
 * Useful for development, testing, and documentation.
 */
export function RecruitmentComponentsExample() {
  const [rating, setRating] = React.useState(3)
  const [tags, setTags] = React.useState(["React", "TypeScript"])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recruitment Components</h1>
        <p className="text-muted-foreground">
          Demonstração de todos os componentes do módulo de recrutamento
        </p>
      </div>

      <Separator />

      {/* Status Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Status Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Job Status</h3>
            <div className="flex flex-wrap gap-2">
              <JobStatusBadge status="draft" />
              <JobStatusBadge status="open" />
              <JobStatusBadge status="paused" />
              <JobStatusBadge status="closed" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Application Status</h3>
            <div className="flex flex-wrap gap-2">
              <ApplicationStatusBadge status="active" />
              <ApplicationStatusBadge status="rejected" />
              <ApplicationStatusBadge status="hired" />
              <ApplicationStatusBadge status="withdrawn" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Sizes</h3>
            <div className="flex flex-wrap items-center gap-2">
              <JobStatusBadge status="open" size="sm" />
              <JobStatusBadge status="open" size="md" />
              <JobStatusBadge status="open" size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Type Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Source</h3>
            <div className="flex flex-wrap gap-2">
              <SourceBadge source="portal" />
              <SourceBadge source="linkedin" />
              <SourceBadge source="indicacao" />
              <SourceBadge source="outro" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Location</h3>
            <div className="flex flex-wrap gap-2">
              <LocationBadge type="remoto" />
              <LocationBadge type="presencial" city="São Paulo" />
              <LocationBadge type="hibrido" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Employment Type</h3>
            <div className="flex flex-wrap gap-2">
              <EmploymentTypeBadge type="clt" />
              <EmploymentTypeBadge type="pj" />
              <EmploymentTypeBadge type="estagio" />
              <EmploymentTypeBadge type="temporario" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Components */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Rating Stars</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Read-only (value: 4)
                </p>
                <RatingStars value={4} readOnly />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Interactive (value: {rating})
                </p>
                <RatingStars value={rating} onChange={setRating} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sizes</p>
                <div className="flex items-center gap-4">
                  <RatingStars value={3} size="sm" readOnly />
                  <RatingStars value={3} size="md" readOnly />
                  <RatingStars value={3} size="lg" readOnly />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Tag Input</h3>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="Adicionar habilidades..."
              suggestions={[
                "JavaScript",
                "Python",
                "Java",
                "React",
                "TypeScript",
                "Node.js",
                "Angular",
                "Vue",
              ]}
              maxTags={10}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <RecruitmentStats
          data={{
            totalOpenJobs: 12,
            totalCandidates: 85,
            avgTimeToHire: 21,
            conversionRate: 15,
            candidatesByStage: [
              { stage: "Triagem", count: 30 },
              { stage: "Entrevista RH", count: 20 },
              { stage: "Entrevista Técnica", count: 15 },
              { stage: "Proposta", count: 10 },
              { stage: "Contratado", count: 10 },
            ],
          }}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <HiringFunnel
          stages={[
            { stage: "Triagem", count: 100, conversionRate: 100 },
            {
              stage: "Entrevista RH",
              count: 60,
              conversionRate: 60,
              dropoffRate: 40,
            },
            {
              stage: "Entrevista Técnica",
              count: 30,
              conversionRate: 30,
              dropoffRate: 50,
            },
            { stage: "Proposta", count: 20, conversionRate: 20, dropoffRate: 33 },
            { stage: "Contratado", count: 15, conversionRate: 15, dropoffRate: 25 },
          ]}
          onStageClick={(stage) => console.log("Stage clicked:", stage)}
        />

        <SourceChart
          data={[
            { source: "portal", count: 45 },
            { source: "linkedin", count: 30 },
            { source: "indicacao", count: 20 },
            { source: "outro", count: 5 },
          ]}
        />
      </div>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Empty State</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Briefcase}
            title="Nenhuma vaga cadastrada"
            description="Comece criando sua primeira vaga de emprego para iniciar o processo de recrutamento."
            action={{
              label: "Criar Vaga",
              onClick: () => alert("Navigate to create job page"),
            }}
            secondaryAction={{
              label: "Importar Vagas",
              onClick: () => alert("Open import dialog"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default RecruitmentComponentsExample
