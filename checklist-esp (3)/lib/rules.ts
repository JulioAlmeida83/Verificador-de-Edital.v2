import type { FormData, RuleResult } from "./types"

export function validateRules(data: FormData): RuleResult[] {
  const rules: RuleResult[] = []

  // ========================================
  // 1. DADOS INICIAIS E CRITÉRIOS FUNDAMENTAIS
  // ========================================

  // Rule 1: Critério de Julgamento definido
  if (data.criterioJulgamento) {
    rules.push({
      id: "rule-1",
      title: "Critério de Julgamento",
      status: "ok",
      message: `Critério definido: ${data.criterioJulgamento}`,
      legal: "Art. 33, Lei 14.133/2021",
      sourceContext: "Critério de Julgamento",
      editalReference: "Item do cabeçalho do edital",
    })
  } else {
    rules.push({
      id: "rule-1",
      title: "Critério de Julgamento",
      status: "warning",
      message: "Critério de julgamento não identificado",
      legal: "Art. 33, Lei 14.133/2021",
      guidance: "Deve ser selecionado: menor preço ou maior desconto",
      sourceContext: "Critério de Julgamento",
      editalReference: "Item do cabeçalho do edital",
    })
  }

  // Rule 2: Modo de Disputa definido
  if (data.modoDisputa) {
    rules.push({
      id: "rule-2",
      title: "Modo de Disputa",
      status: "ok",
      message: `Modo definido: ${data.modoDisputa}`,
      legal: "Art. 56, Lei 14.133/2021",
      sourceContext: "Modo de Disputa",
      editalReference: "Item do cabeçalho do edital",
    })
  } else {
    rules.push({
      id: "rule-2",
      title: "Modo de Disputa",
      status: "warning",
      message: "Modo de disputa não identificado",
      legal: "Art. 56, Lei 14.133/2021",
      guidance: "Deve ser selecionado: aberto, aberto e fechado, ou fechado e aberto",
      sourceContext: "Modo de Disputa",
      editalReference: "Item do cabeçalho do edital",
    })
  }

  // Rule 3: Preferência ME/EPP definida
  if (data.preferenciaMe === "sim") {
    rules.push({
      id: "rule-3",
      title: "Preferência ME/EPP",
      status: "ok",
      message: "Tratamento diferenciado para ME/EPP previsto",
      legal: "LC 123/2006, Art. 44",
      sourceContext: "Preferência ME/EPP",
      editalReference: "Item do cabeçalho do edital",
    })
  } else if (data.preferenciaMe === "nao") {
    rules.push({
      id: "rule-3",
      title: "Preferência ME/EPP",
      status: "warning",
      message: "Ausência de tratamento diferenciado para ME/EPP",
      legal: "LC 123/2006, Art. 44",
      guidance: "Verifique se há justificativa legal para não aplicação",
      sourceContext: "Preferência ME/EPP",
      editalReference: "Item do cabeçalho do edital",
    })
  }

  // ========================================
  // 2. REGISTRO DE PREÇOS
  // ========================================

  // Rule 4: Registro de Preços definido
  if (data.registroPreco === "sim") {
    rules.push({
      id: "rule-4",
      title: "Registro de Preços",
      status: "ok",
      message: "Licitação para registro de preços",
      legal: "Art. 82, Lei 14.133/2021",
      sourceContext: "Registro de Preço",
      editalReference: "Item 2 do edital - DO REGISTRO DE PREÇOS",
    })
  } else if (data.registroPreco === "nao") {
    rules.push({
      id: "rule-4",
      title: "Registro de Preços",
      status: "ok",
      message: "Licitação NÃO é para registro de preços",
      legal: "Art. 82, Lei 14.133/2021",
      sourceContext: "Registro de Preço",
      editalReference: "Item 2.1 do edital - disciplina não se aplica",
    })
  }

  // Rule 5: Intenção de Registro no PNCP
  if (data.registroPreco === "sim") {
    if (data.pncpIntencao === "sim") {
      rules.push({
        id: "rule-5",
        title: "Intenção de Registro no PNCP",
        status: "ok",
        message: "Intenção de registro publicada no PNCP",
        legal: "Art. 82, Lei 14.133/2021",
        sourceContext: "PNCP - Intenção",
        editalReference: "Item 2.2 do edital - Registro de Preços",
      })
    } else {
      rules.push({
        id: "rule-5",
        title: "Intenção de Registro no PNCP",
        status: "warning",
        message: "Registro de preços sem intenção publicada no PNCP",
        legal: "Art. 82, Lei 14.133/2021",
        guidance: "Deve haver publicação da intenção no PNCP com antecedência mínima de 8 dias",
        sourceContext: "PNCP - Intenção",
        editalReference: "Item 2.2 do edital - Registro de Preços",
      })
    }
  }

  // Rule 6: Prazo Intenção PNCP
  if (data.registroPreco === "sim" && data.pncpIntencao === "sim") {
    const prazoIntencao = Number.parseInt(data.pncpPrazoIntencao) || 0
    if (prazoIntencao >= 8) {
      rules.push({
        id: "rule-6",
        title: "Prazo Intenção PNCP",
        status: "ok",
        message: `Prazo de ${prazoIntencao} dias adequado`,
        legal: "Art. 82, §1º, Lei 14.133/2021",
        sourceContext: "PNCP - Prazo Intenção",
        editalReference: "Item 2.2 do edital - prazos",
      })
    } else if (prazoIntencao > 0) {
      rules.push({
        id: "rule-6",
        title: "Prazo Intenção PNCP",
        status: "warning",
        message: `Prazo de ${prazoIntencao} dias inferior ao mínimo de 8 dias`,
        legal: "Art. 82, §1º, Lei 14.133/2021",
        guidance: "O prazo deve ser de no mínimo 8 dias úteis",
        sourceContext: "PNCP - Prazo Intenção",
        editalReference: "Item 2.2 do edital - prazos",
      })
    }
  }

  // ========================================
  // 3. PARTICIPAÇÃO E TRATAMENTO FAVORECIDO
  // ========================================

  // Rule 7: Cooperativas
  if (data.cooperativas === "vedado") {
    rules.push({
      id: "rule-7",
      title: "Participação de Cooperativas",
      status: "warning",
      message: "Vedação à participação de cooperativas",
      legal: "Art. 48, §3º, Lei 14.133/2021",
      guidance: "Verifique se há justificativa técnica para vedação",
      sourceContext: "Cooperativas",
      editalReference: "Item 3.10 do edital - DA PARTICIPAÇÃO",
    })
  } else if (data.cooperativas === "permitido") {
    rules.push({
      id: "rule-7",
      title: "Participação de Cooperativas",
      status: "ok",
      message: "Participação de cooperativas permitida",
      legal: "Art. 48, §3º, Lei 14.133/2021",
      sourceContext: "Cooperativas",
      editalReference: "Item 3.11 do edital - DA PARTICIPAÇÃO",
    })
  }

  // Rule 8: Consórcios
  if (data.consorcio === "vedado") {
    rules.push({
      id: "rule-8",
      title: "Participação de Consórcios",
      status: "warning",
      message: "Vedação à participação de consórcios",
      legal: "Art. 15, Lei 14.133/2021",
      guidance: "Verifique se há justificativa para vedação",
      sourceContext: "Consórcio",
      editalReference: "Item 3.12 do edital - DA PARTICIPAÇÃO",
    })
  } else if (data.consorcio === "permitido") {
    rules.push({
      id: "rule-8",
      title: "Participação de Consórcios",
      status: "ok",
      message: "Participação de consórcios permitida",
      legal: "Art. 15, Lei 14.133/2021",
      guidance:
        "Verifique se há exigência de acréscimo de 10% a 30% na habilitação econômico-financeira (item 8.1.4.1)",
      sourceContext: "Consórcio",
      editalReference: "Item 3.13 do edital - DA PARTICIPAÇÃO",
    })
  }

  // Rule 9: Tratamento Favorecido ME/EPP - Participação Exclusiva
  if (data.exclusivaMe === "sim") {
    rules.push({
      id: "rule-9",
      title: "Participação Exclusiva ME/EPP",
      status: "ok",
      message: "Itens com participação exclusiva de ME/EPP",
      legal: "LC 123/2006, Art. 48, I",
      sourceContext: "Exclusiva ME/EPP",
      editalReference: "Item 3.5.1 do edital - Tratamento Favorecido",
    })
  }

  // Rule 10: Cota 25% ME/EPP
  if (data.cota25Me === "sim") {
    rules.push({
      id: "rule-10",
      title: "Cota 25% ME/EPP",
      status: "ok",
      message: "Cota de até 25% reservada para ME/EPP",
      legal: "LC 123/2006, Art. 48, III",
      sourceContext: "Cota 25% ME/EPP",
      editalReference: "Item 3.5.2 do edital - Tratamento Favorecido",
    })
  } else if (data.cota25Me === "nao" && data.preferenciaMe === "sim") {
    rules.push({
      id: "rule-10",
      title: "Cota 25% ME/EPP",
      status: "warning",
      message: "Preferência ME/EPP sem cota de 25%",
      legal: "LC 123/2006, Art. 48, III",
      guidance: "Verifique a possibilidade de reserva de cota",
      sourceContext: "Cota 25% ME/EPP",
      editalReference: "Item 3.5 do edital - Tratamento Favorecido",
    })
  }

  // ========================================
  // 4. PREENCHIMENTO DA PROPOSTA
  // ========================================

  // Rule 11: Especificações vinculam o licitante
  rules.push({
    id: "rule-11",
    title: "Vinculação das Especificações",
    status: "ok",
    message: "Todas as especificações da proposta vinculam o licitante",
    legal: "Art. 63, Lei 14.133/2021",
    sourceContext: "Proposta",
    editalReference: "Item 5.2 do edital - DA PROPOSTA",
  })

  // Rule 12: Registro de Preços - Quantitativo Inferior
  if (data.registroPreco === "sim") {
    rules.push({
      id: "rule-12",
      title: "Quantitativo Inferior (Registro de Preços)",
      status: "ok",
      message: "Verifique se o licitante pode oferecer quantitativo inferior ao máximo previsto",
      legal: "Art. 82, Lei 14.133/2021",
      guidance:
        "Deve estar definido no item 5.2.1 se o licitante NÃO ou PODERÁ oferecer proposta em quantitativo inferior",
      sourceContext: "Registro de Preço",
      editalReference: "Item 5.2.1 do edital - DA PROPOSTA",
    })
  }

  // ========================================
  // 5. ETAPA DE LANCES
  // ========================================

  // Rule 13: Intervalo Mínimo entre Lances
  if (data.intervaloMinimo) {
    rules.push({
      id: "rule-13",
      title: "Intervalo Mínimo entre Lances",
      status: "ok",
      message: `Intervalo mínimo definido: ${data.intervaloMinimo}`,
      legal: "Art. 56, Lei 14.133/2021",
      sourceContext: "Intervalo Mínimo",
      editalReference: "Item 6.8 do edital - DA ETAPA DE LANCES",
    })
  } else {
    rules.push({
      id: "rule-13",
      title: "Intervalo Mínimo entre Lances",
      status: "warning",
      message: "Intervalo mínimo entre lances não identificado",
      legal: "Art. 56, Lei 14.133/2021",
      guidance: "Deve ser definido o intervalo mínimo de diferença entre lances",
      sourceContext: "Intervalo Mínimo",
      editalReference: "Item 6.8 do edital - DA ETAPA DE LANCES",
    })
  }

  // Rule 14: Modo de Disputa e Itens Correspondentes
  if (data.modoDisputa === "aberto") {
    rules.push({
      id: "rule-14",
      title: "Modo de Disputa Aberto",
      status: "ok",
      message: "Modo aberto - verifique redação do item 6.11",
      legal: "Art. 56, Lei 14.133/2021",
      sourceContext: "Modo de Disputa",
      editalReference: "Item 6.11 do edital - Modo Aberto",
    })
  } else if (data.modoDisputa === "aberto-fechado") {
    rules.push({
      id: "rule-14",
      title: "Modo de Disputa Aberto e Fechado",
      status: "ok",
      message: "Modo aberto e fechado - verifique redação do item 6.12",
      legal: "Art. 56, Lei 14.133/2021",
      sourceContext: "Modo de Disputa",
      editalReference: "Item 6.12 do edital - Modo Aberto e Fechado",
    })
  } else if (data.modoDisputa === "fechado-aberto") {
    rules.push({
      id: "rule-14",
      title: "Modo de Disputa Fechado e Aberto",
      status: "ok",
      message: "Modo fechado e aberto - verifique redação do item 6.13",
      legal: "Art. 56, Lei 14.133/2021",
      guidance: "Verifique se a descrição está coerente com o critério de julgamento",
      sourceContext: "Modo de Disputa",
      editalReference: "Item 6.13 do edital - Modo Fechado e Aberto",
    })
  }

  // Rule 15: Negociação
  rules.push({
    id: "rule-15",
    title: "Negociação de Preços",
    status: "ok",
    message: "Verifique condição para negociação no item 6.22",
    legal: "Art. 59, Lei 14.133/2021",
    guidance: "A condição deve ser ajustada ao critério: proposta acima do preço máximo ou inferior ao desconto mínimo",
    sourceContext: "Critério de Julgamento",
    editalReference: "Item 6.22 do edital - DA ETAPA DE LANCES",
  })

  // ========================================
  // 6. JULGAMENTO DA PROPOSTA
  // ========================================

  // Rule 16: Inexequibilidade e Sobrepreço
  rules.push({
    id: "rule-16",
    title: "Inexequibilidade e Sobrepreço",
    status: "ok",
    message: "Verifique regra aplicável: geral (item 7.8) ou serviços de engenharia (item 7.9)",
    legal: "Art. 59, §2º, Lei 14.133/2021",
    guidance: "Regra geral: inexequível se inferior a 50% do valor orçado. Engenharia: inferior a 75%",
    sourceContext: "Critério de Julgamento",
    editalReference: "Itens 7.8 ou 7.9 do edital - DO JULGAMENTO",
  })

  // Rule 17: Serviços Contínuos com Mão de Obra
  rules.push({
    id: "rule-17",
    title: "Serviços Contínuos",
    status: "ok",
    message: "Se aplicável, verifique item 7.10 sobre serviços contínuos",
    legal: "Art. 59, Lei 14.133/2021",
    guidance: "Deve indicar acordo/dissídio/convenção coletiva utilizada no cálculo (item 7.10.3)",
    sourceContext: "Tipo de Licitação",
    editalReference: "Item 7.10 do edital - DO JULGAMENTO",
  })

  // Rule 18: Amostras
  if (data.amostras === "sim") {
    rules.push({
      id: "rule-18",
      title: "Exigência de Amostras",
      status: "ok",
      message: "Amostras exigidas conforme Anexos",
      legal: "Art. 63, Lei 14.133/2021",
      sourceContext: "Amostras",
      editalReference: "Item 7.15 do edital - DO JULGAMENTO",
    })
  }

  // Rule 19: Demonstração/Prova de Conceito
  if (data.demonstracao === "sim") {
    rules.push({
      id: "rule-19",
      title: "Prova de Conceito",
      status: "ok",
      message: "Prova de conceito exigida conforme Anexos",
      legal: "Art. 63, Lei 14.133/2021",
      sourceContext: "Demonstração",
      editalReference: "Item 7.16 do edital - DO JULGAMENTO",
    })
  }

  // ========================================
  // 7. HABILITAÇÃO E FORMALIZAÇÃO
  // ========================================

  // Rule 20: Vistoria Prévia
  if (data.visitaObrigatoria === "sim") {
    rules.push({
      id: "rule-20",
      title: "Vistoria Prévia Obrigatória",
      status: "ok",
      message: "Vistoria prévia obrigatória - exige atestado",
      legal: "Art. 63, Lei 14.133/2021",
      sourceContext: "Visita Obrigatória",
      editalReference: "Item 8.1.3 do edital - DA HABILITAÇÃO",
    })
  } else if (data.visita === "sim" && data.visitaObrigatoria === "nao") {
    rules.push({
      id: "rule-20",
      title: "Vistoria Prévia Facultativa",
      status: "ok",
      message: "Vistoria prévia facultativa - não exige atestado",
      legal: "Art. 63, Lei 14.133/2021",
      sourceContext: "Visita",
      editalReference: "Item 8.1.2 do edital - DA HABILITAÇÃO",
    })
  }

  // Rule 21: Habilitação ME/EPP - Regularidade Fiscal
  if (data.preferenciaMe === "sim") {
    rules.push({
      id: "rule-21",
      title: "Habilitação ME/EPP",
      status: "ok",
      message: "ME/EPP comprovam regularidade fiscal apenas para contratação",
      legal: "LC 123/2006, Art. 43",
      guidance: "Prazo de 5 dias úteis para regularização, prorrogável por igual período",
      sourceContext: "Preferência ME/EPP",
      editalReference: "Item 8.15 do edital - DA HABILITAÇÃO",
    })
  }

  // Rule 22: Garantia de Participação
  if (data.garantiaParticipacao === "sim") {
    rules.push({
      id: "rule-22",
      title: "Garantia de Participação",
      status: "ok",
      message: "Garantia de participação exigida",
      legal: "Art. 96, Lei 14.133/2021",
      sourceContext: "Garantia de Participação",
      editalReference: "Item da habilitação sobre garantias",
    })
  }

  // Rule 23: Garantia Contratual
  if (data.garantiaContratual === "sim") {
    rules.push({
      id: "rule-23",
      title: "Garantia Contratual",
      status: "ok",
      message: "Garantia contratual exigida",
      legal: "Art. 96, Lei 14.133/2021",
      sourceContext: "Garantia Contratual",
      editalReference: "Item do contrato sobre garantias",
    })
  }

  // Rule 24: Formalização da Contratação
  rules.push({
    id: "rule-24",
    title: "Formalização da Contratação",
    status: "ok",
    message: "Verifique instrumento de formalização no item 14.2.1",
    legal: "Art. 95, Lei 14.133/2021",
    guidance: "Deve ser escolhido: assinatura de Termo de Contrato ou emissão de nota de empenho",
    sourceContext: "Tipo de Licitação",
    editalReference: "Item 14.2.1 do edital - DA FORMALIZAÇÃO",
  })

  // ========================================
  // 8. PUBLICAÇÃO E PRAZOS
  // ========================================

  // Rule 25: Publicação no PNCP
  if (data.pncpPublicacao === "sim") {
    rules.push({
      id: "rule-25",
      title: "Publicação no PNCP",
      status: "ok",
      message: "Edital será publicado no PNCP",
      legal: "Art. 54, Lei 14.133/2021",
      sourceContext: "PNCP - Publicação",
      editalReference: "Requisito de publicação",
    })
  } else {
    rules.push({
      id: "rule-25",
      title: "Publicação no PNCP",
      status: "warning",
      message: "Publicação no PNCP não identificada",
      legal: "Art. 54, Lei 14.133/2021",
      guidance: "A publicação no PNCP é obrigatória",
      sourceContext: "PNCP - Publicação",
      editalReference: "Requisito de publicação",
    })
  }

  // Rule 26: Prazo PNCP
  if (data.pncpPublicacao === "sim") {
    const prazo = Number.parseInt(data.pncpPrazo) || 0
    if (prazo >= 8) {
      rules.push({
        id: "rule-26",
        title: "Prazo de Publicação PNCP",
        status: "ok",
        message: `Prazo de ${prazo} dias adequado`,
        legal: "Art. 54, §1º, Lei 14.133/2021",
        sourceContext: "PNCP - Prazo",
        editalReference: "Requisito de prazo",
      })
    } else if (prazo > 0) {
      rules.push({
        id: "rule-26",
        title: "Prazo de Publicação PNCP",
        status: "warning",
        message: `Prazo de ${prazo} dias inferior ao mínimo de 8 dias úteis`,
        legal: "Art. 54, §1º, Lei 14.133/2021",
        guidance: "O prazo mínimo é de 8 dias úteis",
        sourceContext: "PNCP - Prazo",
        editalReference: "Requisito de prazo",
      })
    }
  }

  // Rule 27: Prazo Recursal
  const prazoRecursal = Number.parseInt(data.prazoRecursal) || 0
  if (prazoRecursal >= 3) {
    rules.push({
      id: "rule-27",
      title: "Prazo Recursal",
      status: "ok",
      message: `Prazo de ${prazoRecursal} dias adequado`,
      legal: "Art. 165, Lei 14.133/2021",
      sourceContext: "Prazo Recursal",
      editalReference: "Item sobre recursos",
    })
  } else if (prazoRecursal > 0) {
    rules.push({
      id: "rule-27",
      title: "Prazo Recursal",
      status: "warning",
      message: `Prazo de ${prazoRecursal} dias inferior ao mínimo de 3 dias úteis`,
      legal: "Art. 165, Lei 14.133/2021",
      guidance: "O prazo mínimo é de 3 dias úteis",
      sourceContext: "Prazo Recursal",
      editalReference: "Item sobre recursos",
    })
  }

  // ========================================
  // 9. ORÇAMENTO E VALOR
  // ========================================

  // Rule 28: Orçamento Sigiloso
  if (data.orcamentoSigiloso === "sim") {
    if (data.criterioJulgamento === "menor-preco" || data.criterioJulgamento === "maior-desconto") {
      rules.push({
        id: "rule-28",
        title: "Orçamento Sigiloso",
        status: "ok",
        message: "Orçamento sigiloso permitido para o critério escolhido",
        legal: "Art. 24, §1º, Lei 14.133/2021",
        sourceContext: "Orçamento Sigiloso",
        editalReference: "Item sobre orçamento",
      })
    } else {
      rules.push({
        id: "rule-28",
        title: "Orçamento Sigiloso",
        status: "warning",
        message: "Orçamento sigiloso em critério inadequado",
        legal: "Art. 24, §1º, Lei 14.133/2021",
        guidance: "Orçamento sigiloso só é permitido em menor preço ou maior desconto",
        sourceContext: "Orçamento Sigiloso",
        editalReference: "Item sobre orçamento",
      })
    }
  }

  // Rule 29: Valor da Licitação
  if (data.valorLicitacao) {
    rules.push({
      id: "rule-29",
      title: "Valor da Licitação",
      status: "ok",
      message: `Valor estimado: R$ ${data.valorLicitacao}`,
      legal: "Art. 24, Lei 14.133/2021",
      sourceContext: "Valor da Licitação",
      editalReference: "Capa do edital",
    })
  }

  // Rule 30: Orçamento Público
  if (data.orcamentoPublico === "sim" && data.orcamentoSigiloso !== "sim") {
    rules.push({
      id: "rule-30",
      title: "Orçamento Público",
      status: "ok",
      message: "Orçamento estimado divulgado publicamente",
      legal: "Art. 24, Lei 14.133/2021",
      sourceContext: "Orçamento Público",
      editalReference: "Item sobre orçamento",
    })
  }

  return rules
}
