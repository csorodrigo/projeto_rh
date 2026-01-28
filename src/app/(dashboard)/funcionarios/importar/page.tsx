import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function ImportarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Funcionários</h1>
        <p className="text-muted-foreground">
          Importe funcionários em lote através de planilha
        </p>
      </div>

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Formato de importação</AlertTitle>
        <AlertDescription>
          Baixe o modelo de planilha antes de fazer a importação para garantir
          que os dados estejam no formato correto.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Planilha</CardTitle>
          <CardDescription>
            Formatos aceitos: .xlsx, .xls, .csv
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="size-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            A funcionalidade de importação em lote estará disponível em breve.
          </p>
          <Button disabled>
            <FileSpreadsheet className="mr-2 size-4" />
            Baixar Modelo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
