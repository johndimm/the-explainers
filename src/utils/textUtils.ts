export const buildFlexibleRegex = (query: string): RegExp | null => {
  const trimmed = query.trim()
  if (!trimmed) return null
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tokens = trimmed
    .split(/[\s\u00A0,.;:!?\-—–'"“”'']+/)
    .filter(Boolean)
    .map(escapeRegex)
  if (tokens.length === 0) return null
  const sep = "[\\s\\u00A0,.;:!?\\-—–'\"''']*"
  const pattern = tokens.join(sep)
  try {
    return new RegExp(pattern, 'gi')
  } catch {
    return null
  }
}

export const estimateCharsPerLine = (containerWidth: number, fontSize: number, fontFamily: string): number => {
  // Rough estimation based on average character width
  const avgCharWidth = fontSize * 0.6 // Approximate character width
  return Math.floor(containerWidth / avgCharWidth)
}

export const findTextPosition = (text: string, searchText: string, startIndex: number = 0): number => {
  return text.indexOf(searchText, startIndex)
}

export const extractTextAroundPosition = (text: string, position: number, contextLength: number = 100): string => {
  const start = Math.max(0, position - contextLength)
  const end = Math.min(text.length, position + contextLength)
  return text.slice(start, end)
}
