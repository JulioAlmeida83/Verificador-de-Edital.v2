import { type NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"
import { extractDataWithAI, extractStructureWithAI } from "./extract-with-ai"
import { extractDataFromText } from "./extract-data-from-text"
import { extractDocumentStructure } from "./extract-document-structure"

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = new PizZip(buffer)
    const documentXml = zip.file("word/document.xml")?.asText()

    if (!documentXml) {
      throw new Error("Could not find document.xml in the Word file")
    }

    const paragraphs: string[] = []
    const paragraphRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gs
    const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/g

    let paragraphMatch
    while ((paragraphMatch = paragraphRegex.exec(documentXml)) !== null) {
      const paragraphContent = paragraphMatch[1]
      const texts: string[] = []

      let textMatch
      while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
        const text = textMatch[1]
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim()

        if (text) {
          texts.push(text)
        }
      }

      if (texts.length > 0) {
        paragraphs.push(texts.join(" "))
      }
    }

    let fullText = paragraphs.join("\n")

    fullText = fullText.replace(/<[^>]+>/g, "")

    fullText = fullText.replace(/\s+/g, " ").replace(/\n\s+/g, "\n").trim()

    console.log("[v0] Extracted", paragraphs.length, "paragraphs")
    console.log("[v0] Total text length:", fullText.length)
    console.log("[v0] First 500 chars (clean):", fullText.substring(0, 500))

    return fullText
  } catch (error) {
    console.error("[v0] Error extracting text from docx:", error)
    throw new Error(
      `Failed to extract text from Word document: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    console.log("[v0] Processing file:", file.name, "Size:", file.size, "Type:", file.type)

    const fileNameLower = file.name.toLowerCase()
    const isWord = fileNameLower.endsWith(".doc") || fileNameLower.endsWith(".docx")

    if (!isWord) {
      return NextResponse.json(
        {
          error: "Por favor, envie um arquivo Word (.doc ou .docx).",
        },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log("[v0] Extracting text from Word document")
    const extractedText = await extractTextFromDocx(buffer)
    console.log("[v0] Word text extracted, length:", extractedText.length)

    if (!extractedText || extractedText.length < 100) {
      return NextResponse.json(
        {
          error: "Não foi possível extrair texto suficiente do documento. Verifique se o arquivo não está corrompido.",
        },
        { status: 400 },
      )
    }

    let documentStructure: Array<{ number: string; title: string; content: string }> = []
    let extractedData: any = {}
    let sources: Array<{ field: string; value: string; itemNumber: string; itemTitle: string }> = []
    let extractionMethod = "AI"
    let aiWarning: string | undefined

    try {
      console.log("[v0] Attempting AI-based structure extraction")
      documentStructure = await extractStructureWithAI(extractedText)
      console.log("[v0] AI structure extraction successful:", documentStructure.length, "items found")

      console.log("[v0] Attempting AI-based data extraction")
      extractedData = await extractDataWithAI(extractedText)
      console.log("[v0] AI data extraction successful:", Object.keys(extractedData).length, "fields found")

      // Generate sources from AI-extracted data
      sources = Object.entries(extractedData)
        .filter(([_, value]) => value)
        .map(([field, value]) => ({
          field,
          value: String(value),
          itemNumber: "Conforme edital",
          itemTitle: "Extraído por IA",
        }))
    } catch (aiError) {
      console.log("[v0] AI extraction failed, falling back to regex-based extraction")
      console.log("[v0] AI error:", aiError instanceof Error ? aiError.message : "Unknown error")
      extractionMethod = "Regex"

      if (aiError instanceof Error) {
        if (aiError.message.includes("QUOTA_EXCEEDED")) {
          aiWarning =
            "A extração com IA falhou porque sua conta OpenAI não tem créditos suficientes. Adicione créditos em https://platform.openai.com/account/billing para usar IA. O sistema usou extração baseada em regex como alternativa."
        } else if (aiError.message.includes("OPENAI_API_KEY")) {
          aiWarning =
            "A extração com IA falhou porque a variável de ambiente OPENAI_API_KEY não está configurada. Configure a chave da API OpenAI nas variáveis de ambiente do seu projeto Vercel. O sistema usou extração baseada em regex como alternativa."
        } else {
          aiWarning = "A extração com IA falhou. O sistema usou extração baseada em regex como alternativa."
        }
      }

      // Fallback to regex-based extraction
      console.log("[v0] Extracting document structure with regex")
      documentStructure = extractDocumentStructure(extractedText)
      console.log("[v0] Regex structure extraction complete:", documentStructure.length, "items found")

      console.log("[v0] Extracting data with regex")
      const regexResult = extractDataFromText(extractedText, documentStructure)
      extractedData = regexResult.data
      sources = regexResult.sources
      console.log("[v0] Regex data extraction complete:", Object.keys(extractedData).length, "fields found")
    }

    console.log("[v0] Extraction method used:", extractionMethod)

    return NextResponse.json({
      success: true,
      extractedData,
      sources,
      textLength: extractedText.length,
      documentStructure,
      extractionMethod,
      ...(aiWarning && { aiWarning }),
    })
  } catch (error) {
    console.error("[v0] Error parsing document:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar documento",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
