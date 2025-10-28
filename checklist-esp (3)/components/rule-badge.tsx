"use client"

import type { RuleResult } from "@/lib/types"
import { AlertTriangle, CheckCircle2, FileText, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RuleBadgeProps {
  rule: RuleResult
  onClick: () => void
}

export function RuleBadge({ rule, onClick }: RuleBadgeProps) {
  return (
    <Button
      variant={rule.status === "ok" ? "outline" : "destructive"}
      className="w-full justify-start h-auto py-3 px-4"
      onClick={onClick}
    >
      <div className="flex items-start gap-2 w-full">
        {rule.status === "ok" ? (
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{rule.title}</div>
          {rule.status === "warning" && <div className="text-xs opacity-90 mt-1">{rule.message}</div>}
          {rule.sourceContext && (
            <div className="flex items-center gap-1 text-xs opacity-75 mt-1.5">
              <FileText className="h-3 w-3" />
              <span className="font-medium">Campo:</span>
              <span>{rule.sourceContext}</span>
            </div>
          )}
          {rule.editalReference && (
            <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
              <BookOpen className="h-3 w-3" />
              <span className="font-medium">Edital:</span>
              <span>{rule.editalReference}</span>
            </div>
          )}
        </div>
      </div>
    </Button>
  )
}
