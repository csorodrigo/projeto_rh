"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Download,
  Eye,
  TrendingUp,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Payslip {
  id: string;
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  benefits: number;
  status: "available" | "processing" | "paid";
  paidAt?: string;
  items: PayslipItem[];
}

interface PayslipItem {
  description: string;
  type: "earning" | "deduction" | "benefit";
  amount: number;
}

export default function MobilePayslipPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      const response = await fetch("/api/folha/payslips");
      if (response.ok) {
        const data = await response.json();
        setPayslips(data.payslips || []);
      }
    } catch (error) {
      console.error("Erro ao carregar holerites:", error);
    }
  };

  const handleDownload = async (payslipId: string) => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/folha/payslips/${payslipId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `holerite-${payslipId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Erro ao baixar holerite:", error);
      alert("Erro ao baixar holerite. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const latestPayslip = payslips[0];
  const averageSalary =
    payslips.length > 0
      ? payslips.reduce((sum, p) => sum + p.netSalary, 0) / payslips.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="container max-w-lg space-y-6 p-4">
        {/* Resumo Financeiro */}
        {latestPayslip && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Salário Líquido Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <div className="text-4xl font-bold">
                  {formatCurrency(latestPayslip.netSalary)}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bruto</p>
                  <p className="font-medium">
                    {formatCurrency(latestPayslip.grossSalary)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Descontos</p>
                  <p className="font-medium text-destructive">
                    -{formatCurrency(latestPayslip.deductions)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Benefícios</p>
                  <p className="font-medium text-green-500">
                    +{formatCurrency(latestPayslip.benefits)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    Média últimos meses:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(averageSalary)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Holerites */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Histórico de Holerites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payslips.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum holerite disponível
                </p>
              </div>
            ) : (
              payslips.map((payslip) => (
                <button
                  key={payslip.id}
                  onClick={() => setSelectedPayslip(payslip)}
                  className="w-full text-left"
                >
                  <PayslipCard payslip={payslip} />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Holerites disponíveis até o 5º dia útil de cada mês</p>
            <p>• Mantenha seus holerites salvos como comprovante</p>
            <p>• Dúvidas sobre valores? Entre em contato com o RH</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Detalhes do Holerite */}
      <Dialog
        open={!!selectedPayslip}
        onOpenChange={() => setSelectedPayslip(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {selectedPayslip && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Holerite - {getMonthLabel(selectedPayslip.month)}/
                  {selectedPayslip.year}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Resumo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      variant={
                        selectedPayslip.status === "paid"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {getStatusLabel(selectedPayslip.status)}
                    </Badge>
                  </div>

                  {selectedPayslip.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Data de Pagamento
                      </span>
                      <span className="font-medium">
                        {format(parseISO(selectedPayslip.paidAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Proventos */}
                <div>
                  <h3 className="mb-3 font-semibold">Proventos</h3>
                  <div className="space-y-2">
                    {selectedPayslip.items
                      .filter((item) => item.type === "earning")
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.description}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Descontos */}
                <div>
                  <h3 className="mb-3 font-semibold">Descontos</h3>
                  <div className="space-y-2">
                    {selectedPayslip.items
                      .filter((item) => item.type === "deduction")
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.description}
                          </span>
                          <span className="font-medium text-destructive">
                            -{formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Benefícios */}
                <div>
                  <h3 className="mb-3 font-semibold">Benefícios</h3>
                  <div className="space-y-2">
                    {selectedPayslip.items
                      .filter((item) => item.type === "benefit")
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.description}
                          </span>
                          <span className="font-medium text-green-500">
                            +{formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2 rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Salário Bruto</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedPayslip.grossSalary)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Descontos
                    </span>
                    <span className="text-destructive">
                      -{formatCurrency(selectedPayslip.deductions)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Benefícios
                    </span>
                    <span className="text-green-500">
                      +{formatCurrency(selectedPayslip.benefits)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      Salário Líquido
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedPayslip.netSalary)}
                    </span>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(selectedPayslip.id)}
                    disabled={isDownloading}
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? "Baixando..." : "Baixar PDF"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayslipCard({ payslip }: { payslip: Payslip }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">
            {getMonthLabel(payslip.month)} {payslip.year}
          </p>
          <p className="text-lg font-semibold">
            {formatCurrency(payslip.netSalary)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getStatusLabel(payslip.status)}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getMonthLabel(month: string): string {
  const months: Record<string, string> = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };
  return months[month] || month;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "Disponível",
    processing: "Processando",
    paid: "Pago",
  };
  return labels[status] || status;
}
