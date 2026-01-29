import { createClient } from '@/lib/supabase/server';
import { ReportTemplateEngine } from './template-engine';
import { ReportExporter } from './exporter';
import type { DatePeriod } from '@/types/reports';

export class ReportScheduler {
  private supabase = createClient();
  private engine = new ReportTemplateEngine();
  private exporter = new ReportExporter();

  /**
   * Processa todos os relatórios agendados que estão na hora de serem executados
   */
  async processScheduledReports(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ scheduleId: string; error: string }>;
  }> {
    const startTime = Date.now();
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ scheduleId: string; error: string }>,
    };

    try {
      // Buscar schedules que devem ser executados
      const { data: schedules, error } = await this.supabase.rpc('get_schedules_due');

      if (error) {
        console.error('Erro ao buscar schedules:', error);
        throw error;
      }

      if (!schedules || schedules.length === 0) {
        console.log('Nenhum relatório agendado para processar');
        return results;
      }

      console.log(`Processando ${schedules.length} relatórios agendados...`);

      // Processar cada schedule
      for (const schedule of schedules) {
        results.processed++;

        try {
          await this.processSchedule(schedule);
          results.succeeded++;
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          results.errors.push({
            scheduleId: schedule.schedule_id,
            error: errorMessage,
          });

          console.error(`Erro ao processar schedule ${schedule.schedule_id}:`, error);

          // Registrar erro no histórico
          await this.logScheduleError(schedule.schedule_id, schedule.template_id, errorMessage);
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `Processamento concluído em ${totalTime}ms:`,
        `${results.succeeded} sucesso, ${results.failed} falhas`
      );

      return results;
    } catch (error) {
      console.error('Erro crítico no processamento de schedules:', error);
      throw error;
    }
  }

  /**
   * Processa um schedule individual
   */
  private async processSchedule(schedule: any): Promise<void> {
    const startTime = Date.now();

    console.log(`Processando schedule ${schedule.schedule_id} - Template: ${schedule.template_name}`);

    // Calcular range de datas baseado no período
    const dateRange = this.getDateRange(schedule.date_period);

    // Gerar relatório
    const result = await this.engine.generateReport(schedule.template_id, dateRange);

    // Exportar relatório
    const buffer = await this.exporter.exportReport(result, schedule.format, {
      ...schedule.template_config,
      filename: ReportExporter.generateFilename(schedule.template_name, schedule.format),
      title: schedule.template_name,
      subtitle: `Período: ${dateRange.start.toLocaleDateString('pt-BR')} a ${dateRange.end.toLocaleDateString('pt-BR')}`,
      showSummary: true,
    });

    // Upload para storage
    const filename = ReportExporter.generateFilename(schedule.template_name, schedule.format);
    const fileUrl = await this.uploadToStorage(
      buffer,
      filename,
      schedule.company_id,
      schedule.template_id
    );

    const processingTime = Date.now() - startTime;

    // Registrar no histórico
    await this.createReportHistory({
      template_id: schedule.template_id,
      schedule_id: schedule.schedule_id,
      format: schedule.format,
      file_url: fileUrl,
      file_size: buffer.length,
      record_count: result.recordCount,
      date_range_start: dateRange.start.toISOString().split('T')[0],
      date_range_end: dateRange.end.toISOString().split('T')[0],
      status: 'success',
      processing_time_ms: processingTime,
    });

    // Enviar por email se houver destinatários
    if (schedule.recipients && schedule.recipients.length > 0) {
      await this.sendReportEmail(
        schedule.recipients,
        schedule.template_name,
        fileUrl,
        result.recordCount,
        dateRange
      );
    }

    // Atualizar last_run do schedule
    await this.updateScheduleLastRun(schedule.schedule_id);

    console.log(`Schedule ${schedule.schedule_id} processado com sucesso em ${processingTime}ms`);
  }

  /**
   * Calcula range de datas baseado no período
   */
  private getDateRange(period: DatePeriod): { start: Date; end: Date } {
    return ReportTemplateEngine.getDateRangeFromPeriod(period);
  }

  /**
   * Upload de arquivo para o storage do Supabase
   */
  private async uploadToStorage(
    buffer: Buffer,
    filename: string,
    companyId: string,
    templateId: string
  ): Promise<string> {
    const path = `${companyId}/reports/${templateId}/${filename}`;

    const { data, error } = await this.supabase.storage
      .from('reports')
      .upload(path, buffer, {
        contentType: this.getContentType(filename),
        upsert: true,
      });

    if (error) {
      throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`);
    }

    // Obter URL pública (ou assinada se o bucket for privado)
    const { data: urlData } = this.supabase.storage
      .from('reports')
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  /**
   * Obtém content type baseado na extensão
   */
  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
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

  /**
   * Registra relatório no histórico
   */
  private async createReportHistory(data: any): Promise<void> {
    const { error } = await this.supabase.from('report_history').insert(data);

    if (error) {
      console.error('Erro ao criar histórico:', error);
      throw error;
    }
  }

  /**
   * Registra erro de schedule no histórico
   */
  private async logScheduleError(
    scheduleId: string,
    templateId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      await this.supabase.from('report_history').insert({
        template_id: templateId,
        schedule_id: scheduleId,
        status: 'error',
        error_message: errorMessage,
        format: 'csv', // Default
      });
    } catch (error) {
      console.error('Erro ao registrar erro no histórico:', error);
    }
  }

  /**
   * Atualiza last_run do schedule
   */
  private async updateScheduleLastRun(scheduleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('report_schedules')
      .update({ last_run: new Date().toISOString() })
      .eq('id', scheduleId);

    if (error) {
      console.error('Erro ao atualizar last_run:', error);
      // Não lançar erro aqui para não interromper o fluxo
    }
  }

  /**
   * Envia relatório por email
   * TODO: Implementar integração com serviço de email (SendGrid, AWS SES, etc)
   */
  private async sendReportEmail(
    recipients: string[],
    templateName: string,
    fileUrl: string,
    recordCount: number,
    dateRange: { start: Date; end: Date }
  ): Promise<void> {
    console.log('Enviando email para:', recipients);
    console.log('Template:', templateName);
    console.log('URL do arquivo:', fileUrl);
    console.log('Total de registros:', recordCount);
    console.log('Período:', dateRange.start.toLocaleDateString(), 'a', dateRange.end.toLocaleDateString());

    // TODO: Implementar envio real de email
    // Exemplo com SendGrid:
    /*
    const msg = {
      to: recipients,
      from: 'noreply@seudominio.com',
      subject: `Relatório: ${templateName}`,
      html: `
        <h2>Relatório Gerado</h2>
        <p>O relatório <strong>${templateName}</strong> foi gerado com sucesso.</p>
        <ul>
          <li>Total de registros: ${recordCount}</li>
          <li>Período: ${dateRange.start.toLocaleDateString('pt-BR')} a ${dateRange.end.toLocaleDateString('pt-BR')}</li>
        </ul>
        <p>
          <a href="${fileUrl}">Clique aqui para baixar o relatório</a>
        </p>
      `,
    };
    await sgMail.send(msg);
    */
  }

  /**
   * Cria um bucket de storage para relatórios se não existir
   */
  static async ensureStorageBucket(): Promise<void> {
    const supabase = createClient();

    // Verificar se o bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucketExists = buckets?.some(b => b.name === 'reports');

    if (!reportsBucketExists) {
      // Criar bucket
      const { error } = await supabase.storage.createBucket('reports', {
        public: false, // Relatórios são privados por padrão
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'text/csv',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      });

      if (error) {
        console.error('Erro ao criar bucket de relatórios:', error);
      } else {
        console.log('Bucket de relatórios criado com sucesso');
      }
    }
  }
}
