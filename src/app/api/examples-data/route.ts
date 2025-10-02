import { NextResponse } from 'next/server'
import { log } from '@/utils/log'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'examples-data.json')
    const fileContent = readFileSync(filePath, 'utf8')
    const examplesData = JSON.parse(fileContent)
    
    return NextResponse.json(examplesData)
  } catch (error) {
    log('api','Error reading examples data:', error)
    return NextResponse.json(
      { error: 'Failed to load examples data' },
      { status: 500 }
    )
  }
}
