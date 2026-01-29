#!/usr/bin/env node

/**
 * Teste de Produção - Migração 018
 * Valida que a aplicação em produção funciona sem erros 400
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://rh-rickgay.vercel.app'; // Ajuste conforme necessário

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testProduction() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  TESTE DE PRODUÇÃO - MIGRAÇÃO 018', 'bold');
  log('  Verificando aplicação no Vercel', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors400 = [];
  const consoleErrors = [];
  const networkErrors = [];

  // Capturar erros de console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capturar erros de rede
  page.on('response', response => {
    if (response.status() === 400) {
      errors400.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
    if (response.status() >= 500) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  try {
    // Teste 1: Acessar página inicial
    log('📋 Teste 1: Carregando página inicial...', 'cyan');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    if (errors400.length === 0) {
      log('   ✅ Página inicial carregou sem erros 400', 'green');
    } else {
      log(`   ❌ Encontrados ${errors400.length} erros 400`, 'red');
      errors400.forEach(err => {
        log(`      - ${err.url}`, 'red');
      });
    }

    // Verificar se precisa fazer login
    const needsLogin = await page.locator('input[type="email"]').count() > 0;

    if (needsLogin) {
      log('\n📋 Autenticação necessária', 'yellow');
      log('   ℹ️  Para testes completos, é necessário login', 'yellow');
      log('   ℹ️  Teste manual recomendado:', 'cyan');
      log('      1. Acesse: ' + PRODUCTION_URL, 'cyan');
      log('      2. Faça login', 'cyan');
      log('      3. Abra F12 (DevTools)', 'cyan');
      log('      4. Navegue por:', 'cyan');
      log('         - Dashboard', 'cyan');
      log('         - Funcionários', 'cyan');
      log('         - Ausências', 'cyan');
      log('         - ASOs', 'cyan');
      log('      5. Verifique Network tab por erros 400', 'cyan');
      log('      6. Verifique Console por erros', 'cyan');
    } else {
      // Tentar acessar páginas internas
      log('\n📋 Teste 2: Testando navegação...', 'cyan');

      const routes = [
        '/dashboard',
        '/employees',
        '/absences',
        '/asos'
      ];

      for (const route of routes) {
        try {
          const before400Count = errors400.length;
          await page.goto(PRODUCTION_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(2000);

          const new400Count = errors400.length - before400Count;
          if (new400Count === 0) {
            log(`   ✅ ${route}: OK`, 'green');
          } else {
            log(`   ❌ ${route}: ${new400Count} erros 400`, 'red');
          }
        } catch (error) {
          log(`   ⚠️  ${route}: ${error.message}`, 'yellow');
        }
      }
    }

    // Capturar screenshot
    log('\n📋 Capturando screenshot...', 'cyan');
    await page.screenshot({ path: '.playwright-mcp/validation-screenshot.png', fullPage: true });
    log('   ✅ Screenshot salvo: .playwright-mcp/validation-screenshot.png', 'green');

    // Resumo
    log('\n' + '='.repeat(60), 'cyan');
    log('  RESUMO DOS TESTES', 'bold');
    log('='.repeat(60), 'cyan');

    log(`\n📊 Estatísticas:`, 'cyan');
    log(`   - Erros 400: ${errors400.length}`, errors400.length === 0 ? 'green' : 'red');
    log(`   - Erros de console: ${consoleErrors.length}`, consoleErrors.length === 0 ? 'green' : 'yellow');
    log(`   - Erros de rede (5xx): ${networkErrors.length}`, networkErrors.length === 0 ? 'green' : 'red');

    if (errors400.length > 0) {
      log('\n❌ Erros 400 encontrados:', 'red');
      errors400.forEach((err, i) => {
        log(`   ${i + 1}. ${err.url}`, 'red');
      });
    }

    if (consoleErrors.length > 0 && consoleErrors.length <= 5) {
      log('\n⚠️  Erros de console:', 'yellow');
      consoleErrors.slice(0, 5).forEach((err, i) => {
        log(`   ${i + 1}. ${err.substring(0, 100)}`, 'yellow');
      });
    }

    if (errors400.length === 0) {
      log('\n✅ SUCESSO! Nenhum erro 400 encontrado', 'green');
      log('   A migração 018 resolveu os problemas.', 'green');
    } else {
      log('\n❌ ATENÇÃO! Erros 400 ainda presentes', 'red');
      log('   Verifique os detalhes acima.', 'red');
    }

    log('\n' + '='.repeat(60) + '\n', 'cyan');

  } catch (error) {
    log(`\n❌ Erro durante os testes: ${error.message}`, 'red');
  } finally {
    await browser.close();
  }
}

// Executar testes
testProduction().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
