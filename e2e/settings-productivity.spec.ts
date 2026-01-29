import { test, expect } from '@playwright/test'

test.describe('Configurações de Produtividade', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login (ajustar conforme seu fluxo de auth)
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('[type="submit"]')

    // Navegar para configurações
    await page.goto('/configuracoes/produtividade')
    await page.waitForLoadState('networkidle')
  })

  test('deve carregar a página corretamente', async ({ page }) => {
    // Verificar título
    await expect(page.getByRole('heading', { name: 'Configurações de Produtividade' })).toBeVisible()

    // Verificar tabs
    await expect(page.getByRole('tab', { name: 'Importação' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Notificações' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Workflows' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Relatórios' })).toBeVisible()
  })

  test('deve navegar entre tabs', async ({ page }) => {
    // Tab de Importação (ativa por padrão)
    await expect(page.getByText('Mapeamento Padrão de Colunas')).toBeVisible()

    // Tab de Notificações
    await page.click('[role="tab"][value="notifications"]')
    await expect(page.getByText('Tipos de Notificação')).toBeVisible()

    // Tab de Workflows
    await page.click('[role="tab"][value="workflows"]')
    await expect(page.getByText('Regras de Aprovação')).toBeVisible()

    // Tab de Relatórios
    await page.click('[role="tab"][value="reports"]')
    await expect(page.getByText('Destino de Relatórios')).toBeVisible()
  })

  test.describe('Import Settings', () => {
    test('deve adicionar nome alternativo', async ({ page }) => {
      // Localizar input de CPF
      const cpfSection = page.locator('text=CPF').locator('..')
      const input = cpfSection.locator('input[placeholder*="alternativo"]')
      const addButton = cpfSection.locator('button:has-text("Adicionar")')

      // Adicionar nome alternativo
      await input.fill('documento')
      await addButton.click()

      // Verificar badge criado
      await expect(cpfSection.locator('text=documento')).toBeVisible()
    })

    test('deve ativar/desativar regras de validação', async ({ page }) => {
      // Localizar switch de CPF obrigatório
      const cpfSwitch = page.locator('text=CPF obrigatório').locator('..').locator('[role="switch"]')

      // Obter estado inicial
      const initialState = await cpfSwitch.getAttribute('data-state')

      // Alternar switch
      await cpfSwitch.click()

      // Verificar mudança de estado
      await expect(cpfSwitch).toHaveAttribute(
        'data-state',
        initialState === 'checked' ? 'unchecked' : 'checked'
      )

      // Aguardar toast de sucesso
      await expect(page.locator('text=Configurações de importação salvas')).toBeVisible({
        timeout: 2000,
      })
    })

    test('deve configurar auto-aprovação', async ({ page }) => {
      // Ativar auto-aprovação
      const autoApproveSwitch = page
        .locator('text=Aprovar automaticamente')
        .locator('..')
        .locator('[role="switch"]')
      await autoApproveSwitch.click()

      // Alterar threshold
      const thresholdInput = page.locator('label:has-text("Limite de linhas") + input')
      await thresholdInput.fill('20')

      // Aguardar auto-save
      await page.waitForTimeout(1500)

      // Verificar toast
      await expect(page.locator('text=Configurações de importação salvas')).toBeVisible()
    })
  })

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('[role="tab"][value="notifications"]')
    })

    test('deve alternar preferências de canal', async ({ page }) => {
      // Localizar primeira linha da tabela
      const firstRow = page.locator('tbody tr').first()

      // Alternar in-app
      const inAppSwitch = firstRow.locator('[role="switch"]').first()
      await inAppSwitch.click()

      // Aguardar auto-save
      await page.waitForTimeout(1500)

      // Verificar toast
      await expect(page.locator('text=Preferências de notificação salvas')).toBeVisible()
    })

    test('deve configurar modo "Não incomodar"', async ({ page }) => {
      // Ativar modo
      const dndSwitch = page.locator('text=Modo "Não incomodar"').locator('..').locator('[role="switch"]')
      await dndSwitch.click()

      // Verificar inputs de horário aparecem
      await expect(page.locator('label:has-text("Início") + input')).toBeVisible()
      await expect(page.locator('label:has-text("Fim") + input')).toBeVisible()

      // Alterar horários
      await page.locator('label:has-text("Início") + input').fill('22:00')
      await page.locator('label:has-text("Fim") + input').fill('08:00')

      // Aguardar auto-save
      await page.waitForTimeout(1500)
      await expect(page.locator('text=Preferências de notificação salvas')).toBeVisible()
    })

    test('deve enviar notificação de teste', async ({ page }) => {
      // Clicar botão de teste
      await page.click('button:has-text("Enviar Notificação de Teste")')

      // Verificar toast
      await expect(page.locator('text=Notificação de teste enviada!')).toBeVisible()
    })
  })

  test.describe('Workflow Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('[role="tab"][value="workflows"]')
    })

    test('deve configurar aprovador', async ({ page }) => {
      // Localizar primeira linha da tabela
      const firstRow = page.locator('tbody tr').first()

      // Abrir select de nível 1
      const level1Select = firstRow.locator('td').nth(1).locator('[role="combobox"]')
      await level1Select.click()

      // Selecionar opção
      await page.locator('[role="option"]').first().click()

      // Aguardar auto-save
      await page.waitForTimeout(1500)
      await expect(page.locator('text=Regras de workflow salvas')).toBeVisible()
    })

    test('deve configurar SLA', async ({ page }) => {
      // Localizar input de SLA da primeira linha
      const firstRow = page.locator('tbody tr').first()
      const slaInput = firstRow.locator('td').nth(3).locator('input')

      // Alterar valor
      await slaInput.fill('48')

      // Aguardar auto-save
      await page.waitForTimeout(1500)
      await expect(page.locator('text=Regras de workflow salvas')).toBeVisible()
    })

    test('deve ativar escalonamento automático', async ({ page }) => {
      // Ativar escalonamento
      const escalateSwitch = page
        .locator('text=Escalonamento automático')
        .locator('..')
        .locator('[role="switch"]')
      await escalateSwitch.click()

      // Verificar input de "Escalar após" aparece
      await expect(page.locator('label:has-text("Escalar após (horas)") + input')).toBeVisible()

      // Alterar valor
      await page.locator('label:has-text("Escalar após (horas)") + input').fill('36')

      // Aguardar auto-save
      await page.waitForTimeout(1500)
      await expect(page.locator('text=Regras de workflow salvas')).toBeVisible()
    })
  })

  test.describe('Report Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('[role="tab"][value="reports"]')
    })

    test('deve selecionar destino padrão', async ({ page }) => {
      // Selecionar "Enviar por email"
      await page.click('[role="radio"][value="email"]')

      // Aguardar auto-save
      await page.waitForTimeout(1500)
      await expect(page.locator('text=Configurações de relatórios salvas')).toBeVisible()
    })

    test('deve selecionar formato padrão', async ({ page }) => {
      // Abrir select
      await page.click('label:has-text("Formato padrão") + [role="combobox"]')

      // Selecionar CSV
      await page.click('[role="option"]:has-text("CSV")')

      // Aguardar auto-save
      await page.waitForTimeout(1500)
      await expect(page.locator('text=Configurações de relatórios salvas')).toBeVisible()
    })
  })

  test('deve persistir alterações após reload', async ({ page }) => {
    // Fazer alteração
    const cpfSwitch = page.locator('text=CPF obrigatório').locator('..').locator('[role="switch"]')
    const initialState = await cpfSwitch.getAttribute('data-state')
    await cpfSwitch.click()

    // Aguardar save
    await page.waitForTimeout(1500)

    // Recarregar página
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verificar estado mudou
    const newCpfSwitch = page.locator('text=CPF obrigatório').locator('..').locator('[role="switch"]')
    await expect(newCpfSwitch).toHaveAttribute(
      'data-state',
      initialState === 'checked' ? 'unchecked' : 'checked'
    )
  })
})
