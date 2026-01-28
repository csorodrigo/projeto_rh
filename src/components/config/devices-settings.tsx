"use client"

import * as React from "react"
import {
  Monitor,
  Smartphone,
  Tablet,
  QrCode,
  Download,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Device {
  id: string
  name: string
  type: "web" | "mobile" | "tablet"
  icon: any
  description: string
  enabled: boolean
  features: string[]
}

export function DevicesSettings() {
  const [devices, setDevices] = React.useState<Device[]>([
    {
      id: "web",
      name: "Web App",
      type: "web",
      icon: Monitor,
      description: "Acesso via navegador web",
      enabled: true,
      features: [
        "Todos os módulos disponíveis",
        "Gestão completa",
        "Relatórios avançados",
      ],
    },
    {
      id: "mobile",
      name: "Mobile App",
      type: "mobile",
      icon: Smartphone,
      description: "Aplicativo para iOS e Android",
      enabled: true,
      features: [
        "Marcação de ponto",
        "Solicitação de férias",
        "Visualização de holerites",
        "Notificações push",
      ],
    },
    {
      id: "tablet",
      name: "Tablet",
      type: "tablet",
      icon: Tablet,
      description: "Otimizado para tablets",
      enabled: false,
      features: [
        "Interface responsiva",
        "Ponto coletivo",
        "Dashboard simplificado",
      ],
    },
  ])

  const [isQrDialogOpen, setIsQrDialogOpen] = React.useState(false)

  const handleToggleDevice = (id: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    )
    const device = devices.find(d => d.id === id)
    toast.success(
      `${device?.name} ${device?.enabled ? "desabilitado" : "habilitado"}!`
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Dispositivos e Plataformas</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os dispositivos que podem acessar o sistema
        </p>
      </div>

      {/* Dispositivos */}
      <div className="grid gap-4 md:grid-cols-3">
        {devices.map(device => {
          const Icon = device.icon
          return (
            <Card
              key={device.id}
              className={!device.enabled ? "opacity-60" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{device.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {device.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={device.enabled}
                    onCheckedChange={() => handleToggleDevice(device.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Recursos:</Label>
                  <ul className="space-y-1">
                    {device.features.map((feature, index) => (
                      <li
                        key={index}
                        className="text-xs text-muted-foreground flex items-start gap-2"
                      >
                        <CheckCircle2 className="size-3 mt-0.5 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* App Mobile */}
      <Card>
        <CardHeader>
          <CardTitle>Aplicativo Mobile</CardTitle>
          <CardDescription>
            Configure e distribua o aplicativo mobile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Download Links */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Downloads:</Label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 size-4" />
                  Download para iOS
                  <Badge variant="secondary" className="ml-auto">
                    v2.1.0
                  </Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 size-4" />
                  Download para Android
                  <Badge variant="secondary" className="ml-auto">
                    v2.1.0
                  </Badge>
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">QR Code:</Label>
              <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-32 flex-col gap-2"
                  >
                    <QrCode className="size-12" />
                    <span className="text-sm">Exibir QR Code</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>QR Code para Download</DialogTitle>
                    <DialogDescription>
                      Escaneie com seu celular para baixar o app
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-8">
                    <div className="size-64 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="size-48 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Disponível para iOS e Android
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Configurações do App */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Configurações do Aplicativo:
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Localização GPS</Label>
                  <p className="text-xs text-muted-foreground">
                    Exigir localização ao marcar ponto
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Foto Obrigatória</Label>
                  <p className="text-xs text-muted-foreground">
                    Tirar foto ao registrar ponto
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Offline</Label>
                  <p className="text-xs text-muted-foreground">
                    Permitir marcação offline com sincronização
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar lembretes e alertas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restrições de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle>Restrições de Acesso</CardTitle>
          <CardDescription>
            Configure regras de segurança para dispositivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloquear Dispositivos Não Registrados</Label>
              <p className="text-xs text-muted-foreground">
                Apenas dispositivos autorizados podem acessar
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Limitar por Endereço IP</Label>
              <p className="text-xs text-muted-foreground">
                Restringir acesso a IPs específicos
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sessões Simultâneas</Label>
              <p className="text-xs text-muted-foreground">
                Permitir múltiplos logins do mesmo usuário
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Verificação em Duas Etapas (2FA)</Label>
              <p className="text-xs text-muted-foreground">
                Exigir código adicional ao fazer login
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Uso</CardTitle>
          <CardDescription>Uso por plataforma nos últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="size-4 text-muted-foreground" />
                <span className="text-sm">Web App</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%]" />
                </div>
                <span className="text-sm font-medium w-12 text-right">85%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-muted-foreground" />
                <span className="text-sm">Mobile App</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%]" />
                </div>
                <span className="text-sm font-medium w-12 text-right">65%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tablet className="size-4 text-muted-foreground" />
                <span className="text-sm">Tablet</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground w-[10%]" />
                </div>
                <span className="text-sm font-medium w-12 text-right">10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
