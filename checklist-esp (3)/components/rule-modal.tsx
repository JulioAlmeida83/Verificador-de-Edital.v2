"use client"

import type { RuleResult } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface RuleModalProps {
  rule: RuleResult
  isOpen: boolean
  onClose: () => void
}

export function RuleModal({ rule, isOpen, onClose }: RuleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule.title}</DialogTitle>
          <DialogDescription>{rule.message}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Fundamentação Legal</h4>
            <p className="text-muted-foreground">{rule.legal}</p>
          </div>
          {rule.guidance && (
            <div>
              <h4 className="font-semibold mb-2">Orientação</h4>
              <p className="text-muted-foreground">{rule.guidance}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
