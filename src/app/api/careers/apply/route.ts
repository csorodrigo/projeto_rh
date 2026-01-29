import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadResume } from "@/lib/recruitment/resume-upload"
import { sendApplicationReceivedEmail, sendNewApplicationNotification } from "@/lib/notifications/recruitment-emails"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const jobId = formData.get("jobId") as string
    const full_name = formData.get("full_name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const linkedin_url = formData.get("linkedin_url") as string | null
    const cover_letter = formData.get("cover_letter") as string | null
    const resume = formData.get("resume") as File
    const gdpr_consent = formData.get("gdpr_consent") === "true"

    // Validate required fields
    if (!jobId || !full_name || !email || !phone || !resume || !gdpr_consent) {
      return NextResponse.json(
        { message: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(resume.type)) {
      return NextResponse.json(
        { message: "Tipo de arquivo inválido. Apenas PDF ou Word são aceitos." },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    if (resume.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Arquivo muito grande. O tamanho máximo é 5MB." },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get job details and company_id
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("id, company_id, title, hiring_manager_id")
      .eq("id", jobId)
      .eq("is_public", true)
      .eq("status", "active")
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { message: "Vaga não encontrada ou não está mais disponível" },
        { status: 404 }
      )
    }

    // Check if candidate already applied for this job
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", email) // Using email as temporary identifier
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { message: "Você já se candidatou para esta vaga" },
        { status: 400 }
      )
    }

    // Check if candidate exists
    let candidateId: string
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("company_id", job.company_id)
      .eq("email", email)
      .single()

    if (existingCandidate) {
      // Update existing candidate
      candidateId = existingCandidate.id

      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          name: full_name,
          phone,
          linkedin_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId)

      if (updateError) {
        console.error("Error updating candidate:", updateError)
      }
    } else {
      // Create new candidate
      const { data: newCandidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          company_id: job.company_id,
          email,
          name: full_name,
          phone,
          linkedin_url,
          source: "careers_page",
        })
        .select("id")
        .single()

      if (candidateError || !newCandidate) {
        console.error("Error creating candidate:", candidateError)
        return NextResponse.json(
          { message: "Erro ao criar candidato" },
          { status: 500 }
        )
      }

      candidateId = newCandidate.id
    }

    // Upload resume
    let resumeUrl: string | null = null
    try {
      resumeUrl = await uploadResume(resume, candidateId, job.company_id)
    } catch (error) {
      console.error("Error uploading resume:", error)
      // Continue without resume URL - it's not critical
    }

    // Update candidate with resume URL
    if (resumeUrl) {
      await supabase
        .from("candidates")
        .update({ resume_url: resumeUrl })
        .eq("id", candidateId)
    }

    // Get first pipeline stage
    const { data: firstStage } = await supabase
      .from("recruitment_stages")
      .select("id, name")
      .eq("company_id", job.company_id)
      .order("order_index", { ascending: true })
      .limit(1)
      .single()

    // Create application
    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        company_id: job.company_id,
        status: "applied",
        current_stage_id: firstStage?.id || null,
        source: "careers_page",
        custom_questions: cover_letter ? { cover_letter } : null,
      })
      .select("id")
      .single()

    if (applicationError || !application) {
      console.error("Error creating application:", applicationError)
      return NextResponse.json(
        { message: "Erro ao criar candidatura" },
        { status: 500 }
      )
    }

    // Send confirmation email to candidate
    try {
      await sendApplicationReceivedEmail({
        candidateName: full_name,
        candidateEmail: email,
        jobTitle: job.title,
      })
    } catch (error) {
      console.error("Error sending confirmation email:", error)
      // Don't fail the request if email fails
    }

    // Notify hiring manager
    if (job.hiring_manager_id) {
      try {
        await sendNewApplicationNotification({
          hiringManagerId: job.hiring_manager_id,
          candidateName: full_name,
          jobTitle: job.title,
          applicationId: application.id,
        })
      } catch (error) {
        console.error("Error sending notification:", error)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Candidatura enviada com sucesso!",
      applicationId: application.id,
    })
  } catch (error) {
    console.error("Error in apply route:", error)
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
