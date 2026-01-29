'use client';

/**
 * Modal de Conversão de Candidato para Funcionário
 * Wizard com 3 etapas para converter candidato aprovado em funcionário
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, AlertCircle, User, Briefcase, CheckSquare, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Candidate, Job } from '@/types/recruitment';
import type { EmployeeConversionData } from '@/types/recruitment';
import {
  formatCPF,
  formatPIS,
  formatCEP,
  formatPhone,
  isValidCPF,
  isValidPIS,
  isValidCEP
} from '@/lib/recruitment/employee-conversion';

// =====================================================
// TYPES
// =====================================================

interface ConvertToEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate;
  job: Job;
  applicationId: string;
  offerSalary?: number;
  onSuccess?: (employeeId: string) => void;
}

interface WizardStep {
  id: number;
  title: string;
  icon: React.ElementType;
  description: string;
}

// =====================================================
// WIZARD STEPS
// =====================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Confirmação',
    icon: User,
    description: 'Revisar dados do candidato'
  },
  {
    id: 2,
    title: 'Dados Adicionais',
    icon: Briefcase,
    description: 'Completar informações obrigatórias'
  },
  {
    id: 3,
    title: 'Revisão e Criação',
    icon: CheckSquare,
    description: 'Confirmar e criar funcionário'
  }
];

// =====================================================
// COMPONENT
// =====================================================

export function ConvertToEmployeeModal({
  open,
  onClose,
  candidate,
  job,
  applicationId,
  offerSalary,
  onSuccess
}: ConvertToEmployeeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<Partial<EmployeeConversionData>>({
    salary: offerSalary || ((job.salary_min || 0) + (job.salary_max || 0)) / 2,
    department: job.department || '',
    hire_date: new Date().toISOString().split('T')[0],
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: ''
    }
  });

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 2) {
      // Validar dados pessoais
      if (!formData.cpf) {
        newErrors.cpf = 'CPF é obrigatório';
      } else if (!isValidCPF(formData.cpf)) {
        newErrors.cpf = 'CPF inválido';
      }

      if (!formData.rg) {
        newErrors.rg = 'RG é obrigatório';
      }

      if (!formData.pis) {
        newErrors.pis = 'PIS/PASEP é obrigatório';
      } else if (!isValidPIS(formData.pis)) {
        newErrors.pis = 'PIS/PASEP inválido';
      }

      if (!formData.birth_date) {
        newErrors.birth_date = 'Data de nascimento é obrigatória';
      }

      // Validar endereço
      if (!formData.address?.street) {
        newErrors['address.street'] = 'Rua é obrigatória';
      }
      if (!formData.address?.number) {
        newErrors['address.number'] = 'Número é obrigatório';
      }
      if (!formData.address?.neighborhood) {
        newErrors['address.neighborhood'] = 'Bairro é obrigatório';
      }
      if (!formData.address?.city) {
        newErrors['address.city'] = 'Cidade é obrigatória';
      }
      if (!formData.address?.state) {
        newErrors['address.state'] = 'Estado é obrigatório';
      }
      if (!formData.address?.zip_code) {
        newErrors['address.zip_code'] = 'CEP é obrigatório';
      } else if (!isValidCEP(formData.address.zip_code)) {
        newErrors['address.zip_code'] = 'CEP inválido';
      }

      // Validar contato de emergência
      if (!formData.emergency_contact) {
        newErrors.emergency_contact = 'Contato de emergência é obrigatório';
      }
      if (!formData.emergency_phone) {
        newErrors.emergency_phone = 'Telefone de emergência é obrigatório';
      }

      // Validar dados trabalhistas
      if (!formData.hire_date) {
        newErrors.hire_date = 'Data de admissão é obrigatória';
      }
      if (!formData.salary || formData.salary <= 0) {
        newErrors.salary = 'Salário deve ser maior que zero';
      }
      if (!formData.work_schedule_id) {
        newErrors.work_schedule_id = 'Jornada de trabalho é obrigatória';
      }
      if (!formData.department) {
        newErrors.department = 'Departamento é obrigatório';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/recruitment/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          employee_data: formData,
          create_onboarding: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao converter candidato');
      }

      toast.success('Candidato convertido em funcionário com sucesso!');
      onSuccess?.(data.employee_id);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao converter candidato');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...(prev.address || {}),
          [addressField]: value
        } as any
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setErrors({});
    setFormData({
      salary: offerSalary || ((job.salary_min || 0) + (job.salary_max || 0)) / 2,
      department: job.department || '',
      hire_date: new Date().toISOString().split('T')[0],
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: ''
      }
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleReset();
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Converter Candidato em Funcionário</DialogTitle>
          <DialogDescription>
            Preencha os dados necessários para criar o registro de funcionário
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Steps */}
        <div className="flex items-center justify-between mb-6">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'bg-primary border-primary text-white'
                        : 'bg-background border-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <StepConfirmation
              candidate={candidate}
              job={job}
              offerSalary={offerSalary}
            />
          )}

          {currentStep === 2 && (
            <StepAdditionalData
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
            />
          )}

          {currentStep === 3 && (
            <StepReview
              candidate={candidate}
              job={job}
              formData={formData}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { handleReset(); onClose(); }} disabled={loading}>
              Cancelar
            </Button>

            {currentStep < WIZARD_STEPS.length ? (
              <Button onClick={handleNext} disabled={loading}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Funcionário'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// STEP COMPONENTS
// =====================================================

function StepConfirmation({
  candidate,
  job,
  offerSalary
}: {
  candidate: Candidate;
  job: Job;
  offerSalary?: number;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Revise os dados do candidato antes de prosseguir. Estas informações serão usadas como base para criar o registro de funcionário.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Dados do Candidato</h3>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Nome Completo</Label>
            <p className="font-medium">{candidate.full_name}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">E-mail</Label>
            <p className="font-medium">{candidate.email}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Telefone</Label>
            <p className="font-medium">{candidate.phone || 'Não informado'}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Localização</Label>
            <p className="font-medium">{candidate.location || 'Não informada'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Informações da Vaga</h3>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Cargo</Label>
            <p className="font-medium">{job.title}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Departamento</Label>
            <p className="font-medium">{job.department || 'Não especificado'}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Tipo de Contrato</Label>
            <Badge variant="secondary">{job.employment_type}</Badge>
          </div>

          {offerSalary && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Salário Acordado</Label>
              <p className="font-medium text-lg text-green-600">
                R$ {offerSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepAdditionalData({
  formData,
  errors,
  updateFormData
}: {
  formData: Partial<EmployeeConversionData>;
  errors: Record<string, string>;
  updateFormData: (field: string, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Preencha todos os campos obrigatórios. Estes dados são necessários para o cadastro legal do funcionário.
        </AlertDescription>
      </Alert>

      {/* Dados Pessoais */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Dados Pessoais</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf || ''}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                updateFormData('cpf', formatted);
              }}
              placeholder="000.000.000-00"
              maxLength={14}
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rg">RG *</Label>
            <Input
              id="rg"
              value={formData.rg || ''}
              onChange={(e) => updateFormData('rg', e.target.value)}
              placeholder="00.000.000-0"
              className={errors.rg ? 'border-red-500' : ''}
            />
            {errors.rg && <p className="text-sm text-red-500">{errors.rg}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pis">PIS/PASEP *</Label>
            <Input
              id="pis"
              value={formData.pis || ''}
              onChange={(e) => {
                const formatted = formatPIS(e.target.value);
                updateFormData('pis', formatted);
              }}
              placeholder="000.00000.00-0"
              maxLength={14}
              className={errors.pis ? 'border-red-500' : ''}
            />
            {errors.pis && <p className="text-sm text-red-500">{errors.pis}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date || ''}
              onChange={(e) => updateFormData('birth_date', e.target.value)}
              className={errors.birth_date ? 'border-red-500' : ''}
            />
            {errors.birth_date && <p className="text-sm text-red-500">{errors.birth_date}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Endereço</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="zip_code">CEP *</Label>
            <Input
              id="zip_code"
              value={formData.address?.zip_code || ''}
              onChange={(e) => {
                const formatted = formatCEP(e.target.value);
                updateFormData('address.zip_code', formatted);
              }}
              placeholder="00000-000"
              maxLength={9}
              className={errors['address.zip_code'] ? 'border-red-500' : ''}
            />
            {errors['address.zip_code'] && <p className="text-sm text-red-500">{errors['address.zip_code']}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={formData.address?.street || ''}
              onChange={(e) => updateFormData('address.street', e.target.value)}
              placeholder="Nome da rua"
              className={errors['address.street'] ? 'border-red-500' : ''}
            />
            {errors['address.street'] && <p className="text-sm text-red-500">{errors['address.street']}</p>}
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              value={formData.address?.number || ''}
              onChange={(e) => updateFormData('address.number', e.target.value)}
              placeholder="123"
              className={errors['address.number'] ? 'border-red-500' : ''}
            />
            {errors['address.number'] && <p className="text-sm text-red-500">{errors['address.number']}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={formData.address?.complement || ''}
              onChange={(e) => updateFormData('address.complement', e.target.value)}
              placeholder="Apto, Bloco, etc"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={formData.address?.neighborhood || ''}
              onChange={(e) => updateFormData('address.neighborhood', e.target.value)}
              placeholder="Nome do bairro"
              className={errors['address.neighborhood'] ? 'border-red-500' : ''}
            />
            {errors['address.neighborhood'] && <p className="text-sm text-red-500">{errors['address.neighborhood']}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={formData.address?.city || ''}
              onChange={(e) => updateFormData('address.city', e.target.value)}
              placeholder="Nome da cidade"
              className={errors['address.city'] ? 'border-red-500' : ''}
            />
            {errors['address.city'] && <p className="text-sm text-red-500">{errors['address.city']}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Select
              value={formData.address?.state || ''}
              onValueChange={(value) => updateFormData('address.state', value)}
            >
              <SelectTrigger className={errors['address.state'] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Acre</SelectItem>
                <SelectItem value="AL">Alagoas</SelectItem>
                <SelectItem value="AP">Amapá</SelectItem>
                <SelectItem value="AM">Amazonas</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
                <SelectItem value="CE">Ceará</SelectItem>
                <SelectItem value="DF">Distrito Federal</SelectItem>
                <SelectItem value="ES">Espírito Santo</SelectItem>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="MA">Maranhão</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="PA">Pará</SelectItem>
                <SelectItem value="PB">Paraíba</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="PE">Pernambuco</SelectItem>
                <SelectItem value="PI">Piauí</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="RO">Rondônia</SelectItem>
                <SelectItem value="RR">Roraima</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="SE">Sergipe</SelectItem>
                <SelectItem value="TO">Tocantins</SelectItem>
              </SelectContent>
            </Select>
            {errors['address.state'] && <p className="text-sm text-red-500">{errors['address.state']}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contato de Emergência */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Contato de Emergência</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Nome do Contato *</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact || ''}
              onChange={(e) => updateFormData('emergency_contact', e.target.value)}
              placeholder="Nome completo"
              className={errors.emergency_contact ? 'border-red-500' : ''}
            />
            {errors.emergency_contact && <p className="text-sm text-red-500">{errors.emergency_contact}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_phone">Telefone *</Label>
            <Input
              id="emergency_phone"
              value={formData.emergency_phone || ''}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                updateFormData('emergency_phone', formatted);
              }}
              placeholder="(00) 00000-0000"
              className={errors.emergency_phone ? 'border-red-500' : ''}
            />
            {errors.emergency_phone && <p className="text-sm text-red-500">{errors.emergency_phone}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Dados Trabalhistas */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Dados Trabalhistas</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hire_date">Data de Admissão *</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) => updateFormData('hire_date', e.target.value)}
              className={errors.hire_date ? 'border-red-500' : ''}
            />
            {errors.hire_date && <p className="text-sm text-red-500">{errors.hire_date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salário (R$) *</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              value={formData.salary || ''}
              onChange={(e) => updateFormData('salary', parseFloat(e.target.value))}
              placeholder="0.00"
              className={errors.salary ? 'border-red-500' : ''}
            />
            {errors.salary && <p className="text-sm text-red-500">{errors.salary}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_schedule_id">Jornada de Trabalho *</Label>
            <Select
              value={formData.work_schedule_id || ''}
              onValueChange={(value) => updateFormData('work_schedule_id', value)}
            >
              <SelectTrigger className={errors.work_schedule_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">44h Semanais</SelectItem>
                <SelectItem value="30h">30h Semanais</SelectItem>
                <SelectItem value="40h">40h Semanais</SelectItem>
              </SelectContent>
            </Select>
            {errors.work_schedule_id && <p className="text-sm text-red-500">{errors.work_schedule_id}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Departamento *</Label>
            <Input
              id="department"
              value={formData.department || ''}
              onChange={(e) => updateFormData('department', e.target.value)}
              placeholder="Nome do departamento"
              className={errors.department ? 'border-red-500' : ''}
            />
            {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_center">Centro de Custo</Label>
            <Input
              id="cost_center"
              value={formData.cost_center || ''}
              onChange={(e) => updateFormData('cost_center', e.target.value)}
              placeholder="Código do centro de custo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepReview({
  candidate,
  job,
  formData
}: {
  candidate: Candidate;
  job: Job;
  formData: Partial<EmployeeConversionData>;
}) {
  return (
    <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Revise todos os dados antes de criar o funcionário. Após a criação, o candidato será marcado como contratado e um processo de onboarding será iniciado.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Informações Básicas</h3>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Nome</Label>
            <p className="font-medium">{candidate.full_name}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">E-mail</Label>
            <p className="font-medium">{candidate.email}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">CPF</Label>
            <p className="font-medium">{formData.cpf}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Data de Nascimento</Label>
            <p className="font-medium">
              {formData.birth_date ? new Date(formData.birth_date).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Dados Trabalhistas</h3>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Cargo</Label>
            <p className="font-medium">{job.title}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Departamento</Label>
            <p className="font-medium">{formData.department}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Data de Admissão</Label>
            <p className="font-medium">
              {formData.hire_date ? new Date(formData.hire_date).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Salário</Label>
            <p className="font-medium text-lg text-green-600">
              R$ {formData.salary?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Endereço</h3>
        <p className="text-sm">
          {formData.address?.street}, {formData.address?.number}
          {formData.address?.complement && ` - ${formData.address.complement}`}
          <br />
          {formData.address?.neighborhood} - {formData.address?.city}/{formData.address?.state}
          <br />
          CEP: {formData.address?.zip_code}
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Próximos Passos</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Funcionário será criado no sistema</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Candidatura será marcada como "Contratado"</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Outras candidaturas ativas serão rejeitadas</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Processo de onboarding será iniciado automaticamente</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>E-mail de boas-vindas será enviado</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
