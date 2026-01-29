import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplatesList } from './TemplatesList';

export const metadata = {
  title: 'Templates de Relatórios',
  description: 'Crie relatórios personalizados e agende gerações automáticas',
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Crie relatórios personalizados e agende gerações automáticas
          </p>
        </div>
        <Button asChild>
          <Link href="/relatorios/templates/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          <TabsTrigger value="mine">Meus Templates</TabsTrigger>
          <TabsTrigger value="shared">Compartilhados Comigo</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Suspense fallback={<TemplatesListSkeleton />}>
            <TemplatesList filter="all" />
          </Suspense>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Suspense fallback={<TemplatesListSkeleton />}>
            <TemplatesList filter="favorites" />
          </Suspense>
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <Suspense fallback={<TemplatesListSkeleton />}>
            <TemplatesList filter="mine" />
          </Suspense>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Suspense fallback={<TemplatesListSkeleton />}>
            <TemplatesList filter="shared" />
          </Suspense>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Suspense fallback={<TemplatesListSkeleton />}>
            <TemplatesList filter="scheduled" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplatesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          className="h-64 rounded-lg border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}
