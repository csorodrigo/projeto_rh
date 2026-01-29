import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AddActivityFormData } from "@/types/recruitment";

/**
 * GET /api/recruitment/candidates/[id]/activities
 * Lista todas as atividades de um candidato
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar perfil do usuário para obter company_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: "Perfil de empresa não encontrado" },
        { status: 404 }
      );
    }

    // Parâmetros de paginação
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Buscar atividades com informações do usuário que as criou
    const { data: activities, error } = await supabase
      .from("activities")
      .select(
        `
        *,
        performer:performed_by (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .eq("candidate_id", candidateId)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      activities: activities || [],
      pagination: {
        limit,
        offset,
        total: activities?.length || 0,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar atividades:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar atividades",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recruitment/candidates/[id]/activities
 * Cria uma nova atividade para o candidato
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, name")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: "Perfil de empresa não encontrado" },
        { status: 404 }
      );
    }

    // Obter dados da requisição
    const body: AddActivityFormData & {
      application_id: string;
      job_id?: string;
    } = await request.json();

    // Validar dados obrigatórios
    if (!body.type) {
      return NextResponse.json(
        { error: "Tipo de atividade é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.application_id) {
      return NextResponse.json(
        { error: "ID da aplicação é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar application para obter job_id
    const { data: application } = await supabase
      .from("applications")
      .select("job_id")
      .eq("id", body.application_id)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Aplicação não encontrada" },
        { status: 404 }
      );
    }

    // Construir dados da atividade
    const activityData: any = {
      company_id: profile.company_id,
      candidate_id: candidateId,
      application_id: body.application_id,
      job_id: application.job_id,
      type: body.type,
      action: generateActionDescription(body),
      comment: body.comment || null,
      performed_by: user.id,
      performed_by_name: profile.name,
      created_at: new Date().toISOString(),
    };

    // Adicionar campos específicos por tipo
    if (body.type === "rating") {
      activityData.rating = body.rating;
      activityData.rating_category = body.rating_category || "overall";
    }

    if (body.type === "interview_scheduled") {
      activityData.interview_type = body.interview_type;
      activityData.interview_date = body.interview_date;
      activityData.interview_location = body.interview_location;

      // Combinar date e time se fornecidos
      if (body.interview_date && body.interview_time) {
        const date = new Date(body.interview_date);
        const [hours, minutes] = body.interview_time.split(":");
        date.setHours(parseInt(hours), parseInt(minutes));
        activityData.interview_date = date.toISOString();
      }
    }

    // Inserir atividade
    const { data: activity, error } = await supabase
      .from("activities")
      .insert(activityData)
      .select(
        `
        *,
        performer:performed_by (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      throw error;
    }

    // Se for uma avaliação, atualizar rating médio do candidato
    if (body.type === "rating" && body.rating) {
      await updateCandidateAverageRating(supabase, candidateId);
    }

    // Criar notificação se necessário
    if (body.type === "interview_scheduled") {
      // TODO: Criar notificação para o candidato e outros stakeholders
    }

    return NextResponse.json({
      success: true,
      activity,
      message: "Atividade criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar atividade",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * Gera descrição da ação baseado no tipo e dados
 */
function generateActionDescription(data: AddActivityFormData): string {
  switch (data.type) {
    case "comment":
      return "Adicionou um comentário";
    case "rating":
      return `Avaliou com ${data.rating} estrela${data.rating && data.rating > 1 ? "s" : ""}`;
    case "interview_scheduled":
      return "Agendou entrevista";
    case "call_logged":
      return "Registrou ligação telefônica";
    case "email_sent":
      return "Enviou email";
    default:
      return "Registrou atividade";
  }
}

/**
 * Atualiza o rating médio do candidato
 */
async function updateCandidateAverageRating(
  supabase: any,
  candidateId: string
) {
  try {
    // Buscar todas as avaliações do candidato
    const { data: ratingActivities } = await supabase
      .from("activities")
      .select("rating")
      .eq("candidate_id", candidateId)
      .eq("type", "rating")
      .not("rating", "is", null);

    if (ratingActivities && ratingActivities.length > 0) {
      const total = ratingActivities.reduce(
        (sum: number, act: any) => sum + (act.rating || 0),
        0
      );
      const average = Math.round(total / ratingActivities.length);

      // Atualizar candidato
      await supabase
        .from("candidates")
        .update({
          rating: average,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);
    }
  } catch (error) {
    console.error("Erro ao atualizar rating médio:", error);
    // Não lançar erro, apenas logar
  }
}
