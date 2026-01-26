import { z } from "zod"
import { isValidCNPJ } from "@/lib/utils"

export const companySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpj: z.string().refine((val) => !val || isValidCNPJ(val), "CNPJ inválido").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  address: z.object({
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
})

export const companyUpdateSchema = companySchema.partial()

export type CompanyInput = z.infer<typeof companySchema>
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>
