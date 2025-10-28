"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import type { FormData, FieldSource } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onDataExtracted: (data: Partial<FormData>, sources?: FieldSource[]) => void
}

export function FileUpload({ onDataExtracted }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao processar documento")
      }

      const result = await response.json()
      onDataExtracted(result.extractedData, result.sources)
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      alert(error instanceof Error ? error.message : "Erro ao processar o documento. Tente novamente.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild disabled={isUploading}>
          <label htmlFor="document-upload" className="cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </>
            )}
            <input
              id="document-upload"
              type="file"
              accept=".doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </Button>
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{fileName}</span>
          </div>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato aceito:</strong> DOC e DOCX (Word)
          <br />
          <span className="text-xs">
            PDFs não são suportados no momento. Por favor, converta seu PDF para Word antes de fazer upload.
          </span>
        </AlertDescription>
      </Alert>
    </div>
  )
}
