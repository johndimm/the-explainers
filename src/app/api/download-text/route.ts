import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    
    console.log('GET /api/download-text called with path:', path)
    console.log('Full URL:', request.url)
    
    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    // For GET requests, we expect a local path to a book file
    // This is used by the Library component for pre-loaded books
    try {
      const fs = require('fs')
      const pathModule = require('path')
      
      // Construct the full path to the book file
      // Remove leading slash and handle both src/data/library and public/public-domain-texts
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      let bookPath
      
      if (cleanPath.startsWith('public-domain-texts/')) {
        bookPath = pathModule.join(process.cwd(), 'public', cleanPath)
      } else {
        bookPath = pathModule.join(process.cwd(), 'src/data/library', cleanPath)
      }
      
      if (!fs.existsSync(bookPath)) {
        return NextResponse.json({ error: 'Book file not found' }, { status: 404 })
      }
      
      const text = fs.readFileSync(bookPath, 'utf-8')
      
      return NextResponse.json({ 
        text,
        contentType: 'text/plain',
        originalPath: path
      })
      
    } catch (error) {
      console.error('Error reading book file:', error)
      return NextResponse.json(
        { error: 'Failed to read book file' }, 
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error in GET download-text:', error)
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    )
  }
}

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