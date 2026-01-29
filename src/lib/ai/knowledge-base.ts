/**
 * Knowledge Base Service
 * Base de conhecimento com FAQs e políticas da empresa
 */

import type { KnowledgeEntry, CompanyPolicy } from '@/types/ai'

// ============================================================================
// Knowledge Base Data
// ============================================================================

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // Férias
  {
    id: 'kb-001',
    category: 'Férias',
    question: 'Como solicitar férias?',
    answer: `Para solicitar férias, siga estes passos:

1. Acesse o menu "Ausências" no sistema
2. Clique em "Nova Solicitação"
3. Selecione o tipo "Férias"
4. Escolha o período desejado (mínimo de 5 dias corridos)
5. Aguarde a aprovação do seu gestor

**Importante:**
- Você deve solicitar com no mínimo 30 dias de antecedência
- Precisa ter completado 12 meses de trabalho para o primeiro período
- Você pode dividir suas férias em até 3 períodos (um deles deve ter no mínimo 14 dias)

Se tiver dúvidas, fale com seu gestor ou com o RH.`,
    keywords: ['férias', 'solicitar', 'pedir', 'como'],
    relatedQuestions: [
      'Qual o prazo para solicitar férias?',
      'Posso dividir minhas férias?',
      'Como consultar meu saldo de férias?'
    ],
    source: 'Manual do Colaborador - Seção 4.2',
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'kb-002',
    category: 'Férias',
    question: 'Posso vender férias?',
    answer: `Sim, você pode vender até 1/3 (um terço) do seu período de férias.

**Como funciona:**
- Você vende até 10 dias de férias
- Recebe o valor correspondente junto com as férias
- Deve indicar essa opção ao solicitar as férias
- A venda é opcional e não obrigatória

**Exemplo:** Se você tem 30 dias de férias, pode vender 10 dias e tirar 20 dias de descanso.

Para vender férias, marque a opção "Abono Pecuniário" ao fazer a solicitação.`,
    keywords: ['vender férias', 'abono pecuniário', 'terço'],
    relatedQuestions: ['Como solicitar férias?', 'Como funciona o pagamento de férias?'],
    source: 'CLT Art. 143',
    lastUpdated: new Date('2024-01-15'),
  },

  // Banco de Horas
  {
    id: 'kb-003',
    category: 'Ponto',
    question: 'Como funciona o banco de horas?',
    answer: `O banco de horas é um sistema que compensa horas extras trabalhadas com folgas.

**Regras:**
- Horas extras são creditadas no banco de horas
- Você pode usar essas horas para sair mais cedo ou faltar
- O saldo deve ser compensado em até 6 meses
- Após 6 meses, horas não compensadas são pagas como extras

**Como usar:**
1. Consulte seu saldo em "Ponto > Banco de Horas"
2. Para usar, solicite folga ou saída antecipada ao gestor
3. O sistema deduz automaticamente do seu banco

**Importante:** Horas negativas devem ser compensadas trabalhando a mais em outros dias.`,
    keywords: ['banco de horas', 'compensação', 'horas extras'],
    relatedQuestions: [
      'Como consultar meu banco de horas?',
      'Posso acumular horas extras?',
      'O que acontece se não compensar as horas?'
    ],
    source: 'Política de Ponto - Seção 3',
    lastUpdated: new Date('2024-01-15'),
  },

  // Holerite
  {
    id: 'kb-004',
    category: 'Folha de Pagamento',
    question: 'Como entender meu holerite?',
    answer: `O holerite contém todas as informações sobre sua remuneração mensal.

**Principais itens:**

**PROVENTOS (valores que você recebe):**
- Salário Base
- Horas Extras (se houver)
- Adicional Noturno (se aplicável)
- Comissões e Bonificações
- Vale Refeição / Alimentação
- Vale Transporte

**DESCONTOS:**
- INSS (8% a 14% do salário)
- IRRF (Imposto de Renda)
- Vale Transporte (até 6% do salário)
- Plano de Saúde (sua parte)
- Outros descontos

**LÍQUIDO:** Valor que você recebe na conta (Proventos - Descontos)

Para dúvidas específicas sobre valores, consulte o financeiro ou RH.`,
    keywords: ['holerite', 'contracheque', 'salário', 'entender'],
    relatedQuestions: [
      'Quando recebo meu salário?',
      'Como é calculado o INSS?',
      'Como é calculado o IRRF?'
    ],
    source: 'Guia de Folha de Pagamento',
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 'kb-005',
    category: 'Folha de Pagamento',
    question: 'Quando recebo meu salário?',
    answer: `O pagamento do salário segue o seguinte calendário:

**Data de Pagamento:** Todo dia 5 do mês seguinte

**Exemplo:** O salário de janeiro é pago no dia 05 de fevereiro.

**Se o dia 5 cair em fim de semana ou feriado:**
- O pagamento é antecipado para o último dia útil anterior

**Adiantamento:**
- Disponível no dia 20 de cada mês
- Valor: até 40% do salário
- Opcional, mediante solicitação

O holerite fica disponível no sistema 2 dias antes do pagamento.`,
    keywords: ['pagamento', 'salário', 'quando', 'data'],
    relatedQuestions: [
      'Como solicitar adiantamento?',
      'Como consultar meu holerite?',
      'O que fazer se não recebi meu salário?'
    ],
    source: 'Política de Folha de Pagamento',
    lastUpdated: new Date('2024-01-15'),
  },

  // Benefícios
  {
    id: 'kb-006',
    category: 'Benefícios',
    question: 'Quais benefícios a empresa oferece?',
    answer: `A empresa oferece os seguintes benefícios:

**Obrigatórios:**
- Vale Refeição: R$ 30,00/dia
- Vale Transporte: conforme necessidade
- Férias + 1/3 constitucional
- 13º salário

**Opcionais:**
- Plano de Saúde (coparticipação de 20%)
- Plano Odontológico (sem custo)
- Seguro de Vida
- Auxílio Creche (até 6 anos)
- Gympass / Wellhub

**Desenvolvimento:**
- Cursos e Treinamentos
- Ajuda de Custo para Graduação
- Programa de Idiomas

Para saber mais sobre cada benefício, acesse "Perfil > Meus Benefícios" ou fale com o RH.`,
    keywords: ['benefícios', 'vr', 'va', 'plano de saúde', 'quais'],
    relatedQuestions: [
      'Como aderir ao plano de saúde?',
      'Como usar o vale refeição?',
      'Como funciona o auxílio creche?'
    ],
    source: 'Manual de Benefícios',
    lastUpdated: new Date('2024-01-15'),
  },

  // Ponto
  {
    id: 'kb-007',
    category: 'Ponto',
    question: 'Como registrar ponto?',
    answer: `O registro de ponto é obrigatório e pode ser feito de várias formas:

**Opções de Registro:**

1. **Ponto Eletrônico (Relógio):**
   - Aproxime seu crachá do leitor
   - Aguarde o bip de confirmação
   - Localizado na entrada da empresa

2. **Aplicativo Mobile:**
   - Baixe o app "RH Mobile"
   - Faça login com suas credenciais
   - Clique em "Registrar Ponto"
   - A localização GPS é registrada

3. **Sistema Web:**
   - Acesse "Ponto > Registrar"
   - Clique no botão de registro
   - Disponível apenas para home office aprovado

**Horários Obrigatórios:**
- Entrada
- Saída para Almoço
- Retorno do Almoço
- Saída

**Esqueci de bater o ponto?** Solicite ajuste através do sistema em até 2 dias úteis.`,
    keywords: ['ponto', 'registrar', 'bater', 'como'],
    relatedQuestions: [
      'Esqueci de bater o ponto, o que fazer?',
      'Posso ajustar meu ponto?',
      'Como consultar meu histórico de ponto?'
    ],
    source: 'Manual de Ponto Eletrônico',
    lastUpdated: new Date('2024-01-15'),
  },

  // Documentos
  {
    id: 'kb-008',
    category: 'Documentos',
    question: 'Como solicitar declaração de vínculo?',
    answer: `Para solicitar uma declaração de vínculo empregatício:

**Pelo Sistema:**
1. Acesse "Documentos > Nova Solicitação"
2. Selecione "Declaração de Vínculo"
3. Informe a finalidade (opcional)
4. Clique em "Solicitar"

**Prazo de Entrega:** até 3 dias úteis

**Retirada:**
- Por e-mail (PDF assinado digitalmente)
- Presencial no RH (documento físico)

**Tipos de Declaração Disponíveis:**
- Vínculo Empregatício
- Renda/Salário
- Férias
- Tempo de Serviço
- Para fins específicos

Todas as declarações são gratuitas e ilimitadas.`,
    keywords: ['declaração', 'documento', 'vínculo', 'solicitar'],
    relatedQuestions: [
      'Quanto tempo demora para receber a declaração?',
      'Posso solicitar declaração para qualquer finalidade?',
      'A declaração tem validade?'
    ],
    source: 'Procedimento de Documentos',
    lastUpdated: new Date('2024-01-15'),
  },

  // Atestado Médico
  {
    id: 'kb-009',
    category: 'Ausências',
    question: 'Como apresentar atestado médico?',
    answer: `Para apresentar atestado médico:

**Processo:**
1. Envie o atestado em até 48 horas após o retorno
2. Pelo sistema: "Ausências > Enviar Atestado"
3. Ou presencialmente ao RH

**Requisitos do Atestado:**
- Nome completo do médico e CRM
- Período de afastamento (data início e fim)
- CID (opcional, mas recomendado)
- Carimbo e assinatura do médico
- Deve ser legível (foto ou scan de qualidade)

**Regras:**
- Até 15 dias: a empresa paga
- Acima de 15 dias: INSS assume (auxílio-doença)
- Você deve apresentar também o atestado original ao RH

**Dúvidas médicas?** Entre em contato com o ambulatório ou SESMT.`,
    keywords: ['atestado', 'médico', 'falta', 'doença'],
    relatedQuestions: [
      'O que acontece se não apresentar o atestado?',
      'Posso trabalhar em casa durante o atestado?',
      'Como funciona o auxílio-doença?'
    ],
    source: 'Política de Ausências - Seção 2.3',
    lastUpdated: new Date('2024-01-15'),
  },

  // Dados Pessoais
  {
    id: 'kb-010',
    category: 'Cadastro',
    question: 'Como atualizar meus dados pessoais?',
    answer: `Para atualizar seus dados pessoais:

**Dados que VOCÊ pode alterar pelo sistema:**
- Telefone
- E-mail pessoal
- Endereço
- Estado Civil
- Número de Dependentes
- Contato de Emergência

**Como fazer:**
1. Acesse "Perfil > Meus Dados"
2. Clique em "Editar"
3. Atualize os campos necessários
4. Salve as alterações

**Dados que precisam de validação do RH:**
- Nome
- CPF
- RG
- Dados Bancários
- Escolaridade

Para estes, envie solicitação ao RH com documentação comprobatória.

**IMPORTANTE:** Mantenha seus dados sempre atualizados para receber comunicações importantes.`,
    keywords: ['atualizar', 'dados', 'cadastro', 'informações'],
    relatedQuestions: [
      'Como alterar minha conta bancária?',
      'Como adicionar dependentes?',
      'Como atualizar telefone de emergência?'
    ],
    source: 'Manual do Sistema',
    lastUpdated: new Date('2024-01-15'),
  },
]

