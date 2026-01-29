import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReportTemplateEngine } from '@/lib/reports/template-engine';
import { ReportExporter } from '@/lib/reports/exporter';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse do body
    const body = await request.json();
    const { templateId, dateRange, format } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID é obrigatório' }, { status: 400 });
    }

    const startTime = Date.now();

    // Buscar template
    const { data: template, error: templateError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Gerar relatório
    const engine = new ReportTemplateEngine();
    const result = await engine.generateReport(
      templateId,
      dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined
    );

    // Exportar relatório
    const exporter = new ReportExporter();
    const exportFormat = format || template.format;
    const buffer = await exporter.exportReport(result, exportFormat, {
      ...template.config,
      filename: ReportExporter.generateFilename(template.name, exportFormat),
      title: template.name,
      subtitle: dateRange
        ? `Período: ${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`
        : undefined,
      showSummary: true,
    });

    const processingTime = Date.now() - startTime;

    // Upload para storage
    const filename = ReportExporter.generateFilename(template.name, exportFormat);
    const path = `${template.company_id}/reports/${templateId}/${filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(path, buffer, {
        contentType: getContentType(exportFormat),
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Continuar mesmo com erro de upload
    }

    // Obter URL do arquivo
    let fileUrl: string | undefined;
    if (uploadData) {
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    // Registrar no histórico
    await supabase.from('report_history').insert({
      template_id: templateId,
      generated_by: user.id,
      format: exportFormat,
      file_url: fileUrl,
      file_size: buffer.length,
      record_count: result.recordCount,
      date_range_start: dateRange?.start,
      date_range_end: dateRange?.end,
      status: 'success',
      processing_time_ms: processingTime,
    });

    // Retornar buffer como download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': getContentType(exportFormat),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório',
      },
      { status: 500 }
    );
  }
}

function getContentType(format: string): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}
