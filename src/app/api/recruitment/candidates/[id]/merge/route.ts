import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MergeCandidateRequest } from "@/types/recruitment";

/**
 * POST /api/recruitment/candidates/[id]/merge
 * Mescla dois candidatos duplicados
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: primaryCandidateId } = await params;
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter dados da requisição
    const body: MergeCandidateRequest = await request.json();
    const { duplicate_candidate_id, field_preferences } = body;

    // Validar inputs
    if (!duplicate_candidate_id) {
      return NextResponse.json(
        { error: "ID do candidato duplicado é obrigatório" },
        { status: 400 }
      );
    }

    if (primaryCandidateId === duplicate_candidate_id) {
      return NextResponse.json(
        { error: "Não é possível mesclar um candidato com ele mesmo" },
        { status: 400 }
      );
    }

    // Buscar ambos os candidatos
    const { data: primaryCandidate, error: primaryError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", primaryCandidateId)
      .single();

    if (primaryError || !primaryCandidate) {
      return NextResponse.json(
        { error: "Candidato principal não encontrado" },
        { status: 404 }
      );
    }

    const { data: duplicateCandidate, error: duplicateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", duplicate_candidate_id)
      .single();

    if (duplicateError || !duplicateCandidate) {
      return NextResponse.json(
        { error: "Candidato duplicado não encontrado" },
        { status: 404 }
      );
    }

    // Construir dados mesclados baseado nas preferências
    const mergedData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    // Aplicar preferências de campos
    Object.entries(field_preferences).forEach(([field, preference]) => {
      const sourceCandidate =
        preference === "primary" ? primaryCandidate : duplicateCandidate;

      if (sourceCandidate[field] !== null && sourceCandidate[field] !== undefined) {
        mergedData[field] = sourceCandidate[field];
      }
    });

    // Mesclar tags (união de ambos)
    const primaryTags = primaryCandidate.tags || [];
    const duplicateTags = duplicateCandidate.tags || [];
    mergedData.tags = [...new Set([...primaryTags, ...duplicateTags])];

    // Mesclar notas
    if (primaryCandidate.notes || duplicateCandidate.notes) {
      const notes = [
        primaryCandidate.notes,
        duplicateCandidate.notes,
      ].filter(Boolean);
      mergedData.notes = notes.join("\n\n---\n\n");
    }

    // Iniciar transação
    // 1. Atualizar candidato principal com dados mesclados
    const { error: updateError } = await supabase
      .from("candidates")
      .update(mergedData)
      .eq("id", primaryCandidateId);

    if (updateError) {
      throw updateError;
    }

    // 2. Transferir todas as aplicações do candidato duplicado para o principal
    const { error: transferError } = await supabase
      .from("applications")
      .update({
        candidate_id: primaryCandidateId,
        updated_at: new Date().toISOString(),
      })
      .eq("candidate_id", duplicate_candidate_id);

    if (transferError) {
      throw transferError;
    }

    // 3. Transferir atividades
    const { error: activitiesError } = await supabase
      .from("activities")
      .update({
        candidate_id: primaryCandidateId,
      })
      .eq("candidate_id", duplicate_candidate_id);

    if (activitiesError) {
      throw activitiesError;
    }

    // 4. Transferir documentos
    const { error: documentsError } = await supabase
      .from("candidate_documents")
      .update({
        candidate_id: primaryCandidateId,
      })
      .eq("candidate_id", duplicate_candidate_id);

    if (documentsError) {
      throw documentsError;
    }

    // 5. Registrar a mesclagem no histórico
    await supabase.from("candidate_duplicates").insert({
      candidate_id: primaryCandidateId,
      duplicate_of_id: duplicate_candidate_id,
      match_score: 100,
      match_reason: "email",
      reviewed: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    });

    // 6. Deletar candidato duplicado
    const { error: deleteError } = await supabase
      .from("candidates")
      .delete()
      .eq("id", duplicate_candidate_id);

    if (deleteError) {
      throw deleteError;
    }

    // Buscar candidato atualizado
    const { data: updatedCandidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", primaryCandidateId)
      .single();

    return NextResponse.json({
      success: true,
      candidate: updatedCandidate,
      message: "Candidatos mesclados com sucesso",
    });
  } catch (error) {
    console.error("Erro ao mesclar candidatos:", error);
    return NextResponse.json(
      {
        error: "Erro ao mesclar candidatos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
