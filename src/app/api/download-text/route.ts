import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Security: Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are allowed' }, { status: 400 })
    }

    // Fetch the text content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Explainer-App/1.0'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    
    // Check if content is text-based
    if (!contentType.includes('text/') && !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'URL does not return text content' }, 
        { status: 400 }
      )
    }

    const text = await response.text()
    
    return NextResponse.json({ 
      text,
      contentType,
      originalUrl: url
    })
    
  } catch (error) {
    console.error('Error downloading text:', error)
    return NextResponse.json(
      { error: 'Failed to download text from URL' }, 
      { status: 500 }
    )
  }
}