import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

function getModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required")
  }

  console.log("[v0] Using OpenAI directly with API key")
  return openai("gpt-4o-mini")
}

export async function extractDataWithAI(text: string) {
  console.log("[v0] Starting AI-based data extraction")

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: z.object({
        registroPreco: z.enum(["sim", "nao"]),
        objetoDescricao: z.string().optional(),
        valorLicitacao: z.string().optional(),
        criterioJulgamento: z.string().optional(),
        modoDisputa: z.string().optional(),
        modalidade: z.string().optional(),
        tipoLicitacao: z.string().optional(),
        preferenciaMe: z.enum(["sim", "nao"]).optional(),
        cotaMe: z.enum(["sim", "nao"]).optional(),
        cooperativas: z.enum(["permitido", "vedado", "nao_mencionado"]).optional(),
        consorcio: z.enum(["permitido", "vedado", "nao_mencionado"]).optional(),
        pncpPublicacao: z.enum(["sim", "nao"]).optional(),
        pncpPrazo: z.string().optional(),
        pncpIntencao: z.enum(["sim", "nao", "nao_aplicavel"]).optional(),
        pncpPrazoIntencao: z.string().optional(),
        orcamentoSigiloso: z.enum(["sim", "nao"]).optional(),
        prazoRecursal: z.string().optional(),
      }),
      prompt: `Analise o seguinte edital de licitação e extraia as informações solicitadas.

IMPORTANTE sobre Registro de Preços:
- Se o documento mencionar explicitamente "não se trata de licitação para registro de preços" ou "não se aplica", marque como "nao"
- Se o objeto da licitação mencionar "registro de preços" ou "ata de registro de preços", marque como "sim"
- Ignore menções no sumário ou índice

IMPORTANTE sobre ME/EPP:
- Verifique se há negação explícita do tratamento favorecido
- Procure por "não se aplica" ou "vedado" antes de marcar como "sim"

Texto do edital:
${text.substring(0, 15000)}

Extraia as informações com precisão, identificando o contexto correto de cada campo.`,
    })

    console.log("[v0] AI data extraction complete")
    return object
  } catch (error: any) {
    if (error?.message?.includes("insufficient_quota")) {
      console.log("[v0] OpenAI quota exceeded - need to add credits to OpenAI account")
      throw new Error("QUOTA_EXCEEDED: OpenAI account needs credits")
    }
    console.log("[v0] AI data extraction error:", error?.message || "Unknown error")
    throw error
  }
}

export async function extractStructureWithAI(text: string) {
  console.log("[v0] Starting AI-based structure extraction")

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: z.object({
        items: z.array(
          z.object({
            number: z.string(),
            title: z.string(),
            content: z.string().optional(),
          }),
        ),
      }),
      prompt: `Analise o seguinte edital de licitação e extraia a estrutura de itens e subitens.

Identifique:
- Itens principais (ex: "1. DO OBJETO", "2. DO REGISTRO DE PREÇOS")
- Subitens (ex: "1.1.", "2.1.", "3.5.1")

Texto do edital:
${text.substring(0, 15000)}

Retorne a estrutura organizada com número, título e conteúdo de cada item.`,
    })

    console.log("[v0] AI structure extraction complete:", object.items.length, "items found")
    return object.items
  } catch (error: any) {
    if (error?.message?.includes("insufficient_quota")) {
      console.log("[v0] OpenAI quota exceeded - need to add credits to OpenAI account")
      throw new Error("QUOTA_EXCEEDED: OpenAI account needs credits")
    }
    console.log("[v0] AI structure extraction error:", error?.message || "Unknown error")
    throw error
  }
}
