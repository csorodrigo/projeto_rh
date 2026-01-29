import { NextRequest, NextResponse } from 'next/server';
import { ReportScheduler } from '@/lib/reports/scheduler';

/**
 * Rota de Cron para processar relatórios agendados
 *
 * Esta rota deve ser chamada periodicamente (ex: a cada minuto) por um serviço de cron externo
 * como Vercel Cron, GitHub Actions, ou qualquer outro scheduler.
 *
 * Exemplo de configuração no Vercel (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reports",
 *     "schedule": "* * * * *"
 *   }]
 * }
 *
 * Para proteção, use uma chave secreta:
 * - Adicione CRON_SECRET no .env
 * - Passe como header: Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (opcional mas recomendado)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && token !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled reports processing...');

    // Processar relatórios agendados
    const scheduler = new ReportScheduler();
    const results = await scheduler.processScheduledReports();

    console.log('Scheduled reports processing completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Error processing scheduled reports:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Também permitir POST para flexibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}
