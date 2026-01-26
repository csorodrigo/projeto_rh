"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Briefcase,
  FileText,
  Building2,
  Phone,
  MapPin,
  CheckCircle2
} from "lucide-react"
import type { EmployeeInput } from "@/lib/validations/employee"

interface ReviewStepProps {
  form: UseFormReturn<EmployeeInput>
}

function ReviewSection({
  icon: Icon,
  title,
  children
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="grid gap-2 pl-6 text-sm">
        {children}
      </div>
    </div>
  )
}

function ReviewItem({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

const GENDER_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  single: "Solteiro(a)",
  married: "Casado(a)",
  divorced: "Divorciado(a)",
  widowed: "Viuvo(a)",
  separated: "Separado(a)",
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  intern: "Estagiario",
  temporary: "Temporario",
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Corrente",
  savings: "Poupanca",
}

export function ReviewStep({ form }: ReviewStepProps) {
  const values = form.getValues()

  const formatDate = (date: string) => {
    if (!date) return null
    const [year, month, day] = date.split("-")
    return `${day}/${month}/${year}`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-green-500" />
          <CardTitle>Revisao dos Dados</CardTitle>
        </div>
        <CardDescription>
          Verifique os dados antes de confirmar o cadastro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReviewSection icon={User} title="Dados Pessoais">
          <ReviewItem label="Nome Completo" value={values.name} />
          <ReviewItem label="CPF" value={values.cpf} />
          <ReviewItem label="RG" value={values.rg} />
          <ReviewItem label="Data de Nascimento" value={formatDate(values.birthDate)} />
          <ReviewItem label="Genero" value={GENDER_LABELS[values.gender]} />
          <ReviewItem label="Estado Civil" value={MARITAL_STATUS_LABELS[values.maritalStatus]} />
          <ReviewItem label="Nacionalidade" value={values.nationality} />
        </ReviewSection>

        <Separator />

        <ReviewSection icon={Briefcase} title="Dados Profissionais">
          <ReviewItem label="Cargo" value={values.position} />
          <ReviewItem label="Departamento" value={values.department} />
          <ReviewItem label="Data de Admissao" value={formatDate(values.hireDate)} />
          <ReviewItem
            label="Tipo de Contrato"
            value={CONTRACT_TYPE_LABELS[values.contractType]}
          />
          <ReviewItem label="Centro de Custo" value={values.costCenter} />
          <ReviewItem
            label="Salario Base"
            value={values.baseSalary ? formatCurrency(values.baseSalary) : null}
          />
        </ReviewSection>

        <Separator />

        <ReviewSection icon={FileText} title="Documentos Trabalhistas">
          <ReviewItem label="PIS/PASEP" value={values.pis} />
          <ReviewItem label="CBO" value={values.cbo} />
          <ReviewItem label="CTPS" value={values.ctps} />
          <ReviewItem label="CTPS Serie" value={values.ctpsSeries} />
          <ReviewItem label="Categoria" value={values.professionalCategory} />
        </ReviewSection>

        <Separator />

        <ReviewSection icon={Building2} title="Dados Bancarios">
          <ReviewItem label="Banco" value={values.bank} />
          <ReviewItem
            label="Tipo de Conta"
            value={values.accountType ? ACCOUNT_TYPE_LABELS[values.accountType] : null}
          />
          <ReviewItem label="Agencia" value={values.agency} />
          <ReviewItem label="Conta" value={values.account} />
          <ReviewItem label="Chave PIX" value={values.pixKey} />
        </ReviewSection>

        <Separator />

        <ReviewSection icon={Phone} title="Contato">
          <ReviewItem label="Email" value={values.email} />
          <ReviewItem label="Telefone" value={values.phone} />
          {values.emergencyContact?.name && (
            <>
              <div className="mt-2 mb-1">
                <Badge variant="outline">Contato de Emergencia</Badge>
              </div>
              <ReviewItem label="Nome" value={values.emergencyContact.name} />
              <ReviewItem label="Telefone" value={values.emergencyContact.phone} />
              <ReviewItem label="Parentesco" value={values.emergencyContact.relationship} />
            </>
          )}
        </ReviewSection>

        <Separator />

        <ReviewSection icon={MapPin} title="Endereco">
          <ReviewItem label="CEP" value={values.address?.zipCode} />
          <ReviewItem label="Logradouro" value={values.address?.street} />
          <ReviewItem label="Numero" value={values.address?.number} />
          <ReviewItem label="Complemento" value={values.address?.complement} />
          <ReviewItem label="Bairro" value={values.address?.neighborhood} />
          <ReviewItem label="Cidade" value={values.address?.city} />
          <ReviewItem label="Estado" value={values.address?.state} />
        </ReviewSection>
      </CardContent>
    </Card>
  )
}
