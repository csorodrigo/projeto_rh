/**
 * API Route: Gerar AEJ (Arquivo Eletronico de Jornada)
 *
 * GET /api/reports/aej?company_id=xxx&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Gera arquivo AEJ conforme Portaria 671 do MTE para download.
 * Consolida jornadas com calculos de horas extras, adicional noturno, DSR.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AEJGenerator, type AEJData, type AEJConfig } from '@/lib/compliance'
import type { Company, Employee, TimeTrackingDaily, WorkSchedule } from '@/types/database'

/**
 * GET - Gera e retorna arquivo AEJ para download
 */
export async function GET(request: NextRequest) {
  try {
    // Obtem parametros da URL
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const startDateStr = searchParams.get('start_date')
    const endDateStr = searchParams.get('end_date')
    const encoding = searchParams.get('encoding') as 'ISO-8859-1' | 'UTF-8' | null
    const format = searchParams.get('format') as 'txt' | 'csv' | null
    const includeDaily = searchParams.get('include_daily') === 'true'
    const includeMonetary = searchParams.get('include_monetary') !== 'false' // default true

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

    // Limita periodo a 12 meses
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                       (endDate.getMonth() - startDate.getMonth())
    if (diffMonths > 12) {
      return NextResponse.json(
        { error: 'Periodo maximo permitido e de 12 meses' },
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

    // Busca dados em paralelo para otimizar performance
    // Definindo tipos para evitar inferência de 'never'
    const companyResult = await supabase.from('companies').select('*').eq('id', companyId).single() as { data: Company | null; error: Error | null };
    const employeesResult = await supabase.from('employees').select('*').eq('company_id', companyId).eq('status', 'active') as { data: Employee[] | null; error: Error | null };
    const dailyResult = await supabase.from('time_tracking_daily').select('*').eq('company_id', companyId).gte('date', startDateStr).lte('date', endDateStr) as { data: TimeTrackingDaily[] | null; error: Error | null };
    const schedulesResult = await supabase.from('work_schedules').select('*').eq('company_id', companyId) as { data: WorkSchedule[] | null; error: Error | null };

    if (companyResult.error || !companyResult.data) {
      return NextResponse.json(
        { error: 'Empresa nao encontrada' },
        { status: 404 }
      )
    }

    if (employeesResult.error) {
      return NextResponse.json(
        { error: 'Erro ao buscar funcionarios: ' + employeesResult.error.message },
        { status: 500 }
      )
    }

    if (!employeesResult.data || employeesResult.data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum funcionario ativo encontrado' },
        { status: 404 }
      )
    }

    if (dailyResult.error) {
      return NextResponse.json(
        { error: 'Erro ao buscar registros: ' + dailyResult.error.message },
        { status: 500 }
      )
    }

    // Busca feriados do periodo (se houver tabela de feriados)
    // Por enquanto, usa lista vazia pois a tabela pode nao existir
    const holidays: Date[] = []

    // Prepara dados para o gerador AEJ
    const aejData: AEJData = {
      company: companyResult.data,
      employees: employeesResult.data,
      dailyRecords: dailyResult.data || [],
      workSchedules: schedulesResult.data || [],
      holidays,
      startDate,
      endDate,
    }

    // Configuracao do gerador
    const aejConfig: AEJConfig = {
      encoding: encoding || 'UTF-8',
      format: format || 'txt',
      includeDaily,
      includeMonetary,
    }

    // Gera o arquivo AEJ
    const generator = new AEJGenerator(aejConfig)
    const result = generator.generate(aejData)

    // Converte para o encoding especificado
    const buffer = generator.encodeContent(result.content)

    // Determina content-type baseado no formato
    const contentType = aejConfig.format === 'csv'
      ? 'text/csv'
      : 'text/plain'

    // Retorna arquivo para download (converte Buffer para Uint8Array para compatibilidade)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': `${contentType}; charset=${result.encoding}`,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': buffer.length.toString(),
        'X-Total-Employees': result.totalEmployees.toString(),
        'X-Period': result.period,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar AEJ:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar arquivo AEJ' },
      { status: 500 }
    )
  }
}

