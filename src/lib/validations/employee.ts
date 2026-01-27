import { z } from "zod"
import { isValidCPF } from "@/lib/utils"

export const employeeSchema = z.object({
  // Dados pessoais
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().refine((val) => isValidCPF(val), "CPF inválido"),
  rg: z.string().optional(),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.enum(["male", "female", "other"]),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", "separated"]),
  nationality: z.string().optional().default("Brasileira"),

  // Dados de trabalho
  position: z.string().min(1, "Cargo é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  costCenter: z.string().optional(),
  hireDate: z.string().min(1, "Data de admissão é obrigatória"),
  contractType: z.enum(["clt", "pj", "intern", "temporary"]),

  // Documentos profissionais
  pis: z.string().optional(),
  ctps: z.string().optional(),
  ctpsSeries: z.string().optional(),
  professionalCategory: z.string().optional(),
  cbo: z.string().optional(),

  // Dados bancários
  bank: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
  accountType: z.enum(["checking", "savings"]).optional(),
  pixKey: z.string().optional(),

  // Endereço
  address: z.object({
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),

  // Contato
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),

  // Contato de emergência
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),

  // Salário
  baseSalary: z.number().min(0, "Salário não pode ser negativo").optional(),

  // Jornada
  workScheduleId: z.string().uuid().optional(),
})

export const employeeUpdateSchema = employeeSchema.partial()

export type EmployeeInput = z.infer<typeof employeeSchema>
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>
