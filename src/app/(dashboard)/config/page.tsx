"use client"

import * as React from "react"
import {
  Building2,
  Users,
  Clock,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie as configuracoes do sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-2">
            <Clock className="size-4" />
            <span className="hidden sm:inline">Ponto</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4" />
            <span className="hidden sm:inline">Notificacoes</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="size-4" />
            <span className="hidden sm:inline">Seguranca</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Informacoes cadastrais da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input id="companyName" placeholder="Minha Empresa LTDA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(00) 0000-0000" />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Endereco</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" placeholder="00000-000" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input id="street" placeholder="Rua Example" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Numero</Label>
                    <Input id="number" placeholder="123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" placeholder="Sao Paulo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" placeholder="SP" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 size-4" />
                  Salvar Alteracoes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuarios</CardTitle>
              <CardDescription>
                Gerencie os usuarios com acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto size-10 opacity-50 mb-2" />
                <p>Gestao de usuarios</p>
                <Button variant="link" className="mt-2">
                  Convidar usuario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Configuracoes de Ponto</CardTitle>
              <CardDescription>
                Configure as regras de marcacao de ponto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tolerancia de Atraso (minutos)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo Minimo (minutos)</Label>
                  <Input type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label>Hora Extra - Inicio (minutos apos)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>Hora Noturna - Inicio</Label>
                  <Input type="time" defaultValue="22:00" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 size-4" />
                  Salvar Configuracoes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificacoes</CardTitle>
              <CardDescription>
                Configure os alertas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">ASO Vencendo</p>
                    <p className="text-sm text-muted-foreground">
                      Alerta quando ASO esta proximo do vencimento
                    </p>
                  </div>
                  <Input type="number" className="w-20" defaultValue="30" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Aniversarios</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre aniversarios de funcionarios
                    </p>
                  </div>
                  <Input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Aprovacoes Pendentes</p>
                    <p className="text-sm text-muted-foreground">
                      Lembrete de aprovacoes de ferias/ponto
                    </p>
                  </div>
                  <Input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Seguranca</CardTitle>
              <CardDescription>
                Configuracoes de seguranca e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticacao em Duas Etapas</p>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para todos os usuarios
                    </p>
                  </div>
                  <Input type="checkbox" className="w-5 h-5" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Logs de Acesso</p>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as acoes no sistema
                    </p>
                  </div>
                  <Input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