/**
 * POST - Gera AEJ com opcoes avancadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_id,
      start_date,
      end_date,
      employee_ids,
      encoding,
      format,
      include_daily,
      include_monetary,
      custom_holidays,
    } = body

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

    // Busca dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    // Busca funcionarios (filtrados se especificado)
    let employeesQuery = supabase
      .from('employees')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'active')

    if (employee_ids && Array.isArray(employee_ids) && employee_ids.length > 0) {
      employeesQuery = employeesQuery.in('id', employee_ids)
    }

    const { data: employees, error: employeesError } = await employeesQuery

    if (employeesError || !employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum funcionario encontrado' },
        { status: 404 }
      )
    }

    // Busca registros diarios
    const { data: dailyRecords } = await supabase
      .from('time_tracking_daily')
      .select('*')
      .eq('company_id', company_id)
      .gte('date', start_date)
      .lte('date', end_date)

    // Busca escalas
    const { data: workSchedules } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('company_id', company_id)

    // Processa feriados customizados
    const holidays: Date[] = custom_holidays
      ? custom_holidays.map((d: string) => new Date(d))
      : []

    // Prepara dados para o gerador
    const aejData: AEJData = {
      company,
      employees,
      dailyRecords: dailyRecords || [],
      workSchedules: workSchedules || [],
      holidays,
      startDate,
      endDate,
    }

    // Configuracao do gerador
    const aejConfig: AEJConfig = {
      encoding: encoding || 'UTF-8',
      format: format || 'txt',
      includeDaily: include_daily ?? false,
      includeMonetary: include_monetary ?? true,
    }

    // Gera o arquivo
    const generator = new AEJGenerator(aejConfig)
    const result = generator.generate(aejData)
    const buffer = generator.encodeContent(result.content)

    const contentType = aejConfig.format === 'csv' ? 'text/csv' : 'text/plain'

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': `${contentType}; charset=${result.encoding}`,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': buffer.length.toString(),
        'X-Total-Employees': result.totalEmployees.toString(),
        'X-Period': result.period,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar AEJ (POST):', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar arquivo AEJ' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS - Retorna informacoes sobre a API
 */
export async function OPTIONS() {
  return NextResponse.json({
    description: 'API para geracao de Arquivo Eletronico de Jornada (AEJ)',
    methods: ['GET', 'POST', 'OPTIONS'],
    parameters: {
      GET: {
        company_id: { type: 'string', required: true, description: 'ID da empresa' },
        start_date: { type: 'string', required: true, description: 'Data inicial (YYYY-MM-DD)' },
        end_date: { type: 'string', required: true, description: 'Data final (YYYY-MM-DD)' },
        encoding: { type: 'string', required: false, description: 'Encoding do arquivo (UTF-8 ou ISO-8859-1)' },
        format: { type: 'string', required: false, description: 'Formato do arquivo (txt ou csv)' },
        include_daily: { type: 'boolean', required: false, description: 'Incluir detalhamento diario' },
        include_monetary: { type: 'boolean', required: false, description: 'Incluir valores monetarios' },
      },
      POST: {
        company_id: { type: 'string', required: true },
        start_date: { type: 'string', required: true },
        end_date: { type: 'string', required: true },
        employee_ids: { type: 'string[]', required: false, description: 'IDs dos funcionarios a incluir' },
        custom_holidays: { type: 'string[]', required: false, description: 'Datas de feriados customizados' },
        encoding: { type: 'string', required: false },
        format: { type: 'string', required: false },
        include_daily: { type: 'boolean', required: false },
        include_monetary: { type: 'boolean', required: false },
      },
    },
    response: {
      success: 'Arquivo binario para download',
      headers: {
        'Content-Type': 'text/plain ou text/csv',
        'Content-Disposition': 'attachment; filename="AEJ_*.txt"',
        'X-Total-Employees': 'Numero de funcionarios no arquivo',
        'X-Period': 'Periodo de apuracao',
      },
    },
  })
}
