#!/usr/bin/env ts-node
/**
 * Script de Verificação da Fase 8
 *
 * Verifica se todos os componentes da Fase 8 estão corretamente configurados.
 *
 * Uso: npx ts-node scripts/verify-phase8.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, message: string, isWarning = false): void {
  results.push({
    name,
    status: condition ? 'pass' : (isWarning ? 'warning' : 'fail'),
    message: condition ? `✓ ${message}` : `✗ ${message}`
  })
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

function fileContains(filePath: string, content: string): boolean {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return fileContent.includes(content)
  } catch {
    return false
  }
}

console.log('🔍 Verificando Fase 8 - Diferenciação\n')

// ============================================
// 1. Verificar Arquivos de Documentação
// ============================================

console.log('📚 Verificando Documentação...')

check(
  'FASE8_DIFERENCIACAO.md',
  fileExists('FASE8_DIFERENCIACAO.md'),
  'Documentação técnica encontrada'
)

check(
  'SETUP_FASE8.md',
  fileExists('SETUP_FASE8.md'),
  'Guia de setup encontrado'
)

check(
  'GUIA_USUARIO_FASE8.md',
  fileExists('GUIA_USUARIO_FASE8.md'),
  'Guia do usuário encontrado'
)

check(
  'API_FASE8.md',
  fileExists('API_FASE8.md'),
  'Documentação de API encontrada'
)

check(
  'DEPLOY_FASE8.md',
  fileExists('DEPLOY_FASE8.md'),
  'Checklist de deploy encontrado'
)

check(
  'CHANGELOG.md',
  fileExists('CHANGELOG.md'),
  'Changelog encontrado'
)

// ============================================
// 2. Verificar Arquivos de Código
// ============================================

console.log('\n💻 Verificando Código...')

check(
  'integration/phase8.ts',
  fileExists('src/lib/integration/phase8.ts'),
  'Integration layer encontrado'
)

check(
  'features/flags.ts',
  fileExists('src/lib/features/flags.ts'),
  'Feature flags encontrado'
)

check(
  'analytics types',
  fileExists('src/types/analytics.ts'),
  'Types de analytics encontrados'
)

// ============================================
// 3. Verificar PWA Assets
// ============================================

console.log('\n📱 Verificando PWA...')

check(
  'manifest.json',
  fileExists('public/manifest.json'),
  'PWA manifest encontrado'
)

check(
  'service worker',
  fileExists('public/sw.js'),
  'Service Worker encontrado'
)

check(
  'icon-192.png',
  fileExists('public/icon-192.png'),
  'Ícone 192x192 encontrado'
)

check(
  'icon-512.png',
  fileExists('public/icon-512.png'),
  'Ícone 512x512 encontrado'
)

// ============================================
// 4. Verificar Environment Variables
// ============================================

console.log('\n🔐 Verificando Variáveis de Ambiente...')

check(
  '.env.example',
  fileExists('.env.example'),
  'Arquivo .env.example encontrado'
)

check(
  'PWA vars in .env.example',
  fileContains('.env.example', 'NEXT_PUBLIC_PWA_ENABLED'),
  'Variáveis PWA no .env.example'
)

check(
  'AI vars in .env.example',
  fileContains('.env.example', 'OPENAI_API_KEY'),
  'Variáveis AI no .env.example'
)

check(
  'Analytics vars in .env.example',
  fileContains('.env.example', 'ANALYTICS_ENABLED'),
  'Variáveis Analytics no .env.example'
)

// ============================================
// 5. Verificar Componentes Existentes
// ============================================

console.log('\n🎨 Verificando Componentes...')

check(
  'chat-widget',
  fileExists('src/components/support/chat-widget.tsx'),
  'Widget de chatbot encontrado'
)

check(
  'organograma page',
  fileExists('src/app/(dashboard)/funcionarios/organograma/page.tsx'),
  'Página de organograma encontrada'
)

// ============================================
// 6. Verificar Dependencies
// ============================================

console.log('\n📦 Verificando Dependências...')

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  check(
    '@xyflow/react',
    '@xyflow/react' in deps,
    'Dependência @xyflow/react instalada (Organograma)',
    true
  )

  check(
    'recharts',
    'recharts' in deps,
    'Dependência recharts instalada (Analytics)'
  )

  check(
    'jspdf',
    'jspdf' in deps,
    'Dependência jspdf instalada (Export PDF)',
    true
  )
} catch (error) {
  check(
    'package.json',
    false,
    'Erro ao ler package.json'
  )
}

// ============================================
// 7. Verificar Configurações do Projeto
// ============================================

console.log('\n⚙️  Verificando Configurações...')

check(
  'README.md updated',
  fileContains('README.md', 'Fase 8'),
  'README.md atualizado com Fase 8'
)

check(
  'CHANGELOG.md has v2.0.0',
  fileContains('CHANGELOG.md', '2.0.0'),
  'CHANGELOG.md contém versão 2.0.0'
)

// ============================================
// 8. Exibir Resultados
// ============================================

console.log('\n' + '='.repeat(60))
console.log('RESULTADOS DA VERIFICAÇÃO')
console.log('='.repeat(60) + '\n')

const passed = results.filter(r => r.status === 'pass').length
const failed = results.filter(r => r.status === 'fail').length
const warnings = results.filter(r => r.status === 'warning').length

results.forEach(result => {
  const icon = result.status === 'pass' ? '✓' : result.status === 'warning' ? '⚠' : '✗'
  const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'warning' ? '\x1b[33m' : '\x1b[31m'
  const reset = '\x1b[0m'
  console.log(`${color}${icon}${reset} ${result.message}`)
})

console.log('\n' + '='.repeat(60))
console.log(`Total: ${results.length} verificações`)
console.log(`\x1b[32m✓ Passou: ${passed}\x1b[0m`)
if (warnings > 0) {
  console.log(`\x1b[33m⚠ Avisos: ${warnings}\x1b[0m`)
}
if (failed > 0) {
  console.log(`\x1b[31m✗ Falhou: ${failed}\x1b[0m`)
}
console.log('='.repeat(60))

// ============================================
// 9. Recomendações
// ============================================

if (failed > 0 || warnings > 0) {
  console.log('\n📋 RECOMENDAÇÕES:\n')

  if (!fileExists('src/lib/integration/phase8.ts')) {
    console.log('- Criar arquivo de integração: src/lib/integration/phase8.ts')
  }

  if (!fileExists('src/lib/features/flags.ts')) {
    console.log('- Criar arquivo de feature flags: src/lib/features/flags.ts')
  }

  if (!fileContains('.env.example', 'OPENAI_API_KEY')) {
    console.log('- Adicionar variáveis da Fase 8 ao .env.example')
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  if (!('@xyflow/react' in deps)) {
    console.log('- Instalar dependência: npm install @xyflow/react')
  }

  if (!('jspdf' in deps)) {
    console.log('- Instalar dependência: npm install jspdf jspdf-autotable')
  }
}

// ============================================
// 10. Próximos Passos
// ============================================

console.log('\n🚀 PRÓXIMOS PASSOS:\n')
console.log('1. Revisar documentação em FASE8_COMPLETO.md')
console.log('2. Seguir setup em SETUP_FASE8.md')
console.log('3. Implementar APIs conforme API_FASE8.md')
console.log('4. Usar checklist em DEPLOY_FASE8.md antes do deploy')
console.log('5. Treinar usuários com GUIA_USUARIO_FASE8.md')

console.log('\n📖 DOCUMENTAÇÃO COMPLETA:')
console.log('- Técnica: FASE8_DIFERENCIACAO.md')
console.log('- Setup: SETUP_FASE8.md')
console.log('- APIs: API_FASE8.md')
console.log('- Deploy: DEPLOY_FASE8.md')
console.log('- Usuário: GUIA_USUARIO_FASE8.md')
console.log('- Resumo: FASE8_COMPLETO.md')

// ============================================
// Exit Code
// ============================================

const exitCode = failed > 0 ? 1 : 0
process.exit(exitCode)