// ============================================================================
// Company Policies
// ============================================================================

export const COMPANY_POLICIES: CompanyPolicy[] = [
  {
    id: 'policy-001',
    title: 'Política de Férias',
    category: 'Ausências',
    content: `[Conteúdo completo da política de férias...]`,
    effectiveDate: new Date('2024-01-01'),
    version: '2.0',
  },
  {
    id: 'policy-002',
    title: 'Código de Conduta',
    category: 'Compliance',
    content: `[Conteúdo completo do código de conduta...]`,
    effectiveDate: new Date('2024-01-01'),
    version: '1.0',
  },
  {
    id: 'policy-003',
    title: 'Política de Home Office',
    category: 'Trabalho Remoto',
    content: `[Conteúdo completo da política de home office...]`,
    effectiveDate: new Date('2024-01-01'),
    version: '1.5',
  },
]

// ============================================================================
// Search Functions
// ============================================================================

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function calculateRelevance(query: string, entry: KnowledgeEntry): number {
  const normalizedQuery = normalizeText(query)
  const queryWords = normalizedQuery.split(/\s+/)

  let score = 0

  // Check question match
  const normalizedQuestion = normalizeText(entry.question)
  if (normalizedQuestion.includes(normalizedQuery)) {
    score += 50
  }

  // Check keyword matches
  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeText(keyword)
    if (normalizedQuery.includes(normalizedKeyword)) {
      score += 20
    }
  }

  // Check individual word matches
  for (const word of queryWords) {
    if (word.length < 3) continue // Skip very short words

    if (normalizedQuestion.includes(word)) {
      score += 5
    }

    const normalizedAnswer = normalizeText(entry.answer)
    if (normalizedAnswer.includes(word)) {
      score += 2
    }
  }

  // Check category match
  const normalizedCategory = normalizeText(entry.category)
  for (const word of queryWords) {
    if (normalizedCategory.includes(word)) {
      score += 10
    }
  }

  return score
}

