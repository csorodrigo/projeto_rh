/**
 * Testes para AEJ XML Generator
 *
 * Para executar: npm test aej-xml-generator.test.ts
 */

import { describe, it, expect } from '@jest/globals'
import { AEJXMLGenerator, type AEJXMLData, type AEJXMLConfig } from './aej-xml-generator'
import type { Company, Employee, TimeTrackingDaily } from '@/types/database'

// Mock de dados para testes
const mockCompany: Company = {
  id: 'company-123',
  name: 'Empresa Teste LTDA',
  cnpj: '12.345.678/0001-90',
  address: {
    street: 'Rua Teste',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as Company

const mockEmployee: Employee = {
  id: 'emp-123',
  company_id: 'company-123',
  name: 'João da Silva',
  cpf: '123.456.789-00',
  pis: '123.45678.90-1',
  employee_number: '001',
  position: 'Desenvolvedor',
  department: 'TI',
  salary: 5000,
  weekly_hours: 44,
  hire_date: '2023-01-01',
  birth_date: '1990-01-15',
  status: 'active',
  contract_type: 'clt',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as Employee

const mockDailyRecords: TimeTrackingDaily[] = [
  {
    id: 'daily-1',
    company_id: 'company-123',
    employee_id: 'emp-123',
    date: '2024-01-02',
    clock_in: '08:00:00',
    clock_out: '17:00:00',
    break_start: '12:00:00',
    break_end: '13:00:00',
    total_worked_minutes: 480,
    total_break_minutes: 60,
    overtime_50_minutes: 0,
    overtime_100_minutes: 0,
    night_minutes: 0,
    is_workday: true,
    is_holiday: false,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'daily-2',
    company_id: 'company-123',
    employee_id: 'emp-123',
    date: '2024-01-03',
    clock_in: '08:00:00',
    clock_out: '19:00:00', // 2 horas extras
    break_start: '12:00:00',
    break_end: '13:00:00',
    total_worked_minutes: 600,
    total_break_minutes: 60,
    overtime_50_minutes: 120, // 2 horas
    overtime_100_minutes: 0,
    night_minutes: 0,
    is_workday: true,
    is_holiday: false,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
] as TimeTrackingDaily[]

describe('AEJXMLGenerator', () => {
  const config: AEJXMLConfig = {
    environment: '2', // Homologação
    processVersion: '1.0.0-test',
    includeOvertimeDetails: true,
    includeMonetaryValues: true,
  }

  const generator = new AEJXMLGenerator(config)

  const testData: AEJXMLData = {
    company: mockCompany,
    employees: [mockEmployee],
    dailyRecords: mockDailyRecords,
    workSchedules: [],
    holidays: [],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    referenceMonth: '2024-01',
  }

  describe('generate()', () => {
    it('deve gerar XML válido', () => {
      const result = generator.generate(testData)

      expect(result).toBeDefined()
      expect(result.xml).toBeTruthy()
      expect(result.filename).toContain('AEJ_')
      expect(result.filename).toContain('.xml')
      expect(result.totalEmployees).toBe(1)
      expect(result.period).toBe('2024-01')
    })

    it('deve incluir XML declaration', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    })

    it('deve incluir namespace do e-Social', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">')
    })

    it('deve incluir evento S-1200', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<evtRemun Id=')
      expect(result.xml).toContain('</evtRemun>')
    })

    it('deve incluir identificação do evento', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<ideEvento>')
      expect(result.xml).toContain('<tpAmb>2</tpAmb>') // Homologação
      expect(result.xml).toContain('<perApur>2024-01</perApur>')
      expect(result.xml).toContain('<procEmi>1</procEmi>')
      expect(result.xml).toContain('<verProc>1.0.0-test</verProc>')
    })

    it('deve incluir identificação do empregador', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<ideEmpregador>')
      expect(result.xml).toContain('<tpInsc>1</tpInsc>') // CNPJ
      expect(result.xml).toContain('<nrInsc>12345678000190</nrInsc>') // CNPJ limpo
    })

    it('deve incluir dados do trabalhador', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<ideTrabalhador>')
      expect(result.xml).toContain('<cpfTrab>12345678900</cpfTrab>') // CPF limpo
      expect(result.xml).toContain('<nmTrab>João da Silva</nmTrab>')
      expect(result.xml).toContain('<matricula>001</matricula>')
    })

    it('deve incluir itens de remuneração', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<itensRemun>')
      expect(result.xml).toContain('<codRubr>1000</codRubr>') // Salário
      expect(result.xml).toContain('<vrRubr>5000.00</vrRubr>') // Valor do salário
    })

    it('deve incluir horas extras quando configurado', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<codRubr>2001</codRubr>') // HE 50%
    })

    it('deve incluir informações de jornada contratual', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('<infoHorContratual>')
      expect(result.xml).toContain('<hrEntr>')
      expect(result.xml).toContain('<hrSaida>')
      expect(result.xml).toContain('<durJornada>')
      expect(result.xml).toContain('<perHorFlexivel>')
    })

    it('deve fechar todas as tags corretamente', () => {
      const result = generator.generate(testData)

      expect(result.xml).toContain('</eSocial>')
      expect(result.xml).toContain('</evtRemun>')
      expect(result.xml).toContain('</ideEvento>')
      expect(result.xml).toContain('</ideEmpregador>')
      expect(result.xml).toContain('</ideTrabalhador>')
    })

    it('deve gerar nome de arquivo correto', () => {
      const result = generator.generate(testData)

      expect(result.filename).toMatch(/^AEJ_\d{14}_\d{6}\.xml$/)
      expect(result.filename).toContain('12345678000190') // CNPJ limpo
    })

    it('deve gerar eventId único', () => {
      const result1 = generator.generate(testData)
      const result2 = generator.generate(testData)

      expect(result1.eventId).toBeTruthy()
      expect(result2.eventId).toBeTruthy()
      expect(result1.eventId).not.toBe(result2.eventId) // IDs diferentes
    })
  })

  describe('validateXML()', () => {
    it('deve validar XML bem formado', () => {
      const result = generator.generate(testData)
      const validation = generator.validateXML(result.xml)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('deve detectar XML sem declaration', () => {
      const invalidXml = '<eSocial></eSocial>'
      const validation = generator.validateXML(invalidXml)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('XML declaration missing')
    })

    it('deve detectar XML sem root element', () => {
      const invalidXml = '<?xml version="1.0" encoding="UTF-8"?><test></test>'
      const validation = generator.validateXML(invalidXml)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('eSocial root element missing')
    })

    it('deve detectar XML sem evento', () => {
      const invalidXml = '<?xml version="1.0" encoding="UTF-8"?><eSocial></eSocial>'
      const validation = generator.validateXML(invalidXml)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('evtRemun event missing')
    })
  })

  describe('escapeXml()', () => {
    it('deve escapar caracteres especiais', () => {
      const result = generator.generate({
        ...testData,
        employees: [{
          ...mockEmployee,
          name: 'João & Maria < > " \' Test',
        }],
      })

      expect(result.xml).toContain('&amp;')
      expect(result.xml).toContain('&lt;')
      expect(result.xml).toContain('&gt;')
      expect(result.xml).not.toContain('<nmTrab>João & Maria')
    })
  })

  describe('cleanDocument()', () => {
    it('deve limpar CNPJ formatado', () => {
      const result = generator.generate(testData)

      // CNPJ formatado: 12.345.678/0001-90
      // CNPJ limpo: 12345678000190
      expect(result.xml).toContain('12345678000190')
      expect(result.xml).not.toContain('12.345.678/0001-90')
    })

    it('deve limpar CPF formatado', () => {
      const result = generator.generate(testData)

      // CPF formatado: 123.456.789-00
      // CPF limpo: 12345678900
      expect(result.xml).toContain('12345678900')
      expect(result.xml).not.toContain('123.456.789-00')
    })
  })

  describe('formatTime()', () => {
    it('deve formatar hora no formato HH:MM', () => {
      const result = generator.generate(testData)

      expect(result.xml).toMatch(/<hrEntr>\d{2}:\d{2}<\/hrEntr>/)
      expect(result.xml).toMatch(/<hrSaida>\d{2}:\d{2}<\/hrSaida>/)
    })
  })

  describe('formatDateXML()', () => {
    it('deve formatar data no formato YYYY-MM-DD', () => {
      const result = generator.generate(testData)

      expect(result.xml).toMatch(/<dtNascto>\d{4}-\d{2}-\d{2}<\/dtNascto>/)
    })
  })

  describe('config options', () => {
    it('deve respeitar environment=1 (Produção)', () => {
      const prodGenerator = new AEJXMLGenerator({
        ...config,
        environment: '1',
      })

      const result = prodGenerator.generate(testData)

      expect(result.xml).toContain('<tpAmb>1</tpAmb>')
    })

    it('deve respeitar includeOvertimeDetails=false', () => {
      const noOvertimeGenerator = new AEJXMLGenerator({
        ...config,
        includeOvertimeDetails: false,
      })

      const result = noOvertimeGenerator.generate(testData)

      expect(result.xml).not.toContain('<infoHorContratual>')
    })

    it('deve respeitar includeMonetaryValues=false', () => {
      const noMoneyGenerator = new AEJXMLGenerator({
        ...config,
        includeMonetaryValues: false,
      })

      const result = noMoneyGenerator.generate(testData)

      // Deve incluir apenas salário base, não horas extras
      const rubricas = result.xml.match(/<codRubr>/g) || []
      expect(rubricas.length).toBe(1) // Apenas 1000 (salário)
    })
  })

  describe('edge cases', () => {
    it('deve lidar com funcionário sem salário', () => {
      const noSalaryData = {
        ...testData,
        employees: [{
          ...mockEmployee,
          salary: null,
        }],
      }

      const result = generator.generate(noSalaryData as AEJXMLData)

      expect(result.xml).toBeTruthy()
      expect(result.totalEmployees).toBe(1)
    })

    it('deve lidar com registros vazios', () => {
      const emptyData = {
        ...testData,
        dailyRecords: [],
      }

      const result = generator.generate(emptyData)

      expect(result.xml).toBeTruthy()
      expect(result.totalEmployees).toBe(1)
    })

    it('deve lidar com múltiplos funcionários', () => {
      const multipleData = {
        ...testData,
        employees: [
          mockEmployee,
          { ...mockEmployee, id: 'emp-456', name: 'Maria Santos', cpf: '987.654.321-00' },
        ],
      }

      const result = generator.generate(multipleData as AEJXMLData)

      expect(result.totalEmployees).toBe(2)
      expect(result.xml).toContain('João da Silva')
      expect(result.xml).toContain('Maria Santos')
    })
  })
})
