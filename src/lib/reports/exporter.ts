import type { ReportResult, ReportFormat, ExportConfig } from '@/types/reports';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class ReportExporter {
  /**
   * Exporta relatório no formato especificado
   */
  async exportReport(
    result: ReportResult,
    format: ReportFormat,
    config: ExportConfig
  ): Promise<Buffer> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(result, config);
      case 'xlsx':
        return this.exportToExcel(result, config);
      case 'pdf':
        return this.exportToPDF(result, config);
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }
  }

  /**
   * Exporta para CSV
   */
  private exportToCSV(result: ReportResult, config: ExportConfig): Buffer {
    const headers = result.columns.map(col => col.label);
    const rows = result.data.map(row =>
      result.columns.map(col => this.formatValue(row[col.field], col.type))
    );

    let csv = '';

    // Headers
    if (config.includeHeaders !== false) {
      csv += headers.join(',') + '\n';
    }

    // Rows
    rows.forEach(row => {
      csv += row.map(cell => this.escapeCsvCell(cell)).join(',') + '\n';
    });

    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Exporta para Excel
   */
  private exportToExcel(result: ReportResult, config: ExportConfig): Buffer {
    const workbook = XLSX.utils.book_new();

    // Preparar dados
    const headers = result.columns.map(col => col.label);
    const rows = result.data.map(row =>
      result.columns.map(col => this.formatValue(row[col.field], col.type))
    );

    // Criar worksheet
    const worksheetData = config.includeHeaders !== false
      ? [headers, ...rows]
      : rows;

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajustar largura das colunas
    const colWidths = result.columns.map((col, index) => {
      const maxLength = Math.max(
        col.label.length,
        ...result.data.map(row => {
          const value = this.formatValue(row[col.field], col.type);
          return String(value).length;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

    // Gerar buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(excelBuffer);
  }

  /**
   * Exporta para PDF
   */
  private exportToPDF(result: ReportResult, config: ExportConfig): Buffer {
    const doc = new jsPDF({
      orientation: config.pageOrientation || 'landscape',
      unit: 'mm',
      format: config.pageSize || 'a4',
    });

    // Título
    if (config.title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(config.title, 14, 15);
    }

    // Subtítulo
    let yPos = config.title ? 22 : 15;
    if (config.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(config.subtitle, 14, yPos);
      yPos += 7;
    }

    // Informações do relatório
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const infoText = `Gerado em: ${format(result.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Total de registros: ${result.recordCount}`;
    doc.text(infoText, 14, yPos);
    yPos += 7;

    // Range de datas se disponível
    if (result.dateRange) {
      const dateRangeText = `Período: ${format(result.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(result.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`;
      doc.text(dateRangeText, 14, yPos);
      yPos += 5;
    }

    // Tabela
    const headers = result.columns.map(col => col.label);
    const rows = result.data.map(row =>
      result.columns.map(col => this.formatValue(row[col.field], col.type))
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPos,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // gray-50
      },
      margin: { top: 10, right: 14, bottom: 10, left: 14 },
    });

    // Rodapé com número de páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Converter para Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  }

  /**
   * Formata valor baseado no tipo
   */
  private formatValue(value: any, type: string): string {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        try {
          return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
          return String(value);
        }

      case 'number':
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value);

      case 'boolean':
        return value ? 'Sim' : 'Não';

      default:
        return String(value);
    }
  }

  /**
   * Escapa célula CSV
   */
  private escapeCsvCell(value: any): string {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Gera nome de arquivo baseado na configuração
   */
  static generateFilename(
    templateName: string,
    format: ReportFormat,
    timestamp: Date = new Date()
  ): string {
    const sanitizedName = templateName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const dateStr = format(timestamp, 'yyyyMMdd_HHmmss');
    return `${sanitizedName}_${dateStr}.${format}`;
  }
}
