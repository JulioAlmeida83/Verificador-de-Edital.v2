export interface FormData {
  objetoDescricao: string // Added field for object description
  valorLicitacao: string // Added field for bidding value (if not confidential)
  registroPreco: string
  criterioJulgamento: string
  preferenciaMe: string
  exclusivaMe: string
  subcontratacaoMe: string
  cota25Me: string
  cooperativas: string
  consorcio: string
  pncpPublicacao: string
  pncpPrazo: string
  pncpIntencao: string
  pncpPrazoIntencao: string
  orcamentoSigiloso: string
  orcamentoPublico: string
  lanceIntermediario: string
  modoDisputa: string
  intervaloMinimo: string
  prazoRecursal: string
  prazoImpugnacao: string
  prazoEsclarecimento: string
  prazoPropostaInicio: string
  prazoPropostaFim: string
  prazoHabilitacao: string
  garantiaContratual: string
  garantiaParticipacao: string
  amostras: string
  demonstracao: string
  visita: string
  visitaObrigatoria: string
  criterioDesempate: string
  criterioDesempateMe: string
  criterioDesempateSorteio: string
  beneficioLocal: string
  margem25: string
  margem10: string
}

export interface FieldSource {
  field: keyof FormData
  snippet: string // The matched text from the document
  context: string // Surrounding context (before and after)
  editalItem?: string // e.g., "3.1", "4.2.1"
  editalTitle?: string // e.g., "DO REGISTRO DE PREÇOS"
}

export interface FormDataWithSources {
  data: FormData
  sources: FieldSource[]
}

export interface RuleResult {
  id: string
  title: string
  status: "ok" | "warning"
  message: string
  legal: string
  guidance?: string
  sourceContext?: string // Description of the form field that triggered this rule
  editalReference?: string // Reference to specific edital item/clause (e.g., "Item 3.2.1 do Edital")
}

export interface DocumentItem {
  number: string // e.g., "3.1", "3.1.1", "4.2.3"
  title: string
  content: string
  level: number // 1 for main items, 2 for subitems, etc.
}
