"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Clock, Calendar, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Início",
    icon: Home,
  },
  {
    href: "/ponto/mobile",
    label: "Ponto",
    icon: Clock,
  },
  {
    href: "/ausencias/mobile",
    label: "Ausências",
    icon: Calendar,
  },
  {
    href: "/folha/mobile",
    label: "Folha",
    icon: FileText,
  },
  {
    href: "/configuracoes",
    label: "Perfil",
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Não mostrar em desktop
  if (typeof window !== "undefined" && window.innerWidth >= 768) {
    return null;
  }

  return (
    <>
      {/* Spacer para compensar altura da bottom nav */}
      <div className="h-16 md:hidden" />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background pb-safe md:hidden">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                  "active:scale-95",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "animate-in zoom-in duration-200")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

interface BottomNavBadgeProps {
  count: number;
}

export function BottomNavBadge({ count }: BottomNavBadgeProps) {
  if (count === 0) return null;

  return (
    <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}
