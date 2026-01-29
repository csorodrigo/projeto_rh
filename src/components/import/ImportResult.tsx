'use client';

import { CheckCircle2, XCircle, Download, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ImportResult as ImportResultType } from '@/lib/import/types';
import { downloadErrorReport } from '@/lib/import/import-service';
import { formatCPF } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ImportResultProps {
  result: ImportResultType;
  onReset: () => void;
}

export function ImportResult({ result, onReset }: ImportResultProps) {
  const router = useRouter();

  const handleDownloadErrors = () => {
    downloadErrorReport(result);
  };

  const handleBackToList = () => {
    router.push('/funcionarios');
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado da Importação</CardTitle>
          <CardDescription>
            Resumo do processo de importação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{result.total}</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400">Importados</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {result.successCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-400">Falharam</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {result.failedCount}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {result.successCount > 0 && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {result.successCount} funcionários foram importados com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Failed Records */}
      {result.failedCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registros com Erro</CardTitle>
                <CardDescription>
                  {result.failedCount} registros não puderam ser importados
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadErrors}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Log de Erros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.failed.slice(0, 20).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.row || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.employee.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.employee.cpf ? formatCPF(item.employee.cpf) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-destructive">
                        {item.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {result.failed.length > 20 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Mostrando 20 de {result.failed.length} erros. Baixe o log completo acima.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Importar Novamente
        </Button>

        <Button
          type="button"
          onClick={handleBackToList}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Listagem
        </Button>
      </div>
    </div>
  );
}
