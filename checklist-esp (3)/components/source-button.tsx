"use client"

import { FileSearch, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { FieldSource } from "@/lib/types"

interface SourceButtonProps {
  source: FieldSource
}

export function SourceButton({ source }: SourceButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/50"
          title="Ver fonte da informação extraída"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium">Extraído</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <FileSearch className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Fonte da Informação</DialogTitle>
              <DialogDescription>Trecho extraído automaticamente do documento enviado</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Campo */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs">
                {source.field}
              </Badge>
            </div>
          </div>

          {/* Texto Correspondente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <h4 className="text-sm font-semibold text-foreground">Texto Identificado</h4>
            </div>
            <div className="relative rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="absolute -top-2 left-3 bg-background px-2">
                <Badge className="bg-emerald-600 text-white text-xs">Match</Badge>
              </div>
              <p className="text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap">{source.snippet}</p>
            </div>
          </div>

          {/* Contexto */}
          {source.context && source.context !== source.snippet && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground">Contexto Adicional</h4>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                  {source.context}
                </p>
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs text-muted-foreground">
              Este campo foi preenchido automaticamente com base no documento enviado
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
