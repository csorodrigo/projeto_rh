/**
 * Exemplos práticos de uso do gerador AFD
 * Demonstra os principais casos de uso para geração de arquivos AFD
 */

import { AFDGenerator, generateAFD, type AFDConfig, type AFDData } from '@/lib/compliance/afd-generator'
import { getTimeRecordsForAFD, validateCompanyForAFD, getAFDStatistics } from '@/lib/supabase/queries/compliance'

/**
 * EXEMPLO 1: Geração básica de AFD mensal
 * Caso de uso mais comum - gerar AFD do último mês para auditoria
 */
export async function gerarAFDMensal(companyId: string, mesReferencia: Date): Promise<void> {
  console.log('=== Exemplo 1: Geração Básica de AFD Mensal ===')

  // Calcular primeiro e último dia do mês
  const primeiroDia = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1)
  const ultimoDia = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0)

  const startDate = primeiroDia.toISOString().split('T')[0]
  const endDate = ultimoDia.toISOString().split('T')[0]

  console.log(`Período: ${startDate} a ${endDate}`)

  // 1. Validar empresa antes de gerar
  console.log('1. Validando empresa...')
  const validation = await validateCompanyForAFD(companyId)

  if (!validation.valid) {
    console.error('❌ Empresa não está pronta para gerar AFD:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    return
  }

  console.log('✅ Empresa validada com sucesso')

  // 2. Obter estatísticas do período
  console.log('2. Obtendo estatísticas...')
  const stats = await getAFDStatistics(companyId, startDate, endDate)

  if (!stats) {
    console.error('❌ Erro ao obter estatísticas')
    return
  }

  console.log('📊 Estatísticas do período:')
  console.log(`  - Total de funcionários: ${stats.totalEmployees}`)
  console.log(`  - Funcionários com registros: ${stats.employeesWithRecords}`)
  console.log(`  - Total de marcações: ${stats.totalRecords}`)

  // 3. Buscar dados necessários
  console.log('3. Buscando dados do Supabase...')
  const data = await getTimeRecordsForAFD(companyId, startDate, endDate)

  if (!data) {
    console.error('❌ Erro ao buscar dados')
    return
  }

  console.log(`✅ Dados carregados: ${data.employees.length} funcionários, ${data.timeRecords.length} registros`)

  // 4. Gerar AFD
  console.log('4. Gerando arquivo AFD...')

  const afdData: AFDData = {
    company: data.company,
    employees: data.employees,
    timeRecords: data.timeRecords,
    dailyRecords: data.dailyRecords,
    startDate: primeiroDia,
    endDate: ultimoDia,
  }

  const config: AFDConfig = {
    encoding: 'UTF-8',
    repType: 3, // REP-P (programa)
  }

  const result = generateAFD(afdData, config)

  console.log('✅ AFD gerado com sucesso:')
  console.log(`  - Arquivo: ${result.filename}`)
  console.log(`  - Total de registros: ${result.totalRecords}`)
  console.log(`  - Encoding: ${result.encoding}`)
  console.log(`  - Tamanho: ${result.content.length} bytes`)

  // 5. Salvar arquivo (exemplo)
  // Em produção, você pode salvar em cloud storage ou enviar para download
  console.log('\n💾 Para salvar o arquivo:')
  console.log('  - No Node.js: fs.writeFileSync(result.filename, buffer)')
  console.log('  - No Browser: Criar Blob e trigger download')
  console.log('  - No Storage: Upload para S3/GCS/Azure')
}

/**
 * EXEMPLO 2: Geração com ajustes e inclusões
 * Quando há correções manuais de marcações
 */
