'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { ValidatedEmployee } from '@/lib/import/types';
import { formatCPF } from '@/lib/utils';

interface PreviewTableProps {
  employees: ValidatedEmployee[];
  onSelectionChange: (selected: ValidatedEmployee[]) => void;
}

const ROWS_PER_PAGE = 10;

export function PreviewTable({ employees, onSelectionChange }: PreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    new Set(
      employees
        .map((emp, idx) => ({ emp, idx }))
        .filter(({ emp }) => emp.validation.valid)
        .map(({ idx }) => idx)
    )
  );

  const totalPages = Math.ceil(employees.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentEmployees = employees.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    const validIndices = employees
      .map((emp, idx) => ({ emp, idx }))
      .filter(({ emp }) => emp.validation.valid)
      .map(({ idx }) => idx);

    if (selectedRows.size === validIndices.length) {
      setSelectedRows(new Set());
      onSelectionChange([]);
    } else {
      setSelectedRows(new Set(validIndices));
      onSelectionChange(
        employees.filter((_, idx) => validIndices.includes(idx))
      );
    }
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);

    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }

    setSelectedRows(newSelected);
    onSelectionChange(
      employees.filter((_, idx) => newSelected.has(idx))
    );
  };

  const getStatusIcon = (employee: ValidatedEmployee) => {
    if (!employee.validation.valid) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (employee.validation.warnings.length > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (employee: ValidatedEmployee) => {
    if (!employee.validation.valid) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (employee.validation.warnings.length > 0) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Aviso</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-700">Válido</Badge>;
  };

  const getTooltipContent = (employee: ValidatedEmployee) => {
    const { errors, warnings } = employee.validation;

    return (
      <div className="space-y-2 max-w-xs">
        {errors.length > 0 && (
          <div>
            <p className="font-semibold text-destructive">Erros:</p>
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-xs">
                  {error.field}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            <p className="font-semibold text-yellow-600">Avisos:</p>
            <ul className="list-disc pl-4 space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx} className="text-xs">
                  {warning.field}: {warning.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const validCount = employees.filter(emp => emp.validation.valid && emp.validation.warnings.length === 0).length;
  const warningCount = employees.filter(emp => emp.validation.valid && emp.validation.warnings.length > 0).length;
  const errorCount = employees.filter(emp => !emp.validation.valid).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              <strong>{validCount}</strong> válidos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">
              <strong>{warningCount}</strong> com avisos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm">
              <strong>{errorCount}</strong> com erros
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedRows.size === employees.filter(e => e.validation.valid).length
            ? 'Desmarcar Todas'
            : 'Selecionar Válidas'}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-12">Status</TableHead>
              <TableHead className="w-16">Linha</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentEmployees.map((employee, idx) => {
              const globalIndex = startIndex + idx;
              const isSelected = selectedRows.has(globalIndex);
              const isDisabled = !employee.validation.valid;

              return (
                <TableRow
                  key={globalIndex}
                  className={isSelected ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => handleSelectRow(globalIndex)}
                    />
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {getStatusIcon(employee)}
                        </TooltipTrigger>
                        <TooltipContent>
                          {getTooltipContent(employee)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {employee.row}
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell className="text-sm">
                    {employee.cpf ? formatCPF(employee.cpf) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{employee.position}</TableCell>
                  <TableCell className="text-sm">
                    {employee.department || '-'}
                  </TableCell>
                  <TableCell className="text-sm">{employee.hire_date}</TableCell>
                  <TableCell>{getStatusBadge(employee)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} - {Math.min(endIndex, employees.length)} de{' '}
            {employees.length} registros
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection Info */}
      {selectedRows.size > 0 && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm">
            <strong>{selectedRows.size}</strong> funcionários selecionados para importação
          </p>
        </div>
      )}
    </div>
  );
}
