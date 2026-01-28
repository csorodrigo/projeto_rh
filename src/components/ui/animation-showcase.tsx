"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { QuickStatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"

/**
 * Animation Showcase Component
 * Demonstra todas as animações e micro-interactions disponíveis
 */
export function AnimationShowcase() {
  const [progress, setProgress] = React.useState(0)
  const [showCards, setShowCards] = React.useState(false)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
    }, 500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-8 p-6">
      {/* Section 1: Button Animations */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Button Animations</CardTitle>
          <CardDescription>Hover, active states e press effects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>Default Button</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link Animated</Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Card Animations */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Card Animations</h3>
          <Button
            size="sm"
            onClick={() => setShowCards(!showCards)}
          >
            {showCards ? "Hide" : "Show"} Cards
          </Button>
        </div>

        {showCards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-fade-in">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>Card {i}</CardTitle>
                  <CardDescription>Hover para ver shadow elevation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Este card tem animação de fade-in com stagger delay
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Badge Animations */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Badge & Status Animations</CardTitle>
          <CardDescription>Badges com pulse e hover effects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <QuickStatusBadge status="active" />
              <QuickStatusBadge status="pending" />
              <QuickStatusBadge status="urgent" />
              <QuickStatusBadge status="in_progress" />
              <QuickStatusBadge status="approved" />
              <QuickStatusBadge status="rejected" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Progress Bar Animation */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle>Progress Animation</CardTitle>
          <CardDescription>Progress bar com gradient animado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Progress: {progress}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Loading Skeletons */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <CardHeader>
          <CardTitle>Loading Skeletons</CardTitle>
          <CardDescription>Shimmer effect em loading states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Toast Notifications */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle>Toast Animations</CardTitle>
          <CardDescription>Notificações com slide-in da direita</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={() => toast.success("Operação realizada com sucesso!")}
            >
              Success Toast
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => toast.error("Erro ao processar solicitação")}
            >
              Error Toast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.warning("Atenção: verifique os dados")}
            >
              Warning Toast
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("Nova atualização disponível")}
            >
              Info Toast
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toast.loading("Processando...", { duration: 2000 })}
            >
              Loading Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Interactive States */}
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Interactive Utility Classes</CardTitle>
          <CardDescription>Classes de utilidade para hover, press e outros estados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover-lift cursor-pointer">
                <p className="text-sm font-medium">hover-lift</p>
                <p className="text-xs text-muted-foreground">Eleva ao passar o mouse</p>
              </div>
              <div className="p-4 border rounded-lg hover-scale cursor-pointer">
                <p className="text-sm font-medium">hover-scale</p>
                <p className="text-xs text-muted-foreground">Aumenta ao passar o mouse</p>
              </div>
              <div className="p-4 border rounded-lg hover-glow cursor-pointer">
                <p className="text-sm font-medium">hover-glow</p>
                <p className="text-xs text-muted-foreground">Adiciona glow ao passar o mouse</p>
              </div>
            </div>

            <div className="space-y-2">
              <a href="#" className="link-animated text-primary">
                Link com underline animado
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Animation Classes Reference */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Classes de Animação Disponíveis</CardTitle>
          <CardDescription>Referência rápida de todas as classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Fade</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>animate-fade-in</li>
                <li>animate-fade-out</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Slide</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>animate-slide-up</li>
                <li>animate-slide-down</li>
                <li>animate-slide-left</li>
                <li>animate-slide-right</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Scale</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>animate-scale-in</li>
                <li>animate-scale-out</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Effects</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>animate-pulse-slow</li>
                <li>animate-shimmer</li>
                <li>animate-bounce-subtle</li>
                <li>animate-shake</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Transitions</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>transition-smooth</li>
                <li>transition-colors duration-200</li>
                <li>transition-transform-smooth</li>
                <li>transition-shadow-smooth</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Interactive</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>hover-lift</li>
                <li>hover-scale</li>
                <li>hover-glow</li>
                <li>press-effect</li>
                <li>link-animated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