export async function searchKnowledgeBase(
  query: string,
  options: {
    limit?: number
    minScore?: number
    category?: string
  } = {}
): Promise<KnowledgeEntry[]> {
  const { limit = 5, minScore = 10, category } = options

  let results = KNOWLEDGE_BASE

  // Filter by category if specified
  if (category) {
    results = results.filter(entry =>
      normalizeText(entry.category) === normalizeText(category)
    )
  }

  // Calculate relevance scores
  const scored = results.map(entry => ({
    entry,
    score: calculateRelevance(query, entry),
  }))

  // Filter by minimum score and sort by score
  const filtered = scored
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.entry)

  return filtered
}

export async function getKnowledgeByCategory(category: string): Promise<KnowledgeEntry[]> {
  return KNOWLEDGE_BASE.filter(entry =>
    normalizeText(entry.category) === normalizeText(category)
  )
}

export async function getAllCategories(): Promise<string[]> {
  const categories = new Set<string>()
  KNOWLEDGE_BASE.forEach(entry => categories.add(entry.category))
  return Array.from(categories).sort()
}

export async function getRelatedQuestions(entryId: string): Promise<KnowledgeEntry[]> {
  const entry = KNOWLEDGE_BASE.find(e => e.id === entryId)
  if (!entry || !entry.relatedQuestions) return []

  const related: KnowledgeEntry[] = []

  for (const question of entry.relatedQuestions) {
    const found = KNOWLEDGE_BASE.find(e =>
      normalizeText(e.question) === normalizeText(question)
    )
    if (found) {
      related.push(found)
    }
  }

  return related
}

// ============================================================================
// Policy Functions
// ============================================================================

export async function searchPolicies(query: string): Promise<CompanyPolicy[]> {
  const normalizedQuery = normalizeText(query)

  const scored = COMPANY_POLICIES.map(policy => {
    let score = 0

    const normalizedTitle = normalizeText(policy.title)
    if (normalizedTitle.includes(normalizedQuery)) {
      score += 50
    }

    const normalizedCategory = normalizeText(policy.category)
    if (normalizedCategory.includes(normalizedQuery)) {
      score += 30
    }

    const normalizedContent = normalizeText(policy.content)
    if (normalizedContent.includes(normalizedQuery)) {
      score += 10
    }

    return { policy, score }
  })

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.policy)
}

export async function getPolicyById(id: string): Promise<CompanyPolicy | null> {
  return COMPANY_POLICIES.find(p => p.id === id) || null
}

export async function getPoliciesByCategory(category: string): Promise<CompanyPolicy[]> {
  return COMPANY_POLICIES.filter(p =>
    normalizeText(p.category) === normalizeText(category)
  )
}
