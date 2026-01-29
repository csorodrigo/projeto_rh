import { ImportWizard } from "@/components/import"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function ImportarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Funcionários</h1>
        <p className="text-muted-foreground">
          Importe funcionários em lote através de planilha CSV ou Excel
        </p>
      </div>

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Formato de importação</AlertTitle>
        <AlertDescription>
          Baixe o template CSV antes de fazer a importação para garantir
          que os dados estejam no formato correto. O arquivo deve conter os campos:
          name, cpf, personal_email, birth_date, hire_date, position, department, base_salary, status, personal_phone.
        </AlertDescription>
      </Alert>

      <ImportWizard />
    </div>
  )
}
