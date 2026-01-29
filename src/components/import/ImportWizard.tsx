'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './FileUploader';
import { PreviewTable } from './PreviewTable';
import { ImportProgress } from './ImportProgress';
import { ImportResult as ImportResultComponent } from './ImportResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { parseCSV } from '@/lib/import/csv-parser';
import { parseExcel } from '@/lib/import/excel-parser';
import { validateEmployee, detectDuplicates, detectExistingDuplicates } from '@/lib/import/validators';
import { importEmployees } from '@/lib/import/import-service';
import { listEmployees } from '@/lib/supabase/queries/employees';
import type { ValidatedEmployee, ImportResult, ImportProgress as ImportProgressType } from '@/lib/import/types';
import { toast } from 'sonner';
import { Download, ArrowLeft, ArrowRight } from 'lucide-react';

type Step = 'upload' | 'preview' | 'importing' | 'result';

export function ImportWizard() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<ValidatedEmployee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<ValidatedEmployee[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgressType>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
  });

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setProgress({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'parsing',
      message: 'Lendo arquivo...',
    });

    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      let parseResult;

      if (fileExtension === 'csv') {
        parseResult = await parseCSV(selectedFile);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parseResult = await parseExcel(selectedFile);
      } else {
        toast.error('Formato de arquivo não suportado');
        setProgress({ current: 0, total: 0, percentage: 0, status: 'error' });
        return;
      }

      if (parseResult.errors.length > 0) {
        toast.warning(`${parseResult.errors.length} erros ao processar o arquivo`);
      }

      // Validate employees
      setProgress({
        current: 0,
        total: parseResult.data.length,
        percentage: 0,
        status: 'validating',
        message: 'Validando dados...',
      });

      // Get existing employees to check for duplicates
      const existingResult = await listEmployees({ pageSize: 10000 });

      // Detect duplicates within file
      const fileDuplicates = detectDuplicates(parseResult.data);
      if (fileDuplicates.length > 0) {
        toast.warning(
          `${fileDuplicates.length} CPFs duplicados encontrados no arquivo`,
          {
            description: 'Verifique os registros marcados na tabela',
          }
        );
      }

      // Detect duplicates against database
      const dbDuplicates = detectExistingDuplicates(
        parseResult.data,
        existingResult.employees
      );
      if (dbDuplicates.length > 0) {
        toast.warning(
          `${dbDuplicates.length} funcionários já cadastrados`,
          {
            description: 'Estes registros não serão importados',
          }
        );
      }

      const validated: ValidatedEmployee[] = parseResult.data.map(emp => {
        const validation = validateEmployee(emp);

        // Check if CPF already exists in database
        const isDuplicate = dbDuplicates.some(d => d.employee.cpf === emp.cpf);
        if (isDuplicate) {
          validation.valid = false;
          validation.errors.push({
            field: 'cpf',
            message: 'CPF já cadastrado no sistema',
          });
        }

        // Check if CPF is duplicate within file
        const isFileDuplicate = fileDuplicates.some(d => d.cpf === emp.cpf);
        if (isFileDuplicate) {
          validation.warnings.push({
            field: 'cpf',
            message: 'CPF duplicado no arquivo',
          });
        }

        return {
          ...emp,
          validation,
          isSelected: validation.valid,
        };
      });

      setEmployees(validated);
      setSelectedEmployees(validated.filter(e => e.validation.valid));
      setProgress({
        current: validated.length,
        total: validated.length,
        percentage: 100,
        status: 'completed',
        message: 'Validação concluída',
      });

      // Move to preview step
      setStep('preview');

      const validCount = validated.filter(e => e.validation.valid).length;
      toast.success(
        `${validCount} de ${validated.length} registros válidos`,
        {
          description: 'Revise os dados antes de importar',
        }
      );
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Erro ao processar arquivo');
      setProgress({
        current: 0,
        total: 0,
        percentage: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Nenhum funcionário selecionado');
      return;
    }

    setStep('importing');
    setProgress({
      current: 0,
      total: selectedEmployees.length,
      percentage: 0,
      status: 'importing',
      message: 'Importando funcionários...',
    });

    try {
      const result = await importEmployees(selectedEmployees, (current, total) => {
        setProgress({
          current,
          total,
          percentage: Math.round((current / total) * 100),
          status: 'importing',
          message: `Importando ${current} de ${total}...`,
        });
      });

      setImportResult(result);
      setProgress({
        current: result.total,
        total: result.total,
        percentage: 100,
        status: 'completed',
        message: 'Importação concluída',
      });

      setStep('result');

      if (result.successCount > 0) {
        toast.success(
          `${result.successCount} funcionários importados com sucesso`,
          {
            description:
              result.failedCount > 0
                ? `${result.failedCount} falharam`
                : undefined,
          }
        );
      } else {
        toast.error('Nenhum funcionário foi importado');
      }
    } catch (error) {
      console.error('Error importing employees:', error);
      toast.error('Erro ao importar funcionários');
      setProgress({
        current: 0,
        total: selectedEmployees.length,
        percentage: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [selectedEmployees]);

  const handleDownloadTemplate = () => {
    const template = `name,cpf,personal_email,birth_date,hire_date,position,department,base_salary,status,personal_phone
João Silva,12345678901,joao@email.com,1990-01-15,2024-01-01,Desenvolvedor,TI,5000.00,active,11999999999
Maria Santos,98765432100,maria@email.com,1985-05-20,2024-02-01,Analista RH,RH,4500.00,active,11988888888`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'template-funcionarios.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template baixado com sucesso');
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setEmployees([]);
    setSelectedEmployees([]);
    setImportResult(null);
    setProgress({ current: 0, total: 0, percentage: 0, status: 'idle' });
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span>Upload</span>
          </div>

          <div className="h-px w-12 bg-border" />

          <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span>Validação</span>
          </div>

          <div className="h-px w-12 bg-border" />

          <div className={`flex items-center gap-2 ${step === 'importing' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'importing' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span>Importação</span>
          </div>

          <div className="h-px w-12 bg-border" />

          <div className={`flex items-center gap-2 ${step === 'result' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'result' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              4
            </div>
            <span>Resultado</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Faça o upload de um arquivo CSV ou Excel com os dados dos funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploader onFileSelect={handleFileSelect} />

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Validação dos Dados</CardTitle>
            <CardDescription>
              Revise os dados importados e selecione quais funcionários deseja importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PreviewTable
              employees={employees}
              onSelectionChange={setSelectedEmployees}
            />

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              <Button
                type="button"
                onClick={handleImport}
                disabled={selectedEmployees.length === 0}
              >
                Importar {selectedEmployees.length} Funcionários
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importando Funcionários</CardTitle>
            <CardDescription>
              Aguarde enquanto os dados são importados...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportProgress progress={progress} />
          </CardContent>
        </Card>
      )}

      {step === 'result' && importResult && (
        <ImportResultComponent
          result={importResult}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
