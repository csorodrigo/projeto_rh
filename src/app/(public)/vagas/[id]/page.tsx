import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JobDetailsContent } from "@/components/recruitment/JobDetailsContent"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createClient()

    const { data: job } = await supabase
      .from('job_postings')
      .select('title, description, department, location')
      .eq('id', params.id)
      .eq('is_public', true)
      .eq('status', 'active')
      .single()

    if (!job) {
      return {
        title: 'Vaga não encontrada | Carreiras',
        description: 'Esta vaga não está mais disponível',
      }
    }

    return {
      title: `${job.title} - ${job.department || 'Oportunidade'} | Carreiras`,
      description: job.description?.substring(0, 160) || 'Vaga de emprego',
      openGraph: {
        title: job.title,
        description: job.description?.substring(0, 160) || '',
        type: 'website',
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Vaga | Carreiras',
      description: 'Detalhes da vaga de emprego',
    }
  }
}

export default async function JobDetailsPage({ params }: PageProps) {
  try {
    const supabase = createClient()

    const { data: job, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', params.id)
      .eq('is_public', true)
      .eq('status', 'active')
      .single()

    if (error || !job) {
      notFound()
    }

    return (
      <div className="bg-background min-h-screen">
        {/* Back Button */}
        <div className="border-b bg-muted/50">
          <div className="container py-4">
            <Link href="/vagas">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para vagas
              </Button>
            </Link>
          </div>
        </div>

        {/* Job Details */}
        <Suspense fallback={<JobDetailsSkeleton />}>
          <JobDetailsContent job={job} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading job:', error)
    notFound()
  }
}

function JobDetailsSkeleton() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />

        <div className="bg-card border rounded-lg p-8 mb-8">
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-24 w-full" />
        </div>

        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
