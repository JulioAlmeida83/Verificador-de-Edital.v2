import type { FormData, FieldSource, DocumentItem } from "@/lib/types"
import { findRelevantItem } from "./extract-document-structure"

export function extractDataFromText(
  text: string,
  documentStructure: DocumentItem[] = [],
): { data: Partial<FormData>; sources: FieldSource[] } {
  const data: Partial<FormData> = {}
  const sources: FieldSource[] = []
  const lowerText = text.toLowerCase()

  const addSource = (field: keyof FormData, matchText: string, contextLength = 100) => {
    const matchIndex = text.toLowerCase().indexOf(matchText.toLowerCase())
    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - contextLength)
      const end = Math.min(text.length, matchIndex + matchText.length + contextLength)
      const context = text.substring(start, end).trim()
      const snippet = text.substring(matchIndex, matchIndex + matchText.length).trim()

      const relevantItem = findRelevantItem(snippet, documentStructure)

      sources.push({
        field,
        snippet,
        context: context.length > snippet.length ? context : snippet,
        editalItem: relevantItem?.number,
        editalTitle: relevantItem?.title,
      })
    }
  }

  // Look for "OBJETO" section and extract the description more precisely
  const objetoMatch = text.match(
    /OBJETO[:\s]+([^.]{20,300})(?=\s*(?:VALOR|DATA|CRITÉRIO|MODO|PREFERÊNCIA|EDITAL|Sumário|DO REGISTRO))/i,
  )
  if (objetoMatch) {
    let desc = objetoMatch[1].trim()
    // Remove common trailing text that shouldn't be part of the object
    desc = desc.replace(/\s*VALOR TOTAL.*$/i, "")
    desc = desc.replace(/\s*DATA DA.*$/i, "")
    desc = desc.replace(/\s*CRITÉRIO.*$/i, "")
    desc = desc.replace(/\s*Sumário.*$/i, "")
    data.objetoDescricao = desc.trim()
    addSource("objetoDescricao", objetoMatch[0], 50)
    console.log("[v0] Objeto extraído:", data.objetoDescricao)
  } else {
    // Try alternative patterns
    const altObjetoMatch = text.match(/(?:1\.|1\.1\.?)\s*(?:DO\s+)?OBJETO[:\s]+([^\n]{20,300})/i)
    if (altObjetoMatch) {
      let desc = altObjetoMatch[1].trim()
      // Stop at common next sections
      const stopWords = ["VALOR", "EDITAL", "Sumário", "DO REGISTRO", "DA PARTICIPAÇÃO", "CRITÉRIO", "DATA"]
      for (const word of stopWords) {
        const idx = desc.indexOf(word)
        if (idx > 20) {
          desc = desc.substring(0, idx).trim()
          break
        }
      }
      // Remove trailing punctuation and clean up
      desc = desc.replace(/[.,;:]+$/, "").trim()
      data.objetoDescricao = desc
      addSource("objetoDescricao", altObjetoMatch[0], 50)
      console.log("[v0] Objeto extraído (padrão alternativo):", data.objetoDescricao)
    }
  }

  // ========== ESTRUTURA DO OBJETO E JULGAMENTO ==========

  // Registro de Preços (SRP)
  let isRegistroPrecos = false
  let foundExplicitNegation = false

  // Passo 1: Procurar negações explícitas PRIMEIRO
  const negationPatterns = [
    /não\s+se\s+trata\s+de\s+(?:uma\s+)?licitação\s+para\s+registro\s+de\s+preços?/i,
    /não\s+se\s+aplica\s+(?:no\s+presente\s+procedimento|neste\s+procedimento).*?registro\s+de\s+preços?/i,
    /registro\s+de\s+preços?.*?não\s+se\s+aplica/i,
    /(?:item|subitem|disciplina).*?não\s+se\s+aplica.*?registro\s+de\s+preços?/i,
    /disciplina\s+deste\s+item.*?não\s+se\s+aplica.*?por\s+não\s+se\s+tratar/i,
  ]

  for (const pattern of negationPatterns) {
    const match = text.match(pattern)
    if (match) {
      const contextStart = Math.max(0, match.index! - 100)
      const contextEnd = Math.min(text.length, match.index! + match[0].length + 100)
      const context = text.substring(contextStart, contextEnd)

      // Ignorar referências do sumário e TOC
      if (
        !context.includes("PAGEREF") &&
        !context.includes("_Toc") &&
        !context.includes("Sumário") &&
        !context.match(/DO REGISTRO DE PREÇOS\s+\d+/) // Ignora "DO REGISTRO DE PREÇOS 1" do sumário
      ) {
        foundExplicitNegation = true
        data.registroPreco = "nao"
        addSource("registroPreco", match[0], 200)
        console.log("[v0] Registro de Preços: NÃO (negação explícita):", match[0].substring(0, 100))
        break
      }
    }
  }

  // Passo 2: Se não encontrou negação, verificar o OBJETO de forma mais rigorosa
  if (!foundExplicitNegation && data.objetoDescricao) {
    const objetoLower = data.objetoDescricao.toLowerCase()
    // Verificar se o objeto REALMENTE menciona registro de preços de forma substantiva
    const hasRegistroMention =
      objetoLower.includes("registro de preço") ||
      objetoLower.includes("registro de preco") ||
      objetoLower.match(/\bsrp\b/)

    // Verificar que não é apenas uma referência do sumário
    const isNotSummaryReference =
      !objetoLower.includes("sumário") &&
      !objetoLower.match(/do registro de preços?\s+\d+/) &&
      !objetoLower.includes("pageref")

    if (hasRegistroMention && isNotSummaryReference) {
      isRegistroPrecos = true
      data.registroPreco = "sim"
      addSource("registroPreco", data.objetoDescricao, 100)
      console.log("[v0] Registro de Preços: SIM (mencionado no OBJETO)")
    }
  }

  // Passo 3: Se ainda não determinou, procurar indicadores positivos fortes
  if (!foundExplicitNegation && !isRegistroPrecos) {
    const positivePatterns = [
      /ata\s+de\s+registro\s+de\s+preços?/i,
      /validade\s+(?:do|da)\s+registro\s+de\s+preços?/i,
      /vigência\s+(?:do|da)\s+registro\s+de\s+preços?/i,
      /intenção\s+de\s+registro\s+de\s+preços?/i,
      /sistema\s+de\s+registro\s+de\s+preços?/i,
      /srp\s*[-–]\s+sistema\s+de\s+registro/i,
      /registro\s+de\s+preços?\s+para\s+(?:contratações?|aquisições?)\s+futuras?/i,
    ]

    for (const pattern of positivePatterns) {
      const match = text.match(pattern)
      if (match) {
        const contextStart = Math.max(0, match.index! - 100)
        const contextEnd = Math.min(text.length, match.index! + match[0].length + 100)
        const context = text.substring(contextStart, contextEnd)

        // Ignorar se estiver no sumário ou TOC
        if (
          !context.includes("Sumário") &&
          !context.includes("PAGEREF") &&
          !context.match(/DO REGISTRO DE PREÇOS\s+\d+/)
        ) {
          isRegistroPrecos = true
          data.registroPreco = "sim"
          addSource("registroPreco", match[0], 150)
          console.log("[v0] Registro de Preços: SIM (indicador positivo):", match[0].substring(0, 80))
          break
        }
      }
    }
  }

  // Se ainda não determinou, assumir NÃO
  if (!data.registroPreco) {
    data.registroPreco = "nao"
    console.log("[v0] Registro de Preços: NÃO (sem indicadores positivos)")
  }

  // Forma do objeto (parcelamento)
  if (lowerText.includes("por item") || lowerText.includes("julgamento por item")) {
    data.formaObjeto = "por-item"
    const match = text.match(/por item[^.]{0,50}/i)
    if (match) addSource("formaObjeto", match[0])
  } else if (
    lowerText.includes("por grupo") ||
    lowerText.includes("por lote") ||
    lowerText.includes("julgamento por grupo") ||
    lowerText.includes("julgamento por lote")
  ) {
    data.formaObjeto = "por-grupo"
    const match = text.match(/por grupo[^.]{0,50}/i) || text.match(/por lote[^.]{0,50}/i)
    if (match) addSource("formaObjeto", match[0])
  } else if (lowerText.includes("global") || lowerText.includes("adjudicação global")) {
    data.formaObjeto = "global"
    const match = text.match(/global[^.]{0,50}/i) || text.match(/adjudicação global[^.]{0,80}/i)
    if (match) addSource("formaObjeto", match[0])
  }

  // Critério de julgamento
  if (lowerText.includes("menor preço") || lowerText.includes("menor preco")) {
    data.criterioJulgamento = "menor-preco"
    const match = text.match(/menor preço[^.]{0,50}/i)
    if (match) addSource("criterioJulgamento", match[0])
  } else if (
    lowerText.includes("maior desconto") ||
    lowerText.includes("desconto sobre") ||
    lowerText.includes("preço-base") ||
    lowerText.includes("preco-base")
  ) {
    data.criterioJulgamento = "maior-desconto"
    const match = text.match(/maior desconto[^.]{0,50}/i)
    if (match) addSource("criterioJulgamento", match[0])

    // Extrair preço-base se houver
    const precoBaseMatch = text.match(/(?:preço-base|preco-base|valor de referência).*?r\$\s*([\d.,]+)/i)
    if (precoBaseMatch) {
      data.precoBase = precoBaseMatch[1].replace(/\./g, "").replace(",", ".")
      addSource("precoBase", precoBaseMatch[0])
    }
  } else if (lowerText.includes("melhor técnica") || lowerText.includes("melhor tecnica")) {
    data.criterioJulgamento = "melhor-tecnica"
    const match = text.match(/melhor técnica[^.]{0,50}/i)
    if (match) addSource("criterioJulgamento", match[0])
  } else if (lowerText.includes("técnica e preço") || lowerText.includes("tecnica e preco")) {
    data.criterioJulgamento = "tecnica-preco"
    const match = text.match(/técnica e preço[^.]{0,50}/i)
    if (match) addSource("criterioJulgamento", match[0])
  }

  // Escopo do julgamento
  if (lowerText.includes("julgamento por item") || lowerText.includes("escopo por item")) {
    data.escopoJulgamento = "item"
    const match = text.match(/julgamento por item[^.]{0,50}/i) || text.match(/escopo por item[^.]{0,50}/i)
    if (match) addSource("escopoJulgamento", match[0])
  } else if (
    lowerText.includes("julgamento por grupo") ||
    lowerText.includes("julgamento por lote") ||
    lowerText.includes("escopo por grupo")
  ) {
    data.escopoJulgamento = "grupo"
    const match =
      text.match(/julgamento por grupo[^.]{0,50}/i) ||
      text.match(/julgamento por lote[^.]{0,50}/i) ||
      text.match(/escopo por grupo[^.]{0,50}/i)
    if (match) addSource("escopoJulgamento", match[0])
  } else if (lowerText.includes("julgamento global") || lowerText.includes("escopo global")) {
    data.escopoJulgamento = "global"
    const match = text.match(/julgamento global[^.]{0,50}/i) || text.match(/escopo global[^.]{0,50}/i)
    if (match) addSource("escopoJulgamento", match[0])
  }

  // Modo de disputa
  if (lowerText.includes("modo aberto") || lowerText.includes("disputa aberta")) {
    data.modoDisputa = "aberto"
    const match = text.match(/modo aberto[^.]{0,50}/i) || text.match(/disputa aberta[^.]{0,50}/i)
    if (match) addSource("modoDisputa", match[0])
  } else if (
    lowerText.includes("aberto e fechado") ||
    lowerText.includes("aberto-fechado") ||
    lowerText.includes("modo aberto-fechado")
  ) {
    data.modoDisputa = "aberto-fechado"
    const match = text.match(/aberto[- ]e[- ]fechado[^.]{0,50}/i)
    if (match) addSource("modoDisputa", match[0])
  } else if (
    lowerText.includes("fechado e aberto") ||
    lowerText.includes("fechado-aberto") ||
    lowerText.includes("modo fechado-aberto")
  ) {
    data.modoDisputa = "fechado-aberto"
    const match = text.match(/fechado[- ]e[- ]aberto[^.]{0,50}/i)
    if (match) addSource("modoDisputa", match[0])
  } else if (lowerText.includes("modo fechado") || lowerText.includes("disputa fechada")) {
    data.modoDisputa = "fechado"
    const match = text.match(/modo fechado[^.]{0,50}/i) || text.match(/disputa fechada[^.]{0,50}/i)
    if (match) addSource("modoDisputa", match[0])
  }

  // ========== ORÇAMENTO ==========

  const valorMatch = text.match(/(?:valor\s+(?:total|estimado|da\s+contratação|da\s+licitação)).*?r\$\s*([\d.,]+)/i)
  if (valorMatch) {
    const valor = valorMatch[1]
    // Check if the value is marked as confidential/secret
    const contextStart = Math.max(0, valorMatch.index! - 200)
    const contextEnd = Math.min(text.length, valorMatch.index! + valorMatch[0].length + 200)
    const context = text.substring(contextStart, contextEnd).toLowerCase()

    const isSigiloso =
      context.includes("sigiloso") ||
      context.includes("sigilosa") ||
      context.includes("confidencial") ||
      context.includes("não divulgado") ||
      context.includes("nao divulgado")

    if (!isSigiloso) {
      data.valorLicitacao = valor
      addSource("valorLicitacao", valorMatch[0])
      console.log("[v0] Valor da Licitação extraído:", valor)
    } else {
      console.log("[v0] Valor da Licitação é sigiloso, não será exibido")
    }
  }

  // Orçamento público ou sigiloso
  if (lowerText.includes("orçamento sigiloso") || lowerText.includes("orcamento sigiloso")) {
    data.orcamentoSigiloso = "sim"
    data.orcamentoPublico = "nao"
    const match = text.match(/orçamento sigiloso[^.]{0,80}/i)
    if (match) {
      addSource("orcamentoSigiloso", match[0])
      addSource("orcamentoPublico", match[0])
    }
  } else if (
    lowerText.includes("orçamento público") ||
    lowerText.includes("orcamento publico") ||
    lowerText.includes("divulgação do orçamento") ||
    lowerText.includes("divulgacao do orcamento")
  ) {
    data.orcamentoPublico = "sim"
    data.orcamentoSigiloso = "nao"
    const match = text.match(/orçamento público[^.]{0,80}/i) || text.match(/divulgação do orçamento[^.]{0,80}/i)
    if (match) {
      addSource("orcamentoPublico", match[0])
      addSource("orcamentoSigiloso", match[0])
    }
  }

  // ========== PRAZOS E PUBLICIDADE (PNCP) ==========

  // Classe do objeto (bens, serviços, SCE)
  if (
    lowerText.includes("serviços comuns de engenharia") ||
    lowerText.includes("servicos comuns de engenharia") ||
    lowerText.includes("sce")
  ) {
    data.classePrazo = "sce"
    const match = text.match(/serviços comuns de engenharia[^.]{0,80}/i) || text.match(/sce[^.]{0,50}/i)
    if (match) addSource("classePrazo", match[0])
  } else if (
    lowerText.includes("fornecimento de bens") ||
    lowerText.includes("aquisição de bens") ||
    lowerText.includes("aquisicao de bens") ||
    lowerText.includes("compra de")
  ) {
    data.classePrazo = "bens"
    const match =
      text.match(/fornecimento de bens[^.]{0,80}/i) ||
      text.match(/aquisição de bens[^.]{0,80}/i) ||
      text.match(/compra de[^.]{0,80}/i)
    if (match) addSource("classePrazo", match[0])
  } else if (
    lowerText.includes("prestação de serviços") ||
    lowerText.includes("prestacao de servicos") ||
    lowerText.includes("contratação de serviços") ||
    lowerText.includes("contratacao de servicos")
  ) {
    data.classePrazo = "servicos"
    const match = text.match(/prestação de serviços[^.]{0,80}/i) || text.match(/contratação de serviços[^.]{0,80}/i)
    if (match) addSource("classePrazo", match[0])
  }

  // PNCP Publicação
  if (lowerText.includes("pncp")) {
    data.pncpPublicacao = "sim"
    const match = text.match(/pncp[^.]{0,80}/i)
    if (match) addSource("pncpPublicacao", match[0])
  }

  // Dias úteis entre PNCP e sessão
  const diasPncpMatch = text.match(/(?:divulgação no pncp|publicação no pncp).*?(\d+)\s*dias?\s*úteis?/i)
  if (diasPncpMatch) {
    data.pncpPrazo = diasPncpMatch[1]
    addSource("pncpPrazo", diasPncpMatch[0])
  }

  // Inteiro teor no PNCP
  if (
    lowerText.includes("inteiro teor no pncp") ||
    lowerText.includes("publicação integral") ||
    lowerText.includes("publicacao integral")
  ) {
    data.pncpIntencao = "sim"
    const match = text.match(/inteiro teor no pncp[^.]{0,80}/i) || text.match(/publicação integral[^.]{0,80}/i)
    if (match) addSource("pncpIntencao", match[0])
  }

  // ========== ME/EPP (LC 123) ==========

  const hasNegation = (context: string): boolean => {
    const negationPatterns = [
      /não\s+(?:se\s+)?aplica/i,
      /não\s+haverá/i,
      /não\s+há/i,
      /não\s+será/i,
      /não\s+se\s+trata/i,
      /vedado/i,
      /vedada/i,
      /não\s+admitido/i,
      /não\s+admitida/i,
      /não\s+permitido/i,
      /não\s+permitida/i,
      /não\s+exigido/i,
      /não\s+exigida/i,
      /não\s+obrigatório/i,
      /não\s+obrigatória/i,
      /não\s+poderá/i,
      /não\s+pode/i,
    ]
    return negationPatterns.some((pattern) => pattern.test(context))
  }

  const meEppNegationPatterns = [
    /preferência\s*(?:me\/epp|microempresa)?\s*(?::)?\s*não/i,
    /não\s+se\s+aplica.*?(?:tratamento\s+favorecido|lc\s*123|me\/epp)/i,
    /(?:tratamento\s+favorecido|lc\s*123).*?não\s+se\s+aplica/i,
    /não\s+haverá.*?(?:tratamento\s+diferenciado|preferência.*?me)/i,
  ]

  let meEppExplicitlyDenied = false
  for (const pattern of meEppNegationPatterns) {
    const match = text.match(pattern)
    if (match) {
      meEppExplicitlyDenied = true
      data.preferenciaMe = "nao"
      data.exclusivaMe = "nao"
      data.criterioDesempateMe = "nao"
      data.cota25Me = "nao"
      addSource("preferenciaMe", match[0], 150)
      console.log("[v0] ME/EPP: Tratamento explicitamente negado:", match[0].substring(0, 100))
      break
    }
  }

  if (!meEppExplicitlyDenied) {
    // Preferência ME/EPP na capa
    const preferenciaCapaMatch = text.match(/preferência\s*(?:me\/epp)?\s*(?::)?\s*(sim|não)/i)
    if (preferenciaCapaMatch) {
      data.preferenciaMe = preferenciaCapaMatch[1].toLowerCase() === "sim" ? "sim" : "nao"
      addSource("preferenciaMe", preferenciaCapaMatch[0])
    } else {
      // Procurar indicadores positivos fortes
      const meEppPositiveMatch = text.match(
        /(?:aplicar|aplicará|aplica-se).*?(?:tratamento\s+(?:diferenciado|favorecido)|lc\s*123)/i,
      )
      if (meEppPositiveMatch) {
        const context = text.substring(
          Math.max(0, meEppPositiveMatch.index! - 100),
          Math.min(text.length, meEppPositiveMatch.index! + meEppPositiveMatch[0].length + 100),
        )
        if (!hasNegation(context)) {
          data.preferenciaMe = "sim"
          addSource("preferenciaMe", meEppPositiveMatch[0])
        }
      }
    }

    const exclusivoMatch = text.match(/(?:exclusiv[oa]|cota\s+reservada).*?(?:me\/epp|microempresa)/i)
    if (exclusivoMatch) {
      const context = text.substring(
        Math.max(0, exclusivoMatch.index! - 150),
        Math.min(text.length, exclusivoMatch.index! + exclusivoMatch[0].length + 150),
      )
      if (!hasNegation(context)) {
        data.exclusivaMe = "sim"
        addSource("exclusivaMe", exclusivoMatch[0])
      }
    }

    const cota25Match = text.match(/cota.*?(?:25|vinte\s+e\s+cinco)\s*%/i)
    if (cota25Match) {
      const context = text.substring(
        Math.max(0, cota25Match.index! - 150),
        Math.min(text.length, cota25Match.index! + cota25Match[0].length + 150),
      )
      // Verificar se não é divisível ou se há negação
      const notApplicable =
        hasNegation(context) ||
        context.toLowerCase().includes("não divisível") ||
        context.toLowerCase().includes("único item") ||
        context.toLowerCase().includes("item único")

      if (!notApplicable) {
        data.cota25Me = "sim"
        addSource("cota25Me", cota25Match[0])
      }
    }

    const desempateMatch = text.match(/desempate.*?(?:me\/epp|microempresa|lc\s*123)/i)
    if (desempateMatch) {
      const context = text.substring(
        Math.max(0, desempateMatch.index! - 150),
        Math.min(text.length, desempateMatch.index! + desempateMatch[0].length + 150),
      )
      if (!hasNegation(context)) {
        data.criterioDesempateMe = "sim"
        addSource("criterioDesempateMe", desempateMatch[0])
      }
    }
  }

  const subcontratacaoNegationMatch = text.match(
    /(?:contratado|licitante).*?não\s+poderá\s+subcontratar|subcontratação.*?(?:vedada|não\s+permitida)/i,
  )
  if (subcontratacaoNegationMatch) {
    data.subcontratacaoMe = "0%"
    addSource("subcontratacaoMe", subcontratacaoNegationMatch[0])
    console.log("[v0] Subcontratação: Vedada")
  } else {
    const subcontratacaoMatch = text.match(/subcontratação.*?(\d+)\s*%/i)
    if (subcontratacaoMatch) {
      const context = text.substring(
        Math.max(0, subcontratacaoMatch.index! - 150),
        Math.min(text.length, subcontratacaoMatch.index! + subcontratacaoMatch[0].length + 150),
      )
      if (!hasNegation(context)) {
        data.subcontratacaoMe = subcontratacaoMatch[1] + "%"
        addSource("subcontratacaoMe", subcontratacaoMatch[0])
      }
    }
  }

  // ========== GARANTIAS ==========

  const garantiaContratualNegationMatch = text.match(/não\s+haverá\s+exigência.*?garantia.*?contratual/i)
  if (garantiaContratualNegationMatch) {
    data.garantiaContratual = "0"
    addSource("garantiaContratual", garantiaContratualNegationMatch[0])
    console.log("[v0] Garantia Contratual: Não exigida")
  } else {
    const garantiaContratualMatch = text.match(/garantia\s+(?:da\s+)?contratual.*?(\d+)\s*%/i)
    if (garantiaContratualMatch) {
      const context = text.substring(
        Math.max(0, garantiaContratualMatch.index! - 150),
        Math.min(text.length, garantiaContratualMatch.index! + garantiaContratualMatch[0].length + 150),
      )
      if (!hasNegation(context)) {
        data.garantiaContratual = garantiaContratualMatch[1]
        addSource("garantiaContratual", garantiaContratualMatch[0])
      }
    }
  }

  const garantiaParticipacaoMatch = text.match(/garantia.*?(?:de\s+)?participação.*?(\d+)\s*%/i)
  if (garantiaParticipacaoMatch) {
    const context = text.substring(
      Math.max(0, garantiaParticipacaoMatch.index! - 150),
      Math.min(text.length, garantiaParticipacaoMatch.index! + garantiaParticipacaoMatch[0].length + 150),
    )
    if (!hasNegation(context)) {
      data.garantiaParticipacao = garantiaParticipacaoMatch[1]
      addSource("garantiaParticipacao", garantiaParticipacaoMatch[0])
    }
  }

  // ========== VISITA TÉCNICA, AMOSTRAS, DEMONSTRAÇÃO ==========

  const visitaMatch = text.match(/(?:visita|vistoria).*?(?:técnica|prévia|local)/i)
  if (visitaMatch) {
    const context = text.substring(
      Math.max(0, visitaMatch.index! - 200),
      Math.min(text.length, visitaMatch.index! + visitaMatch[0].length + 200),
    )

    data.visita = "sim"
    addSource("visita", visitaMatch[0])

    // Verificar se é obrigatória
    if (context.match(/obrigatória|imprescindível/i) && !hasNegation(context)) {
      data.visitaObrigatoria = "sim"
      const matchOb = text.match(/(?:visita|vistoria).*?obrigatória/i)
      if (matchOb) addSource("visitaObrigatoria", matchOb[0])
    } else if (context.match(/facultativa|opcional|não\s+obrigatória/i)) {
      data.visitaObrigatoria = "nao"
      const matchFac = text.match(/(?:visita|vistoria).*?(?:facultativa|opcional)/i)
      if (matchFac) addSource("visitaObrigatoria", matchFac[0])
    } else if (context.match(/declaração.*?conhecimento/i)) {
      // Pode substituir por declaração
      data.visitaObrigatoria = "nao"
      const matchDecl = text.match(/declaração.*?conhecimento/i)
      if (matchDecl) addSource("visitaObrigatoria", matchDecl[0])
    }
  }

  const demonstracaoMatch = text.match(/(?:demonstração|prova\s+de\s+conceito).*?(?:obrigatória|exigida)/i)
  if (demonstracaoMatch) {
    const context = text.substring(
      Math.max(0, demonstracaoMatch.index! - 150),
      Math.min(text.length, demonstracaoMatch.index! + demonstracaoMatch[0].length + 150),
    )
    if (!hasNegation(context)) {
      data.demonstracao = "sim"
      addSource("demonstracao", demonstracaoMatch[0])
    }
  }

  // ========== COOPERATIVAS E CONSÓRCIOS ==========

  // Cooperativas
  if (lowerText.includes("cooperativa")) {
    if (lowerText.includes("vedado") || lowerText.includes("vedada") || lowerText.includes("não admitida")) {
      data.cooperativas = "vedado"
      const match = text.match(/cooperativas?.*?vedadas?[^.]{0,80}/i)
      if (match) addSource("cooperativas", match[0])
    } else if (lowerText.includes("admitida") || lowerText.includes("permitida")) {
      data.cooperativas = "permitido"
      const match = text.match(/cooperativas?.*?(?:admitida|permitida)[^.]{0,80}/i)
      if (match) addSource("cooperativas", match[0])
    }
  }

  // Consórcio
  if (lowerText.includes("consórcio") || lowerText.includes("consorcio")) {
    if (lowerText.includes("vedado") || lowerText.includes("vedada") || lowerText.includes("não admitido")) {
      data.consorcio = "vedado"
      const match = text.match(/consórcio.*?vedado[^.]{0,80}/i)
      if (match) addSource("consorcio", match[0])
    } else if (lowerText.includes("admitido") || lowerText.includes("admite-se")) {
      data.consorcio = "permitido"
      const match = text.match(/consórcio.*?(?:admitido|admite-se)[^.]{0,80}/i)
      if (match) addSource("consorcio", match[0])
    }
  }

  // ========== AMOSTRAS ==========

  // Amostras
  if (lowerText.includes("amostra")) {
    data.amostras = "sim"
    const match = text.match(/amostra[^.]{0,80}/i)
    if (match) addSource("amostras", match[0])
  }

  console.log("[v0] Extracted data fields:", Object.keys(data).length)
  console.log("[v0] Extracted sources:", sources.length)

  return { data, sources }
}