export async function gerarAFDComAjustes(companyId: string, startDate: string, endDate: string): Promise<void> {
  console.log('\n=== Exemplo 2: AFD com Ajustes e Inclusões ===')

  // Buscar dados base
  const data = await getTimeRecordsForAFD(companyId, startDate, endDate)

  if (!data) {
    console.error('❌ Erro ao buscar dados')
    return
  }

  // Montar AFD com ajustes e inclusões
  const afdData: AFDData = {
    company: data.company,
    employees: data.employees,
    timeRecords: data.timeRecords,
    dailyRecords: data.dailyRecords,
    startDate: new Date(startDate),
    endDate: new Date(endDate),

    // Ajustes: correções de marcações existentes
    adjustments: [
      {
        nsr: 1,
        originalDateTime: new Date('2024-01-15T08:30:00'),
        adjustedDateTime: new Date('2024-01-15T08:00:00'),
        employeePis: '17078136397',
        reason: 'Erro ao bater ponto - registrado no papel',
        adjustedBy: 'João Silva (RH)',
        adjustedAt: new Date('2024-01-16T10:00:00'),
      },
      {
        nsr: 2,
        originalDateTime: new Date('2024-01-16T18:00:00'),
        adjustedDateTime: new Date('2024-01-16T17:30:00'),
        employeePis: '12345678901',
        reason: 'Saída antecipada autorizada',
        adjustedBy: 'Maria Santos (Gerente)',
        adjustedAt: new Date('2024-01-16T17:00:00'),
      },
    ],

    // Inclusões: marcações que não foram capturadas
    inclusions: [
      {
        nsr: 1,
        dateTime: new Date('2024-01-17T09:00:00'),
        employeePis: '17078136397',
        reason: 'Esqueceu de bater ponto na entrada',
        includedBy: 'João Silva (RH)',
        includedAt: new Date('2024-01-18T08:00:00'),
      },
    ],
  }

  const result = generateAFD(afdData, { encoding: 'UTF-8' })

  console.log('✅ AFD com ajustes gerado:')
  console.log(`  - ${afdData.adjustments?.length || 0} ajustes`)
  console.log(`  - ${afdData.inclusions?.length || 0} inclusões`)
  console.log(`  - Total de registros: ${result.totalRecords}`)
}

/**
 * EXEMPLO 3: Geração para fiscalização do MTE
 * Formato ISO-8859-1 para compatibilidade com sistemas antigos
 */
export async function gerarAFDParaFiscalizacao(companyId: string, startDate: string, endDate: string): Promise<Buffer> {
  console.log('\n=== Exemplo 3: AFD para Fiscalização MTE ===')

  // Buscar dados
  const data = await getTimeRecordsForAFD(companyId, startDate, endDate)

  if (!data) {
    throw new Error('Erro ao buscar dados')
  }

  // Configuração específica para MTE
  const config: AFDConfig = {
    encoding: 'ISO-8859-1', // Alguns sistemas do MTE exigem ISO
    layoutVersion: 2, // Portaria 671/2021
    repType: 3, // REP-P
    repNumber: '12345678901234567', // Número de série do seu sistema
  }

  const afdData: AFDData = {
    company: data.company,
    employees: data.employees,
    timeRecords: data.timeRecords,
    dailyRecords: data.dailyRecords,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  }

  // Gerar
  const generator = new AFDGenerator(config)
  const result = generator.generate(afdData)

  console.log('✅ AFD para fiscalização gerado:')
  console.log(`  - Encoding: ${result.encoding} (compatível com MTE)`)
  console.log(`  - Layout: Portaria 671/2021`)
  console.log(`  - Arquivo: ${result.filename}`)

  // Converter para buffer no encoding correto
  const buffer = generator.encodeContent(result.content)

  console.log(`  - Tamanho do buffer: ${buffer.length} bytes`)
  console.log('\n📋 Pronto para entrega ao fiscal do MTE')

  return buffer
}

/**
 * EXEMPLO 4: Validação antes de gerar (pré-flight check)
 * Verifica todos os requisitos antes de tentar gerar
 */
export async function validarAntesDeGerar(companyId: string): Promise<boolean> {
  console.log('\n=== Exemplo 4: Validação Pré-Geração ===')

  // 1. Validar empresa
  console.log('1. Validando empresa...')
  const validation = await validateCompanyForAFD(companyId)

  if (!validation.valid) {
    console.error('❌ Validação falhou:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    return false
  }

  console.log('✅ Empresa validada')

  // 2. Verificar estatísticas dos últimos 30 dias
  console.log('2. Verificando atividade recente...')
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const today = new Date()

  const stats = await getAFDStatistics(
    companyId,
    thirtyDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  )

  if (!stats || stats.totalRecords === 0) {
    console.error('❌ Nenhum registro de ponto nos últimos 30 dias')
    return false
  }

  console.log('✅ Atividade recente encontrada:')
  console.log(`  - ${stats.totalRecords} registros`)
  console.log(`  - ${stats.employeesWithRecords}/${stats.totalEmployees} funcionários com registros`)

  // 3. Alerta se poucos funcionários têm registros
  const percentual = (stats.employeesWithRecords / stats.totalEmployees) * 100

  if (percentual < 50) {
    console.warn(`⚠️  Apenas ${percentual.toFixed(0)}% dos funcionários têm registros`)
    console.warn('   Verifique se todos estão batendo ponto corretamente')
  }

  console.log('\n✅ Sistema pronto para gerar AFD')
  return true
}

/**
 * EXEMPLO 5: Geração em lote (múltiplos meses)
 * Útil para gerar histórico completo
 */
export async function gerarAFDEmLote(companyId: string, mesesAtras: number): Promise<void> {
  console.log(`\n=== Exemplo 5: Geração em Lote (${mesesAtras} meses) ===`)

  const resultados: { mes: string; arquivo: string; registros: number }[] = []

  for (let i = 0; i < mesesAtras; i++) {
    const data = new Date()
    data.setMonth(data.getMonth() - i)

    const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1)
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0)

    const startDate = primeiroDia.toISOString().split('T')[0]
    const endDate = ultimoDia.toISOString().split('T')[0]

    const mesNome = primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    console.log(`\nProcessando ${mesNome}...`)

    try {
      const dados = await getTimeRecordsForAFD(companyId, startDate, endDate)

      if (!dados || dados.timeRecords.length === 0) {
        console.warn(`⚠️  Sem registros em ${mesNome}`)
        continue
      }

      const afdData: AFDData = {
        company: dados.company,
        employees: dados.employees,
        timeRecords: dados.timeRecords,
        dailyRecords: dados.dailyRecords,
        startDate: primeiroDia,
        endDate: ultimoDia,
      }

      const result = generateAFD(afdData)

      resultados.push({
        mes: mesNome,
        arquivo: result.filename,
        registros: result.totalRecords,
      })

      console.log(`✅ ${result.filename} - ${result.totalRecords} registros`)

      // Aqui você salvaria o arquivo
      // await salvarNoStorage(result.filename, result.content)
    } catch (error) {
      console.error(`❌ Erro ao processar ${mesNome}:`, error)
    }
  }

  console.log('\n📊 Resumo da geração em lote:')
  console.log(`Total de arquivos gerados: ${resultados.length}`)

  resultados.forEach(r => {
    console.log(`  - ${r.mes}: ${r.registros} registros`)
  })
}

