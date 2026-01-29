"use client"

import * as React from "react"
import { ChevronDown, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ExpandableRowAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: "default" | "destructive"
  separator?: boolean
}

interface ExpandableRowProps {
  children: React.ReactNode
  expandedContent: React.ReactNode
  actions?: ExpandableRowAction[]
  defaultExpanded?: boolean
  className?: string
}

export function ExpandableRow({
  children,
  expandedContent,
  actions = [],
  defaultExpanded = false,
  className,
}: ExpandableRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow
        className={cn(
          "group transition-colors hover:bg-muted/50",
          isExpanded && "bg-muted/30",
          className
        )}
      >
        <TableCell className="w-12">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
              <span className="sr-only">Expandir linha</span>
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        {children}
        {actions.length > 0 && (
          <TableCell className="w-12 text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <React.Fragment key={index}>
                    {action.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      className={cn(
                        action.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={100} className="p-0">
            <div className="border-t bg-muted/20 p-6">{expandedContent}</div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Helper components for building expandable table structure
interface ExpandableTableProps {
  children: React.ReactNode
  headers: string[]
  className?: string
}

export function ExpandableTable({
  children,
  headers,
  className,
}: ExpandableTableProps) {
  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            {headers.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
