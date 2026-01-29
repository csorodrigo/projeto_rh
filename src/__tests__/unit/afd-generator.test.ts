/**
 * Testes unitários para gerador de AFD
 * Valida conformidade com Portaria 671/2021 do MTE
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AFDGenerator, validatePIS, formatPIS } from '@/lib/compliance/afd-generator'
import type { AFDData, AFDConfig } from '@/lib/compliance/afd-generator'
import type { Company, Employee, TimeRecord } from '@/types/database'

describe('AFDGenerator', () => {
  let mockCompany: Company
  let mockEmployees: Employee[]
  let mockTimeRecords: TimeRecord[]
  let afdData: AFDData

  beforeEach(() => {
    // Mock company
    mockCompany = {
      id: 'company-123',
      name: 'EMPRESA TESTE LTDA',
      cnpj: '12.345.678/0001-90',
      email: 'contato@empresa.com',
      phone: '11999999999',
      address: {
        street: 'Rua Teste',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01000-000',
      },
      logo_url: null,
      settings: {},
      owner_id: 'owner-123',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    } as Company

    // Mock employees
    mockEmployees = [
      {
        id: 'emp-1',
        company_id: 'company-123',
        name: 'João da Silva',
        full_name: 'João da Silva',
        cpf: '123.456.789-00',
        pis: '170.78136.39-7',
        birth_date: '1990-01-01',
        email: 'joao@empresa.com',
        hire_date: '2024-01-01',
        position: 'Desenvolvedor',
        department: 'TI',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Employee,
      {
        id: 'emp-2',
        company_id: 'company-123',
        name: 'Maria Santos',
        full_name: 'Maria Santos',
        cpf: '987.654.321-00',
        pis: '123.45678.90-1',
        birth_date: '1985-05-15',
        email: 'maria@empresa.com',
        hire_date: '2024-01-01',
        position: 'Designer',
        department: 'Design',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Employee,
    ]

    // Mock time records
    mockTimeRecords = [
      {
        id: 'rec-1',
        employee_id: 'emp-1',
        company_id: 'company-123',
        record_type: 'clock_in',
        recorded_at: '2024-01-15T08:00:00Z',
        location_address: null,
        source: 'web',
        notes: null,
        created_at: '2024-01-15T08:00:00Z',
      } as TimeRecord,
      {
        id: 'rec-2',
        employee_id: 'emp-1',
        company_id: 'company-123',
        record_type: 'clock_out',
        recorded_at: '2024-01-15T17:00:00Z',
        location_address: null,
        source: 'web',
        notes: null,
        created_at: '2024-01-15T17:00:00Z',
      } as TimeRecord,
      {
        id: 'rec-3',
        employee_id: 'emp-2',
        company_id: 'company-123',
        record_type: 'clock_in',
        recorded_at: '2024-01-15T09:00:00Z',
        location_address: null,
        source: 'mobile_app',
        notes: null,
        created_at: '2024-01-15T09:00:00Z',
      } as TimeRecord,
    ]

    afdData = {
      company: mockCompany,
      employees: mockEmployees,
      timeRecords: mockTimeRecords,
      dailyRecords: [],
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    }
  })

  describe('Geração de AFD', () => {
    it('deve gerar arquivo AFD com estrutura correta', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)

      expect(result).toBeDefined()
      expect(result.content).toBeDefined()
      expect(result.filename).toBeDefined()
      expect(result.totalRecords).toBeGreaterThan(0)
    })

    it('deve ter linhas com 99 caracteres', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      lines.forEach((line, index) => {
        // Última linha pode estar vazia
        if (line.length > 0) {
          expect(line.length).toBe(99)
        }
      })
    })

    it('deve começar com registro tipo 1 (header)', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      expect(lines[0].charAt(0)).toBe('1')
    })

    it('deve ter registro tipo 2 (REP) após header', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      expect(lines[1].charAt(0)).toBe('2')
    })

    it('deve ter registros tipo 3 (marcações) no meio', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      // Deve ter pelo menos 1 registro tipo 3
      const type3Records = lines.filter(line => line.charAt(0) === '3')
      expect(type3Records.length).toBeGreaterThan(0)
    })

    it('deve terminar com registro tipo 9 (trailer)', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n').filter(l => l.length > 0)

      const lastLine = lines[lines.length - 1]
      expect(lastLine.charAt(0)).toBe('9')
    })

    it('deve ter NSR sequencial', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n').filter(l => l.length > 0)

      let expectedNsr = 1
      lines.forEach((line) => {
        // Ignora trailer que tem formato diferente
        if (line.charAt(0) !== '9') {
          const nsr = parseInt(line.substring(1, 10), 10)
          expect(nsr).toBe(expectedNsr)
          expectedNsr++
        }
      })
    })

    it('deve ordenar marcações cronologicamente', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const type3Lines = lines.filter(line => line.charAt(0) === '3')

      let previousDateTime = 0
      type3Lines.forEach((line) => {
        // Extrai data e hora
        const dateStr = line.substring(22, 30) // DDMMAAAA
        const timeStr = line.substring(30, 34) // HHMM

        const day = parseInt(dateStr.substring(0, 2), 10)
        const month = parseInt(dateStr.substring(2, 4), 10)
        const year = parseInt(dateStr.substring(4, 8), 10)
        const hour = parseInt(timeStr.substring(0, 2), 10)
        const minute = parseInt(timeStr.substring(2, 4), 10)

        const dateTime = new Date(year, month - 1, day, hour, minute).getTime()

        expect(dateTime).toBeGreaterThanOrEqual(previousDateTime)
        previousDateTime = dateTime
      })
    })

    it('deve incluir CNPJ da empresa no header', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const headerLine = lines[0]
      const cnpj = headerLine.substring(11, 25) // Posições 12-25

      expect(cnpj).toBe('12345678000190')
    })

    it('deve incluir razão social no header', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const headerLine = lines[0]
      const razaoSocial = headerLine.substring(37, 187).trim() // Posições 38-187

      expect(razaoSocial).toContain('EMPRESA TESTE LTDA')
    })

    it('deve incluir período correto no header', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const headerLine = lines[0]
      const dataInicio = headerLine.substring(204, 212) // DDMMAAAA
      const dataFim = headerLine.substring(212, 220) // DDMMAAAA

      expect(dataInicio).toBe('01012024')
      expect(dataFim).toBe('31012024')
    })

    it('deve ter total correto de registros no trailer', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n').filter(l => l.length > 0)

      const trailerLine = lines[lines.length - 1]
      const totalRegistros = parseInt(trailerLine.substring(1, 10), 10)

      expect(totalRegistros).toBe(lines.length)
    })

    it('deve gerar nome de arquivo correto', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)

      expect(result.filename).toContain('AFD')
      expect(result.filename).toContain('12345678000190')
      expect(result.filename).toContain('01012024')
      expect(result.filename).toContain('31012024')
      expect(result.filename).toEndWith('.txt')
    })
  })

  describe('Encoding', () => {
    it('deve usar UTF-8 por padrão', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)

      expect(result.encoding).toBe('UTF-8')
    })

    it('deve aceitar ISO-8859-1 como encoding', () => {
      const config: AFDConfig = { encoding: 'ISO-8859-1' }
      const generator = new AFDGenerator(config)
      const result = generator.generate(afdData)

      expect(result.encoding).toBe('ISO-8859-1')
    })

    it('deve converter para buffer corretamente', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const buffer = generator.encodeContent(result.content)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('Normalização de caracteres', () => {
    it('deve remover acentos', () => {
      const companyWithAccents = {
        ...mockCompany,
        name: 'EMPRESA AÇÚCAR CAFÉ LTDA',
      }

      const generator = new AFDGenerator()
      const result = generator.generate({
        ...afdData,
        company: companyWithAccents,
      })

      const lines = result.content.split('\r\n')
      const headerLine = lines[0]

      // Não deve conter acentos
      expect(headerLine).not.toContain('Ú')
      expect(headerLine).not.toContain('Ç')
      expect(headerLine).not.toContain('É')
    })
  })

  describe('REP (Registrador Eletrônico de Ponto)', () => {
    it('deve incluir tipo REP-P (programa) por padrão', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const repLine = lines[1]
      const tipoREP = repLine.charAt(27) // Posição 28

      expect(tipoREP).toBe('3') // REP-P
    })

    it('deve aceitar tipos de REP customizados', () => {
      const config: AFDConfig = { repType: 1 } // REP-C
      const generator = new AFDGenerator(config)
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const repLine = lines[1]
      const tipoREP = repLine.charAt(27)

      expect(tipoREP).toBe('1')
    })

    it('deve incluir marca/modelo RH-RICKGAY', () => {
      const generator = new AFDGenerator()
      const result = generator.generate(afdData)
      const lines = result.content.split('\r\n')

      const repLine = lines[1]
      const marcaModelo = repLine.substring(28, 178).trim()

      expect(marcaModelo).toContain('RH-RICKGAY')
    })
  })

  describe('Ajustes e Inclusões', () => {
    it('deve gerar registros tipo 4 para ajustes', () => {
      const dataWithAdjustments: AFDData = {
        ...afdData,
        adjustments: [
          {
            nsr: 1,
            originalDateTime: new Date('2024-01-15T08:30:00'),
            adjustedDateTime: new Date('2024-01-15T08:00:00'),
            employeePis: '17078136397',
            reason: 'Erro de digitação',
            adjustedBy: 'Admin',
            adjustedAt: new Date('2024-01-16T10:00:00'),
          },
        ],
      }

      const generator = new AFDGenerator()
      const result = generator.generate(dataWithAdjustments)
      const lines = result.content.split('\r\n')

      const type4Records = lines.filter(line => line.charAt(0) === '4')
      expect(type4Records.length).toBeGreaterThan(0)
    })

    it('deve gerar registros tipo 5 para inclusões', () => {
      const dataWithInclusions: AFDData = {
        ...afdData,
        inclusions: [
          {
            nsr: 1,
            dateTime: new Date('2024-01-15T09:00:00'),
            employeePis: '17078136397',
            reason: 'Esqueceu de bater ponto',
            includedBy: 'Admin',
            includedAt: new Date('2024-01-16T10:00:00'),
          },
        ],
      }

      const generator = new AFDGenerator()
      const result = generator.generate(dataWithInclusions)
      const lines = result.content.split('\r\n')

      const type5Records = lines.filter(line => line.charAt(0) === '5')
      expect(type5Records.length).toBeGreaterThan(0)
    })
  })
})

describe('Validação de PIS', () => {
  it('deve validar PIS correto', () => {
    expect(validatePIS('170.78136.39-7')).toBe(true)
    expect(validatePIS('17078136397')).toBe(true)
  })

  it('deve rejeitar PIS inválido', () => {
    expect(validatePIS('123.45678.90-1')).toBe(false)
    expect(validatePIS('00000000000')).toBe(false)
  })

  it('deve rejeitar PIS com tamanho incorreto', () => {
    expect(validatePIS('123456789')).toBe(false)
    expect(validatePIS('12345678901234')).toBe(false)
  })

  it('deve aceitar PIS com ou sem formatação', () => {
    expect(validatePIS('170.78136.39-7')).toBe(true)
    expect(validatePIS('17078136397')).toBe(true)
  })
})

describe('Formatação de PIS', () => {
  it('deve formatar PIS corretamente', () => {
    expect(formatPIS('17078136397')).toBe('170.78136.39-7')
  })

  it('deve aceitar PIS já formatado', () => {
    expect(formatPIS('170.78136.39-7')).toBe('170.78136.39-7')
  })

  it('deve preencher com zeros à esquerda', () => {
    expect(formatPIS('123456789')).toBe('001.23456.78-9')
  })
})
