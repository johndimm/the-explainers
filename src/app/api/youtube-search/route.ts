import { NextRequest, NextResponse } from 'next/server'
import { log, error } from '@/utils/log'

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

async function searchYouTube(searchQuery: string) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
    log('youtube', 'Searching YouTube URL:', searchUrl)
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const html = await response.text()
    
    // Extract video IDs from the HTML response
    // YouTube embeds video data in JSON within the HTML
    const videoIds: string[] = []
    const videoTitles: string[] = []
    
    // Look for video IDs in the HTML (they appear in various patterns)
    const videoIdMatches = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)
    const titleMatches = html.match(/"title":{"runs":\[{"text":"([^"]+)"/g)
    
    if (videoIdMatches && videoIdMatches.length > 0) {
      // Extract the first few video IDs
      for (let i = 0; i < Math.min(3, videoIdMatches.length); i++) {
        const match = videoIdMatches[i].match(/\/watch\?v=([a-zA-Z0-9_-]{11})/)
        if (match) {
          videoIds.push(match[1])
        }
      }
    }
    
    if (titleMatches && titleMatches.length > 0) {
      for (let i = 0; i < Math.min(3, titleMatches.length); i++) {
        const match = titleMatches[i].match(/"title":{"runs":\[{"text":"([^"]+)"/)
        if (match) {
          videoTitles.push(match[1].replace(/\\u0026/g, '&'))
        }
      }
    }
    
    log('youtube','Found video IDs:', videoIds)
    log('youtube','Found video titles:', videoTitles)
    
    const videos = videoIds.map((id, index) => ({
      id,
      title: videoTitles[index] || `Video ${index + 1}`,
      description: `YouTube search result for: ${searchQuery}`
    }))
    
    return videos
    
  } catch (err) {
    error('YouTube search error:', err instanceof Error ? err.message : String(err))
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, bookTitle, author } = await req.json()
    
    log('api', '🎬 YOUTUBE API CALLED:', { query, bookTitle, author })
    
    // Use the query as-is from the frontend (it's already been enhanced with context)
    const searchTerms = query
    
    log('youtube','YouTube search terms (using frontend query):', searchTerms)
    
    // Try the dynamic search first
    let videos = await searchYouTube(searchTerms)
    
    // If dynamic search fails, fall back to curated videos for famous quotes
    if (videos.length === 0) {
      log('youtube','Dynamic search failed, checking for famous quotes...')
      
      // Curated videos for very famous quotes (as backup when search fails)
      if (bookTitle.toLowerCase().includes('hamlet') && 
          (query.toLowerCase().includes('to be or not to be') || query.toLowerCase().includes('to be, or not to be'))) {
        videos = [{
          id: 'MiWf4I6bOcA',
          title: 'Hamlet - "To be, or not to be" - Laurence Olivier',
          description: 'The famous soliloquy from Hamlet by William Shakespeare'
        }]
      } else if (bookTitle.toLowerCase().includes('macbeth') && 
                 (query.toLowerCase().includes('dagger') || query.toLowerCase().includes('handle toward my hand'))) {
        videos = [{
          id: 'iOjf9S4alv0',
          title: 'Macbeth - "Is this a dagger..." - Patrick Stewart',
          description: 'The dagger soliloquy from Macbeth by William Shakespeare'
        }]
      } else if (bookTitle.toLowerCase().includes('julius caesar') &&
                 (query.toLowerCase().includes('brutus') || query.toLowerCase().includes('et tu'))) {
        videos = [{
          id: 'kAF6-mMDY4M',
          title: 'Et Tu, Brute? - Julius Caesar',
          description: 'The famous betrayal scene from Julius Caesar by William Shakespeare'
        }]
      } else if (bookTitle.toLowerCase().includes('king henry iv')) {
        videos = [{
          id: 'JW21UIlkwF0',
          title: 'King Henry IV, Part 1 by William Shakespeare',
          description: 'Full performance of King Henry IV, Part 1 by William Shakespeare'
        }]
      }
      
      // If still no videos, try searching for general book content
      if (videos.length === 0) {
        log('youtube','No quote-specific videos found, trying general book search...')
        const bookVideos = await searchYouTube(`${bookTitle} ${author} performance scene`)
        
        // Only show book videos if they seem relevant (contain book title AND Shakespeare)
        const relevantVideos = bookVideos.filter(video => {
          const titleLower = video.title.toLowerCase()
          const hasShakespeare = titleLower.includes('shakespeare')
          
          // For "King Henry IV" type titles, be more specific
          let hasBookTitle = false
          if (bookTitle.toLowerCase().includes('king henry')) {
            hasBookTitle = titleLower.includes('king henry') || 
                          titleLower.includes('henry iv') || 
                          titleLower.includes('henry 4') ||
                          titleLower.includes('henry part') ||
                          titleLower.includes('1 henry') ||
                          titleLower.includes('2 henry')
          } else {
            hasBookTitle = titleLower.includes(bookTitle.toLowerCase().split(' ')[0])
          }
          
          return hasBookTitle && hasShakespeare
        })
        
        if (relevantVideos.length > 0) {
          log('youtube',`Found ${relevantVideos.length} relevant videos for ${bookTitle}`)
          videos = relevantVideos.slice(0, 1) // Take just the first relevant one
        } else {
          // Last resort: try a very short excerpt
          videos = await searchYouTube(`${bookTitle} ${author} ${query.substring(0, 20)}`)
        }
      }
    }
    
    // Prioritize videos that match act and scene numbers if available
    if (videos.length > 1) {
      // Check if we have act/scene info in the original query to look for
      const actMatch = searchTerms.match(/Act\s+([IVXLCDM]+|\d+)/i)
      const sceneMatch = searchTerms.match(/Scene\s+([IVXLCDM]+|\d+)/i)
      
      if (actMatch && sceneMatch) {
        const actNumber = actMatch[1]
        const sceneNumber = sceneMatch[1]
        
        log('youtube',`Looking for videos matching Act ${actNumber}, Scene ${sceneNumber}`)
        
        // Score videos based on title matches
        const scoredVideos = videos.map(video => {
          let score = 0
          const title = video.title.toLowerCase()
          
          // High priority: exact act and scene match
          if (title.includes(`act ${actNumber.toLowerCase()}`) && title.includes(`scene ${sceneNumber.toLowerCase()}`)) {
            score += 10
          }
          // Medium priority: act match only
          else if (title.includes(`act ${actNumber.toLowerCase()}`)) {
            score += 5
          }
          // Medium priority: scene match only  
          else if (title.includes(`scene ${sceneNumber.toLowerCase()}`)) {
            score += 5
          }
          
          // Bonus for Roman numerals (often more accurate for Shakespeare)
          if (title.match(/act\s+[ivxlcdm]+/i) || title.match(/scene\s+[ivxlcdm]+/i)) {
            score += 2
          }
          
          return { ...video, score }
        })
        
        // Sort by score (highest first)
        scoredVideos.sort((a, b) => b.score - a.score)
        
        log('youtube','Video scores:', scoredVideos.map(v => ({ title: v.title, score: v.score })))
        
        videos = scoredVideos
      }
    }
    
    log('youtube','Final video results:', videos.slice(0, 1))
    
    return NextResponse.json({
      success: true,
      query: searchTerms,
      videos: videos.slice(0, 1) // Return the highest-scored result
    }, { headers: corsHeaders })
    
  } catch (err) {
    error('YouTube search error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search YouTube',
        videos: []
      },
      { status: 500, headers: corsHeaders }
    )
  }
}