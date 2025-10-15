export interface PageMap {
  pages: string[]
  pageRanges: Array<{ start: number; end: number; pageIndex: number }>
}

export const calculatePageContent = (
  text: string, 
  pageHeight: number, 
  lineHeight: number, 
  charsPerLine: number
): PageMap => {
  const pages: string[] = []
  const pageRanges: Array<{ start: number; end: number; pageIndex: number }> = []
  const lines = text.split('\n')
  let currentPage: string[] = []
  let currentHeight = 0
  let currentStartPos = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Calculate how many lines this text will actually take up
    const estimatedLines = Math.max(1, Math.ceil(line.length / charsPerLine))
    const lineHeightPx = estimatedLines * lineHeight
    
    if (currentHeight + lineHeightPx > pageHeight) {
      // Current page is full, start a new one
      if (currentPage.length > 0) {
        const pageContent = currentPage.join('\n')
        pages.push(pageContent)
        pageRanges.push({
          start: currentStartPos,
          end: currentStartPos + pageContent.length,
          pageIndex: pages.length - 1
        })
        currentPage = []
        currentHeight = 0
        currentStartPos += pageContent.length
      }
      
      // If a single line is too long for a page, split it
      if (lineHeightPx > pageHeight) {
        // Split the long line into chunks that fit on a page
        let remainingLine = line
        while (remainingLine.length > 0) {
          const charsThatFit = Math.floor((pageHeight / lineHeight) * charsPerLine)
          const chunk = remainingLine.substring(0, charsThatFit)
          pages.push(chunk)
          pageRanges.push({
            start: currentStartPos,
            end: currentStartPos + chunk.length,
            pageIndex: pages.length - 1
          })
          currentStartPos += chunk.length
          remainingLine = remainingLine.substring(charsThatFit)
        }
        currentHeight = 0
      } else {
        currentPage = [line]
        currentHeight = lineHeightPx
      }
    } else {
      currentPage.push(line)
      currentHeight += lineHeightPx
    }
  }
  
  // Add the last page if it has content
  if (currentPage.length > 0) {
    const pageContent = currentPage.join('\n')
    pages.push(pageContent)
    pageRanges.push({
      start: currentStartPos,
      end: currentStartPos + pageContent.length,
      pageIndex: pages.length - 1
    })
  }
  
  return { pages, pageRanges }
}

export const findPageForPosition = (position: number, pageMap: PageMap): number => {
  for (let i = 0; i < pageMap.pageRanges.length; i++) {
    const range = pageMap.pageRanges[i]
    if (position >= range.start && position < range.end) {
      return range.pageIndex
    }
  }
  return Math.max(0, pageMap.pageRanges.length - 1)
}

export const findPageForPositionLegacy = (text: string, position: number, pages: string[]): number => {
  if (pages.length === 0) return 0
  
  let currentPos = 0
  for (let i = 0; i < pages.length; i++) {
    const pageLength = pages[i].length
    if (position >= currentPos && position < currentPos + pageLength) {
      return i
    }
    currentPos += pageLength
  }
  
  return Math.max(0, pages.length - 1)
}

export const findPageByContent = (searchText: string, pages: string[]): number => {
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].includes(searchText)) {
      return i
    }
  }
  return 0
}

export const findPageBySearchResult = (
  searchResult: { index: number; length: number }, 
  text: string, 
  pages: string[]
): number => {
  const searchText = text.slice(searchResult.index, searchResult.index + searchResult.length)
  return findPageByContent(searchText, pages)
}

export const convertToPagePosition = (
  fullTextPosition: number, 
  pageMap: PageMap
): { pageIndex: number; pagePosition: number } => {
  const pageIndex = findPageForPosition(fullTextPosition, pageMap)
  const range = pageMap.pageRanges[pageIndex]
  const pagePosition = fullTextPosition - range.start
  return { pageIndex, pagePosition }
}

export const convertToPagePositionLegacy = (
  fullTextPosition: number, 
  pages: string[]
): { pageIndex: number; pagePosition: number } => {
  const pageIndex = findPageForPositionLegacy('', fullTextPosition, pages)
  let currentPos = 0
  for (let i = 0; i < pageIndex; i++) {
    currentPos += pages[i].length
  }
  const pagePosition = fullTextPosition - currentPos
  return { pageIndex, pagePosition }
}
