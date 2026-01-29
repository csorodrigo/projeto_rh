/**
 * Cron Job API - Notifications
 * Executa verificações automáticas de notificações
 * Configurado no vercel.json para rodar 2x ao dia (8h e 18h)
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationEngine } from '@/lib/notifications/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do cron job (Vercel Cron Secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not properly configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting notification checks...');
    const startTime = Date.now();

    const engine = new NotificationEngine();
    const results = {
      birthdays: false,
      anniversaries: false,
      vacations: false,
      absences: false,
      timeRecords: false,
      compliance: false,
    };

    // Executar todas as verificações
    try {
      await engine.checkBirthdays();
      results.birthdays = true;
      console.log('[Cron] ✓ Birthdays checked');
    } catch (error) {
      console.error('[Cron] ✗ Birthday check failed:', error);
    }

    try {
      await engine.checkAnniversaries();
      results.anniversaries = true;
      console.log('[Cron] ✓ Anniversaries checked');
    } catch (error) {
      console.error('[Cron] ✗ Anniversary check failed:', error);
    }

    try {
      await engine.checkVacationExpiring();
      results.vacations = true;
      console.log('[Cron] ✓ Vacation expiration checked');
    } catch (error) {
      console.error('[Cron] ✗ Vacation check failed:', error);
    }

    try {
      await engine.checkPendingAbsences();
      results.absences = true;
      console.log('[Cron] ✓ Pending absences checked');
    } catch (error) {
      console.error('[Cron] ✗ Absence check failed:', error);
    }

    try {
      await engine.checkMissingTimeRecords();
      results.timeRecords = true;
      console.log('[Cron] ✓ Missing time records checked');
    } catch (error) {
      console.error('[Cron] ✗ Time record check failed:', error);
    }

    try {
      await engine.checkComplianceViolations();
      results.compliance = true;
      console.log('[Cron] ✓ Compliance violations checked');
    } catch (error) {
      console.error('[Cron] ✗ Compliance check failed:', error);
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] All checks completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Notification checks completed',
      duration,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Unexpected error:', error);
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
