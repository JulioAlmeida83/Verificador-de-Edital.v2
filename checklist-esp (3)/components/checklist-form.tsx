"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { RuleBadge } from "@/components/rule-badge"
import { RuleModal } from "@/components/rule-modal"
import { SourceButton } from "@/components/source-button"
import { validateRules } from "@/lib/rules"
import type { FormData, RuleResult, FieldSource } from "@/lib/types"
import { Download, Upload, FileText } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function ChecklistForm() {
  const [formData, setFormData] = useState<FormData>({
    objetoDescricao: "",
    registroPreco: "",
    criterioJulgamento: "",
    preferenciaMe: "",
    exclusivaMe: "",
    subcontratacaoMe: "",
    cota25Me: "",
    cooperativas: "",
    consorcio: "",
    pncpPublicacao: "",
    pncpPrazo: "",
    pncpIntencao: "",
    pncpPrazoIntencao: "",
    orcamentoSigiloso: "",
    orcamentoPublico: "",
    lanceIntermediario: "",
    modoDisputa: "",
    intervaloMinimo: "",
    prazoRecursal: "",
    prazoImpugnacao: "",
    prazoEsclarecimento: "",
    prazoPropostaInicio: "",
    prazoPropostaFim: "",
    prazoHabilitacao: "",
    garantiaContratual: "",
    garantiaParticipacao: "",
    amostras: "",
    demonstracao: "",
    visita: "",
    visitaObrigatoria: "",
    criterioDesempate: "",
    criterioDesempateMe: "",
    criterioDesempateSorteio: "",
    beneficioLocal: "",
    margem25: "",
    margem10: "",
    valorLicitacao: "", // Added new field
  })

  const [rules, setRules] = useState<RuleResult[]>([])
  const [selectedRule, setSelectedRule] = useState<RuleResult | null>(null)
  const [fieldSources, setFieldSources] = useState<FieldSource[]>([])

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    setRules(validateRules(newFormData))
  }

  const handleFileExtracted = (extractedData: Partial<FormData>, sources?: FieldSource[]) => {
    const newFormData = { ...formData, ...extractedData }
    setFormData(newFormData)
    setRules(validateRules(newFormData))
    if (sources) {
      setFieldSources(sources)
    }
  }

  const getSourceForField = (field: keyof FormData): FieldSource | undefined => {
    return fieldSources.find((s) => s.field === field)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `checklist-esp-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setFormData(imported)
        setRules(validateRules(imported))
      } catch (error) {
        alert("Erro ao importar arquivo JSON")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Main Content */}
      <div className="flex-1 space-y-6">
        {/* File Upload Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload de Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onDataExtracted={handleFileExtracted} />
          </CardContent>
        </Card>

        {/* Descrição do Objeto da Licitação */}
        {formData.objetoDescricao && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Descrição do Objeto da Licitação</span>
                {getSourceForField("objetoDescricao") && (
                  <SourceButton source={getSourceForField("objetoDescricao")!} />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{formData.objetoDescricao}</p>
            </CardContent>
          </Card>
        )}

        {/* Valor da Licitação */}
        {formData.valorLicitacao && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Valor da Licitação</span>
                {getSourceForField("valorLicitacao") && <SourceButton source={getSourceForField("valorLicitacao")!} />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">R$ {formData.valorLicitacao}</p>
            </CardContent>
          </Card>
        )}

        {/* Parser Guide */}
        <Collapsible open={false} onOpenChange={() => {}}>
          <Card>
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <CardTitle className="flex items-center justify-between">
                  <span>Guia de Preenchimento</span>
                  <Button variant="ghost" size="sm">
                    {/* Toggle text based on state */}
                  </Button>
                </CardTitle>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Registro de Preço</h4>
                  <p>Busque no edital: "registro de preço", "ata de registro", "SRP"</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Critério de Julgamento</h4>
                  <p>Procure: "menor preço", "maior desconto", "melhor técnica", "técnica e preço"</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Preferência ME/EPP</h4>
                  <p>Identifique menções à LC 123/2006, tratamento diferenciado, microempresas</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Edital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registro de Preço */}
              <div className="space-y-2">
                <Label htmlFor="registroPreco" className="flex items-center justify-between">
                  <span>Registro de Preço</span>
                  {getSourceForField("registroPreco") && <SourceButton source={getSourceForField("registroPreco")!} />}
                </Label>
                <select
                  id="registroPreco"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.registroPreco}
                  onChange={(e) => handleInputChange("registroPreco", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Critério de Julgamento */}
              <div className="space-y-2">
                <Label htmlFor="criterioJulgamento" className="flex items-center justify-between">
                  <span>Critério de Julgamento</span>
                  {getSourceForField("criterioJulgamento") && (
                    <SourceButton source={getSourceForField("criterioJulgamento")!} />
                  )}
                </Label>
                <select
                  id="criterioJulgamento"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.criterioJulgamento}
                  onChange={(e) => handleInputChange("criterioJulgamento", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="menor-preco">Menor Preço</option>
                  <option value="maior-desconto">Maior Desconto</option>
                  <option value="melhor-tecnica">Melhor Técnica</option>
                  <option value="tecnica-preco">Técnica e Preço</option>
                </select>
              </div>

              {/* Preferência ME/EPP */}
              <div className="space-y-2">
                <Label htmlFor="preferenciaMe" className="flex items-center justify-between">
                  <span>Preferência ME/EPP</span>
                  {getSourceForField("preferenciaMe") && <SourceButton source={getSourceForField("preferenciaMe")!} />}
                </Label>
                <select
                  id="preferenciaMe"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.preferenciaMe}
                  onChange={(e) => handleInputChange("preferenciaMe", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Exclusiva ME/EPP */}
              <div className="space-y-2">
                <Label htmlFor="exclusivaMe" className="flex items-center justify-between">
                  <span>Exclusiva ME/EPP</span>
                  {getSourceForField("exclusivaMe") && <SourceButton source={getSourceForField("exclusivaMe")!} />}
                </Label>
                <select
                  id="exclusivaMe"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.exclusivaMe}
                  onChange={(e) => handleInputChange("exclusivaMe", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Subcontratação ME/EPP */}
              <div className="space-y-2">
                <Label htmlFor="subcontratacaoMe" className="flex items-center justify-between">
                  <span>Subcontratação ME/EPP</span>
                  {getSourceForField("subcontratacaoMe") && (
                    <SourceButton source={getSourceForField("subcontratacaoMe")!} />
                  )}
                </Label>
                <Input
                  id="subcontratacaoMe"
                  placeholder="Ex: 30%"
                  value={formData.subcontratacaoMe}
                  onChange={(e) => handleInputChange("subcontratacaoMe", e.target.value)}
                />
              </div>

              {/* Cota 25% ME/EPP */}
              <div className="space-y-2">
                <Label htmlFor="cota25Me" className="flex items-center justify-between">
                  <span>Cota 25% ME/EPP</span>
                  {getSourceForField("cota25Me") && <SourceButton source={getSourceForField("cota25Me")!} />}
                </Label>
                <select
                  id="cota25Me"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.cota25Me}
                  onChange={(e) => handleInputChange("cota25Me", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Cooperativas */}
              <div className="space-y-2">
                <Label htmlFor="cooperativas" className="flex items-center justify-between">
                  <span>Cooperativas</span>
                  {getSourceForField("cooperativas") && <SourceButton source={getSourceForField("cooperativas")!} />}
                </Label>
                <select
                  id="cooperativas"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.cooperativas}
                  onChange={(e) => handleInputChange("cooperativas", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="permitido">Permitido</option>
                  <option value="vedado">Vedado</option>
                </select>
              </div>

              {/* Consórcio */}
              <div className="space-y-2">
                <Label htmlFor="consorcio" className="flex items-center justify-between">
                  <span>Consórcio</span>
                  {getSourceForField("consorcio") && <SourceButton source={getSourceForField("consorcio")!} />}
                </Label>
                <select
                  id="consorcio"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.consorcio}
                  onChange={(e) => handleInputChange("consorcio", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="permitido">Permitido</option>
                  <option value="vedado">Vedado</option>
                </select>
              </div>

              {/* PNCP Publicação */}
              <div className="space-y-2">
                <Label htmlFor="pncpPublicacao" className="flex items-center justify-between">
                  <span>PNCP - Publicação</span>
                  {getSourceForField("pncpPublicacao") && (
                    <SourceButton source={getSourceForField("pncpPublicacao")!} />
                  )}
                </Label>
                <select
                  id="pncpPublicacao"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.pncpPublicacao}
                  onChange={(e) => handleInputChange("pncpPublicacao", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* PNCP Prazo */}
              <div className="space-y-2">
                <Label htmlFor="pncpPrazo" className="flex items-center justify-between">
                  <span>PNCP - Prazo (dias)</span>
                  {getSourceForField("pncpPrazo") && <SourceButton source={getSourceForField("pncpPrazo")!} />}
                </Label>
                <Input
                  id="pncpPrazo"
                  type="number"
                  placeholder="Ex: 8"
                  value={formData.pncpPrazo}
                  onChange={(e) => handleInputChange("pncpPrazo", e.target.value)}
                />
              </div>

              {/* PNCP Intenção */}
              <div className="space-y-2">
                <Label htmlFor="pncpIntencao" className="flex items-center justify-between">
                  <span>PNCP - Intenção de Registro</span>
                  {getSourceForField("pncpIntencao") && <SourceButton source={getSourceForField("pncpIntencao")!} />}
                </Label>
                <select
                  id="pncpIntencao"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.pncpIntencao}
                  onChange={(e) => handleInputChange("pncpIntencao", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* PNCP Prazo Intenção */}
              <div className="space-y-2">
                <Label htmlFor="pncpPrazoIntencao" className="flex items-center justify-between">
                  <span>PNCP - Prazo Intenção (dias)</span>
                  {getSourceForField("pncpPrazoIntencao") && (
                    <SourceButton source={getSourceForField("pncpPrazoIntencao")!} />
                  )}
                </Label>
                <Input
                  id="pncpPrazoIntencao"
                  type="number"
                  placeholder="Ex: 8"
                  value={formData.pncpPrazoIntencao}
                  onChange={(e) => handleInputChange("pncpPrazoIntencao", e.target.value)}
                />
              </div>

              {/* Orçamento Sigiloso */}
              <div className="space-y-2">
                <Label htmlFor="orcamentoSigiloso" className="flex items-center justify-between">
                  <span>Orçamento Sigiloso</span>
                  {getSourceForField("orcamentoSigiloso") && (
                    <SourceButton source={getSourceForField("orcamentoSigiloso")!} />
                  )}
                </Label>
                <select
                  id="orcamentoSigiloso"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.orcamentoSigiloso}
                  onChange={(e) => handleInputChange("orcamentoSigiloso", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Orçamento Público */}
              <div className="space-y-2">
                <Label htmlFor="orcamentoPublico" className="flex items-center justify-between">
                  <span>Orçamento Público</span>
                  {getSourceForField("orcamentoPublico") && (
                    <SourceButton source={getSourceForField("orcamentoPublico")!} />
                  )}
                </Label>
                <select
                  id="orcamentoPublico"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.orcamentoPublico}
                  onChange={(e) => handleInputChange("orcamentoPublico", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Lance Intermediário */}
              <div className="space-y-2">
                <Label htmlFor="lanceIntermediario" className="flex items-center justify-between">
                  <span>Lance Intermediário</span>
                  {getSourceForField("lanceIntermediario") && (
                    <SourceButton source={getSourceForField("lanceIntermediario")!} />
                  )}
                </Label>
                <select
                  id="lanceIntermediario"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.lanceIntermediario}
                  onChange={(e) => handleInputChange("lanceIntermediario", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Modo de Disputa */}
              <div className="space-y-2">
                <Label htmlFor="modoDisputa" className="flex items-center justify-between">
                  <span>Modo de Disputa</span>
                  {getSourceForField("modoDisputa") && <SourceButton source={getSourceForField("modoDisputa")!} />}
                </Label>
                <select
                  id="modoDisputa"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.modoDisputa}
                  onChange={(e) => handleInputChange("modoDisputa", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="aberto">Aberto</option>
                  <option value="fechado">Fechado</option>
                  <option value="aberto-fechado">Aberto-Fechado</option>
                </select>
              </div>

              {/* Intervalo Mínimo */}
              <div className="space-y-2">
                <Label htmlFor="intervaloMinimo" className="flex items-center justify-between">
                  <span>Intervalo Mínimo (minutos)</span>
                  {getSourceForField("intervaloMinimo") && (
                    <SourceButton source={getSourceForField("intervaloMinimo")!} />
                  )}
                </Label>
                <Input
                  id="intervaloMinimo"
                  type="number"
                  placeholder="Ex: 3"
                  value={formData.intervaloMinimo}
                  onChange={(e) => handleInputChange("intervaloMinimo", e.target.value)}
                />
              </div>

              {/* Prazo Recursal */}
              <div className="space-y-2">
                <Label htmlFor="prazoRecursal" className="flex items-center justify-between">
                  <span>Prazo Recursal (dias)</span>
                  {getSourceForField("prazoRecursal") && <SourceButton source={getSourceForField("prazoRecursal")!} />}
                </Label>
                <Input
                  id="prazoRecursal"
                  type="number"
                  placeholder="Ex: 3"
                  value={formData.prazoRecursal}
                  onChange={(e) => handleInputChange("prazoRecursal", e.target.value)}
                />
              </div>

              {/* Prazo Impugnação */}
              <div className="space-y-2">
                <Label htmlFor="prazoImpugnacao" className="flex items-center justify-between">
                  <span>Prazo Impugnação (dias)</span>
                  {getSourceForField("prazoImpugnacao") && (
                    <SourceButton source={getSourceForField("prazoImpugnacao")!} />
                  )}
                </Label>
                <Input
                  id="prazoImpugnacao"
                  type="number"
                  placeholder="Ex: 3"
                  value={formData.prazoImpugnacao}
                  onChange={(e) => handleInputChange("prazoImpugnacao", e.target.value)}
                />
              </div>

              {/* Prazo Esclarecimento */}
              <div className="space-y-2">
                <Label htmlFor="prazoEsclarecimento" className="flex items-center justify-between">
                  <span>Prazo Esclarecimento (dias)</span>
                  {getSourceForField("prazoEsclarecimento") && (
                    <SourceButton source={getSourceForField("prazoEsclarecimento")!} />
                  )}
                </Label>
                <Input
                  id="prazoEsclarecimento"
                  type="number"
                  placeholder="Ex: 3"
                  value={formData.prazoEsclarecimento}
                  onChange={(e) => handleInputChange("prazoEsclarecimento", e.target.value)}
                />
              </div>

              {/* Prazo Proposta Início */}
              <div className="space-y-2">
                <Label htmlFor="prazoPropostaInicio" className="flex items-center justify-between">
                  <span>Prazo Proposta - Início</span>
                  {getSourceForField("prazoPropostaInicio") && (
                    <SourceButton source={getSourceForField("prazoPropostaInicio")!} />
                  )}
                </Label>
                <Input
                  id="prazoPropostaInicio"
                  type="date"
                  value={formData.prazoPropostaInicio}
                  onChange={(e) => handleInputChange("prazoPropostaInicio", e.target.value)}
                />
              </div>

              {/* Prazo Proposta Fim */}
              <div className="space-y-2">
                <Label htmlFor="prazoPropostaFim" className="flex items-center justify-between">
                  <span>Prazo Proposta - Fim</span>
                  {getSourceForField("prazoPropostaFim") && (
                    <SourceButton source={getSourceForField("prazoPropostaFim")!} />
                  )}
                </Label>
                <Input
                  id="prazoPropostaFim"
                  type="date"
                  value={formData.prazoPropostaFim}
                  onChange={(e) => handleInputChange("prazoPropostaFim", e.target.value)}
                />
              </div>

              {/* Prazo Habilitação */}
              <div className="space-y-2">
                <Label htmlFor="prazoHabilitacao" className="flex items-center justify-between">
                  <span>Prazo Habilitação (dias)</span>
                  {getSourceForField("prazoHabilitacao") && (
                    <SourceButton source={getSourceForField("prazoHabilitacao")!} />
                  )}
                </Label>
                <Input
                  id="prazoHabilitacao"
                  type="number"
                  placeholder="Ex: 5"
                  value={formData.prazoHabilitacao}
                  onChange={(e) => handleInputChange("prazoHabilitacao", e.target.value)}
                />
              </div>

              {/* Garantia Contratual */}
              <div className="space-y-2">
                <Label htmlFor="garantiaContratual" className="flex items-center justify-between">
                  <span>Garantia Contratual (%)</span>
                  {getSourceForField("garantiaContratual") && (
                    <SourceButton source={getSourceForField("garantiaContratual")!} />
                  )}
                </Label>
                <Input
                  id="garantiaContratual"
                  placeholder="Ex: 5"
                  value={formData.garantiaContratual}
                  onChange={(e) => handleInputChange("garantiaContratual", e.target.value)}
                />
              </div>

              {/* Garantia Participação */}
              <div className="space-y-2">
                <Label htmlFor="garantiaParticipacao" className="flex items-center justify-between">
                  <span>Garantia Participação (%)</span>
                  {getSourceForField("garantiaParticipacao") && (
                    <SourceButton source={getSourceForField("garantiaParticipacao")!} />
                  )}
                </Label>
                <Input
                  id="garantiaParticipacao"
                  placeholder="Ex: 1"
                  value={formData.garantiaParticipacao}
                  onChange={(e) => handleInputChange("garantiaParticipacao", e.target.value)}
                />
              </div>

              {/* Amostras */}
              <div className="space-y-2">
                <Label htmlFor="amostras" className="flex items-center justify-between">
                  <span>Amostras</span>
                  {getSourceForField("amostras") && <SourceButton source={getSourceForField("amostras")!} />}
                </Label>
                <select
                  id="amostras"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.amostras}
                  onChange={(e) => handleInputChange("amostras", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Demonstração */}
              <div className="space-y-2">
                <Label htmlFor="demonstracao" className="flex items-center justify-between">
                  <span>Demonstração</span>
                  {getSourceForField("demonstracao") && <SourceButton source={getSourceForField("demonstracao")!} />}
                </Label>
                <select
                  id="demonstracao"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.demonstracao}
                  onChange={(e) => handleInputChange("demonstracao", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Visita */}
              <div className="space-y-2">
                <Label htmlFor="visita" className="flex items-center justify-between">
                  <span>Visita Técnica</span>
                  {getSourceForField("visita") && <SourceButton source={getSourceForField("visita")!} />}
                </Label>
                <select
                  id="visita"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.visita}
                  onChange={(e) => handleInputChange("visita", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Visita Obrigatória */}
              <div className="space-y-2">
                <Label htmlFor="visitaObrigatoria" className="flex items-center justify-between">
                  <span>Visita Obrigatória</span>
                  {getSourceForField("visitaObrigatoria") && (
                    <SourceButton source={getSourceForField("visitaObrigatoria")!} />
                  )}
                </Label>
                <select
                  id="visitaObrigatoria"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.visitaObrigatoria}
                  onChange={(e) => handleInputChange("visitaObrigatoria", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Critério Desempate */}
              <div className="space-y-2">
                <Label htmlFor="criterioDesempate" className="flex items-center justify-between">
                  <span>Critério de Desempate</span>
                  {getSourceForField("criterioDesempate") && (
                    <SourceButton source={getSourceForField("criterioDesempate")!} />
                  )}
                </Label>
                <Input
                  id="criterioDesempate"
                  placeholder="Ex: Sorteio"
                  value={formData.criterioDesempate}
                  onChange={(e) => handleInputChange("criterioDesempate", e.target.value)}
                />
              </div>

              {/* Critério Desempate ME */}
              <div className="space-y-2">
                <Label htmlFor="criterioDesempateMe" className="flex items-center justify-between">
                  <span>Desempate ME/EPP</span>
                  {getSourceForField("criterioDesempateMe") && (
                    <SourceButton source={getSourceForField("criterioDesempateMe")!} />
                  )}
                </Label>
                <select
                  id="criterioDesempateMe"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.criterioDesempateMe}
                  onChange={(e) => handleInputChange("criterioDesempateMe", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Critério Desempate Sorteio */}
              <div className="space-y-2">
                <Label htmlFor="criterioDesempateSorteio" className="flex items-center justify-between">
                  <span>Desempate por Sorteio</span>
                  {getSourceForField("criterioDesempateSorteio") && (
                    <SourceButton source={getSourceForField("criterioDesempateSorteio")!} />
                  )}
                </Label>
                <select
                  id="criterioDesempateSorteio"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.criterioDesempateSorteio}
                  onChange={(e) => handleInputChange("criterioDesempateSorteio", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Benefício Local */}
              <div className="space-y-2">
                <Label htmlFor="beneficioLocal" className="flex items-center justify-between">
                  <span>Benefício Local</span>
                  {getSourceForField("beneficioLocal") && (
                    <SourceButton source={getSourceForField("beneficioLocal")!} />
                  )}
                </Label>
                <select
                  id="beneficioLocal"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.beneficioLocal}
                  onChange={(e) => handleInputChange("beneficioLocal", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Margem 25% */}
              <div className="space-y-2">
                <Label htmlFor="margem25" className="flex items-center justify-between">
                  <span>Margem 25%</span>
                  {getSourceForField("margem25") && <SourceButton source={getSourceForField("margem25")!} />}
                </Label>
                <select
                  id="margem25"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.margem25}
                  onChange={(e) => handleInputChange("margem25", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Margem 10% */}
              <div className="space-y-2">
                <Label htmlFor="margem10" className="flex items-center justify-between">
                  <span>Margem 10%</span>
                  {getSourceForField("margem10") && <SourceButton source={getSourceForField("margem10")!} />}
                </Label>
                <select
                  id="margem10"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.margem10}
                  onChange={(e) => handleInputChange("margem10", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              {/* Valor da Licitação */}
              <div className="space-y-2">
                <Label htmlFor="valorLicitacao" className="flex items-center justify-between">
                  <span>Valor da Licitação</span>
                  {getSourceForField("valorLicitacao") && (
                    <SourceButton source={getSourceForField("valorLicitacao")!} />
                  )}
                </Label>
                <Input
                  id="valorLicitacao"
                  placeholder="Ex: 100000"
                  value={formData.valorLicitacao}
                  onChange={(e) => handleInputChange("valorLicitacao", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button variant="outline" asChild>
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Importar JSON
              <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </Button>
        </div>
      </div>

      {/* Right Column - Alerts/Rules */}
      <div className="lg:w-96 space-y-6">
        {rules.length > 0 && (
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Validação de Regras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {rules.map((rule) => (
                  <RuleBadge key={rule.id} rule={rule} onClick={() => setSelectedRule(rule)} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rule Modal */}
      {selectedRule && <RuleModal rule={selectedRule} isOpen={!!selectedRule} onClose={() => setSelectedRule(null)} />}
    </div>
  )
}