/**
 * EXEMPLO 6: Download no navegador
 * Para aplicações web front-end
 */
export function downloadAFDNoBrowser(result: { content: string; filename: string }): void {
  console.log('\n=== Exemplo 6: Download no Navegador ===')

  // Criar blob
  const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })

  // Criar URL temporária
  const url = URL.createObjectURL(blob)

  // Criar elemento <a> invisível e clicar
  const link = document.createElement('a')
  link.href = url
  link.download = result.filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Limpar
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  console.log(`✅ Download iniciado: ${result.filename}`)
}

/**
 * EXEMPLO 7: Integração com API
 * Exemplo de como chamar a API REST
 */
export async function baixarAFDViaAPI(companyId: string, startDate: string, endDate: string): Promise<void> {
  console.log('\n=== Exemplo 7: Baixar via API REST ===')

  try {
    // Fazer requisição GET
    const response = await fetch(
      `/api/reports/afd?company_id=${companyId}&start_date=${startDate}&end_date=${endDate}&encoding=UTF-8`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    // Obter headers
    const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'afd.txt'
    const totalRecords = response.headers.get('X-Total-Records')

    // Baixar arquivo
    const blob = await response.blob()

    // Criar download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)

    console.log('✅ Download concluído:')
    console.log(`  - Arquivo: ${filename}`)
    console.log(`  - Total de registros: ${totalRecords}`)
  } catch (error) {
    console.error('❌ Erro ao baixar AFD:', error)
  }
}

// Helper para obter token de autenticação
function getAuthToken(): string {
  // Em produção, obter do seu sistema de autenticação
  // Exemplo: Supabase, Auth0, JWT, etc.
  return 'seu-token-aqui'
}

/**
 * EXEMPLO 8: Agendamento automático
 * Para gerar AFD mensalmente de forma automática
 */
export function agendarGeracaoMensal(companyId: string): void {
  console.log('\n=== Exemplo 8: Agendamento Automático ===')

  // Pseudo-código para agendamento
  // Em produção, usar cron, AWS Lambda scheduled, Vercel Cron, etc.

  console.log('Configurando agendamento mensal...')
  console.log('Executar todo dia 1º às 00:00:')
  console.log(`  - Gerar AFD do mês anterior`)
  console.log(`  - Salvar em cloud storage`)
  console.log(`  - Enviar email para RH`)

  // Exemplo com node-cron (servidor)
  // import cron from 'node-cron'
  //
  // cron.schedule('0 0 1 * *', async () => {
  //   console.log('Gerando AFD mensal automaticamente...')
  //   const mesPassado = new Date()
  //   mesPassado.setMonth(mesPassado.getMonth() - 1)
  //   await gerarAFDMensal(companyId, mesPassado)
  // })

  console.log('✅ Agendamento configurado')
}

// Exportar todos os exemplos
export const exemplosAFD = {
  gerarAFDMensal,
  gerarAFDComAjustes,
  gerarAFDParaFiscalizacao,
  validarAntesDeGerar,
  gerarAFDEmLote,
  downloadAFDNoBrowser,
  baixarAFDViaAPI,
  agendarGeracaoMensal,
}
