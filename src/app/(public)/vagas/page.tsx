import { Suspense } from "react"
import { Metadata } from "next"
import { PublicJobsList } from "@/components/recruitment/PublicJobsList"
import { PublicJobFilters } from "@/components/recruitment/PublicJobFilters"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Vagas Abertas | Carreiras",
  description: "Encontre oportunidades de carreira na nossa empresa. Vagas abertas em diversas áreas e localidades.",
  openGraph: {
    title: "Vagas Abertas | Carreiras",
    description: "Encontre oportunidades de carreira na nossa empresa",
    type: "website",
  },
}

interface PageProps {
  searchParams: {
    search?: string
    department?: string
    location?: string
    job_type?: string
    location_type?: string
  }
}

export default async function VagasPage({ searchParams }: PageProps) {
  return (
    <div className="bg-muted/50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Construa sua carreira conosco
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Encontre oportunidades em uma empresa que valoriza pessoas, inovação e crescimento.
            </p>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <Suspense fallback={<FiltersSkeleton />}>
                <PublicJobFilters />
              </Suspense>
            </div>
          </aside>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            <Suspense fallback={<JobsListSkeleton />}>
              <PublicJobsList filters={searchParams} />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function JobsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-card border rounded-lg p-6">
          <Skeleton className="h-6 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
