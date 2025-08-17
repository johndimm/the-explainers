import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Security: Only allow JSON files from the library directory
    if (!filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Only JSON files allowed' }, { status: 400 })
    }

    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = join(process.cwd(), 'src', 'data', 'library', filename)
    
    try {
      const fileContent = readFileSync(filePath, 'utf8')
      const jsonData = JSON.parse(fileContent)
      
      return NextResponse.json(jsonData)
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
  } catch (error) {
    console.error('Error serving library file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}