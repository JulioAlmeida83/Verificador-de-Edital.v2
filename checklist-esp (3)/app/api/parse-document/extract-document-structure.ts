export interface DocumentItem {
  number: string // e.g., "3.1", "3.1.1", "4.2.3"
  title: string
  content: string
  level: number // 1 for main items, 2 for subitems, etc.
}

export function extractDocumentStructure(text: string): DocumentItem[] {
  const items: DocumentItem[] = []

  console.log("[v0] Starting document structure extraction, text length:", text.length)
  console.log("[v0] First 1000 chars:", text.substring(0, 1000))

  // Main sections: "1. DO OBJETO" or "1. DA PARTICIPAÇÃO"
  const mainSectionPattern =
    /(?:^|\n)(\d+)\.\s+(D[AO]S?\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s]{3,80}?)(?=\s*\n|\s*$)/gim

  // Subitems: "1.1." or "1.1 " followed by text (more flexible)
  const subitemPattern = /(?:^|\n)(\d+\.\d+(?:\.\d+)*)\.\s*([^\n]{5,300}?)(?=\s*\n|\s*$)/gim

  // Alternative pattern for items without "DO/DA" prefix
  const altMainPattern = /(?:^|\n)(\d+)\.\s+([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][^\n]{10,100}?)(?=\s*\n|\s*$)/gim

  const seenNumbers = new Set<string>()

  // Try main section pattern first
  let match
  while ((match = mainSectionPattern.exec(text)) !== null) {
    const number = match[1]
    const title = match[2].trim()

    // Skip if already seen or title is too short
    if (seenNumbers.has(number) || title.length < 5) continue
    seenNumbers.add(number)

    // Find content until next section
    const startIndex = match.index + match[0].length
    const nextSectionPattern = new RegExp(`\\n${Number.parseInt(number) + 1}\\.\\s+`, "i")
    const restOfText = text.substring(startIndex)
    const nextMatch = restOfText.search(nextSectionPattern)
    const endIndex = nextMatch !== -1 ? startIndex + nextMatch : Math.min(startIndex + 5000, text.length)
    const content = text.substring(startIndex, endIndex).trim()

    items.push({
      number,
      title,
      content,
      level: 1,
    })

    console.log(`[v0] Found main section ${number}: "${title.substring(0, 60)}"`)
  }

  // Extract subitems
  subitemPattern.lastIndex = 0
  while ((match = subitemPattern.exec(text)) !== null) {
    const number = match[1]
    let title = match[2].trim()

    // Clean up title - remove trailing punctuation and extra spaces
    title = title.replace(/[.,;:]+$/, "").trim()

    // Skip if title is too short, looks like noise, contains XML, or already seen
    if (
      title.length < 5 ||
      /^[\d\s.,]+$/.test(title) ||
      title.includes("<") ||
      title.includes("PAGEREF") ||
      seenNumbers.has(number)
    )
      continue

    seenNumbers.add(number)

    const level = (number.match(/\./g) || []).length + 1

    // Find content until next item
    const startIndex = match.index + match[0].length
    const nextItemPattern = /\n\d+\.\d+(?:\.\d+)*\./
    const restOfText = text.substring(startIndex)
    const nextMatch = restOfText.search(nextItemPattern)
    const endIndex = nextMatch !== -1 ? startIndex + nextMatch : Math.min(startIndex + 2000, text.length)
    const content = text.substring(startIndex, endIndex).trim()

    items.push({
      number,
      title,
      content,
      level,
    })

    console.log(`[v0] Found subitem ${number}: "${title.substring(0, 60)}"`)
  }

  // If we found very few items, try alternative pattern
  if (items.length < 5) {
    console.log("[v0] Few items found, trying alternative pattern")
    altMainPattern.lastIndex = 0
    while ((match = altMainPattern.exec(text)) !== null) {
      const number = match[1]
      const title = match[2].trim()

      // Skip if already seen, too short, or looks like noise
      if (
        seenNumbers.has(number) ||
        title.length < 10 ||
        /^[\d\s.,]+$/.test(title) ||
        title.includes("<") ||
        title.includes("PAGEREF")
      )
        continue

      seenNumbers.add(number)

      const startIndex = match.index + match[0].length
      const nextSectionPattern = new RegExp(`\\n${Number.parseInt(number) + 1}\\.\\s+`, "i")
      const restOfText = text.substring(startIndex)
      const nextMatch = restOfText.search(nextSectionPattern)
      const endIndex = nextMatch !== -1 ? startIndex + nextMatch : Math.min(startIndex + 3000, text.length)
      const content = text.substring(startIndex, endIndex).trim()

      items.push({
        number,
        title,
        content,
        level: 1,
      })

      console.log(`[v0] Found alternative section ${number}: "${title.substring(0, 60)}"`)
    }
  }

  // Sort by item number
  items.sort((a, b) => {
    const aParts = a.number.split(".").map(Number)
    const bParts = b.number.split(".").map(Number)

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aNum = aParts[i] || 0
      const bNum = bParts[i] || 0
      if (aNum !== bNum) return aNum - bNum
    }
    return 0
  })

  console.log(`[v0] Total items extracted: ${items.length}`)
  if (items.length > 0) {
    console.log(
      "[v0] First 10 items:",
      items.slice(0, 10).map((i) => `${i.number}. ${i.title.substring(0, 40)}`),
    )
  }

  return items
}

// Helper function to find the most relevant item for a given text snippet
export function findRelevantItem(snippet: string, items: DocumentItem[]): DocumentItem | null {
  if (items.length === 0) {
    console.log("[v0] No items available for matching")
    return null
  }

  const lowerSnippet = snippet.toLowerCase()

  // Try to find exact match in content
  for (const item of items) {
    if (item.content.toLowerCase().includes(lowerSnippet)) {
      console.log(`[v0] Found exact match in item ${item.number}`)
      return item
    }
  }

  // Try to find partial match in title or content
  const words = lowerSnippet.split(/\s+/).filter((w) => w.length > 4)
  let bestMatch: { item: DocumentItem; score: number } | null = null

  for (const item of items) {
    const itemText = (item.title + " " + item.content).toLowerCase()
    let score = 0

    for (const word of words) {
      if (itemText.includes(word)) {
        score++
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { item, score }
    }
  }

  if (bestMatch) {
    console.log(`[v0] Found best match in item ${bestMatch.item.number} with score ${bestMatch.score}`)
  } else {
    console.log("[v0] No match found for snippet")
  }

  return bestMatch ? bestMatch.item : null
}
