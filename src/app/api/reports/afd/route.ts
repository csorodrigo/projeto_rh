/**
 * API Route: Gerar AFD (Arquivo Fonte de Dados)
 *
 * GET /api/reports/afd?company_id=xxx&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Gera arquivo AFD conforme Portaria 671 do MTE para download.
 * Requer autenticacao e permissao de acesso a empresa.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AFDGenerator, type AFDData, type AFDConfig } from '@/lib/compliance'
import type { Company, Employee, TimeRecord, TimeTrackingDaily } from '@/types/database'

/**
 * GET - Gera e retorna arquivo AFD para download
 */
export async function GET(request: NextRequest) {
  try {
    // Obtem parametros da URL
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const startDateStr = searchParams.get('start_date')
    const endDateStr = searchParams.get('end_date')
    const encoding = searchParams.get('encoding') as 'ISO-8859-1' | 'UTF-8' | null

    // Validacao de parametros obrigatorios
    if (!companyId) {
      return NextResponse.json(
        { error: 'Parametro company_id e obrigatorio' },
        { status: 400 }
      )
    }

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Parametros start_date e end_date sao obrigatorios' },
        { status: 400 }
      )
    }

    // Valida formato das datas
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de data invalido. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Data inicial deve ser anterior a data final' },
        { status: 400 }
      )
    }

    // Cria cliente Supabase
    const supabase = await createClient()

    // Verifica autenticacao
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    // Verifica permissao de acesso a empresa
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single<{ company_id: string | null; role: string }>()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil de usuario nao encontrado' },
        { status: 403 }
      )
    }

    // Verifica se o usuario tem acesso a empresa solicitada
    if (profile.company_id !== companyId && profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Sem permissao para acessar esta empresa' },
        { status: 403 }
      )
    }

    // Busca dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Empresa nao encontrada' },
        { status: 404 }
      )
    }

    // Busca funcionarios ativos da empresa com PIS
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('pis', 'is', null)

    if (employeesError) {
      return NextResponse.json(
        { error: 'Erro ao buscar funcionarios: ' + employeesError.message },
        { status: 500 }
      )
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum funcionario ativo com PIS cadastrado' },
        { status: 404 }
      )
    }

    // Busca registros de ponto do periodo
    const { data: timeRecords, error: timeRecordsError } = await supabase
      .from('time_records')
      .select('*')
      .eq('company_id', companyId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (timeRecordsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar registros de ponto: ' + timeRecordsError.message },
        { status: 500 }
      )
    }

    // Busca registros diarios consolidados
    const { data: dailyRecords, error: dailyError } = await supabase
      .from('time_tracking_daily')
      .select('*')
      .eq('company_id', companyId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (dailyError) {
      return NextResponse.json(
        { error: 'Erro ao buscar registros diarios: ' + dailyError.message },
        { status: 500 }
      )
    }

    // Prepara dados para o gerador AFD
    const afdData: AFDData = {
      company,
      employees,
      timeRecords: timeRecords || [],
      dailyRecords: dailyRecords || [],
      startDate,
      endDate,
    }

    // Configuracao do gerador
    const afdConfig: AFDConfig = {
      encoding: encoding || 'UTF-8',
      layoutVersion: 2,
      repType: 3, // REP-P (programa)
    }

    // Gera o arquivo AFD
    const generator = new AFDGenerator(afdConfig)
    const result = generator.generate(afdData)

    // Converte para o encoding especificado
    const buffer = generator.encodeContent(result.content)

    // Retorna arquivo para download (converte Buffer para Uint8Array para compatibilidade)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=' + result.encoding,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': buffer.length.toString(),
        'X-Total-Records': result.totalRecords.toString(),
      },
    })
  } catch (error) {
    console.error('Erro ao gerar AFD:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar arquivo AFD' },
      { status: 500 }
    )
  }
}

/**
 * POST - Gera AFD com dados customizados (ajustes e inclusoes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_id, start_date, end_date, adjustments, inclusions, encoding } = body

    // Validacao de parametros obrigatorios
    if (!company_id) {
      return NextResponse.json(
        { error: 'Parametro company_id e obrigatorio' },
        { status: 400 }
      )
    }

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'Parametros start_date e end_date sao obrigatorios' },
        { status: 400 }
      )
    }

    // Valida formato das datas
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de data invalido. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Cria cliente Supabase
    const supabase = await createClient()

    // Verifica autenticacao
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    // Verifica permissao
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single<{ company_id: string | null; role: string }>()

    if (!profile || (profile.company_id !== company_id && profile.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Sem permissao para acessar esta empresa' },
        { status: 403 }
      )
    }

    // Busca dados necessarios com tipos explícitos para evitar inferência de 'never'
    const companyResult = await supabase.from('companies').select('*').eq('id', company_id).single() as { data: Company | null; error: Error | null };
    const employeesResult = await supabase.from('employees').select('*').eq('company_id', company_id).eq('status', 'active').not('pis', 'is', null) as { data: Employee[] | null; error: Error | null };
    const timeRecordsResult = await supabase.from('time_records').select('*').eq('company_id', company_id).gte('recorded_at', startDate.toISOString()).lte('recorded_at', endDate.toISOString()) as { data: TimeRecord[] | null; error: Error | null };
    const dailyResult = await supabase.from('time_tracking_daily').select('*').eq('company_id', company_id).gte('date', start_date).lte('date', end_date) as { data: TimeTrackingDaily[] | null; error: Error | null };

    if (companyResult.error || !companyResult.data) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    if (!employeesResult.data || employeesResult.data.length === 0) {
      return NextResponse.json({ error: 'Nenhum funcionario ativo com PIS' }, { status: 404 })
    }

    // Prepara dados para o gerador
    const afdData: AFDData = {
      company: companyResult.data,
      employees: employeesResult.data,
      timeRecords: timeRecordsResult.data || [],
      dailyRecords: dailyResult.data || [],
      adjustments: adjustments?.map((a: Record<string, unknown>) => ({
        ...a,
        originalDateTime: new Date(a.originalDateTime as string),
        adjustedDateTime: new Date(a.adjustedDateTime as string),
        adjustedAt: new Date(a.adjustedAt as string),
      })),
      inclusions: inclusions?.map((i: Record<string, unknown>) => ({
        ...i,
        dateTime: new Date(i.dateTime as string),
        includedAt: new Date(i.includedAt as string),
      })),
      startDate,
      endDate,
    }

    // Gera o arquivo
    const afdConfig: AFDConfig = {
      encoding: encoding || 'UTF-8',
      layoutVersion: 2,
      repType: 3,
    }

    const generator = new AFDGenerator(afdConfig)
    const result = generator.generate(afdData)
    const buffer = generator.encodeContent(result.content)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=' + result.encoding,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': buffer.length.toString(),
        'X-Total-Records': result.totalRecords.toString(),
      },
    })
  } catch (error) {
    console.error('Erro ao gerar AFD (POST):', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar arquivo AFD' },
      { status: 500 }
    )
  }
}
