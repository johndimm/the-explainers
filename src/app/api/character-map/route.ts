import { NextRequest, NextResponse } from 'next/server';
import { generateCharacterMapFromText, formatCharacterMapAsText, exportCharacterMapAsJSON } from '@/utils/characterMapGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, format = 'json' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Generate character map
    const result = generateCharacterMapFromText(text);

    // Return in requested format
    if (format === 'text') {
      const textOutput = formatCharacterMapAsText(result);
      return new NextResponse(textOutput, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } else if (format === 'json') {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "json" or "text"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating character map:', error);
    return NextResponse.json(
      { error: 'Failed to generate character map' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Character Map Generator API',
    usage: {
      method: 'POST',
      body: {
        text: 'The dramatic text to analyze',
        format: 'json | text (optional, defaults to json)'
      },
      examples: {
        json: {
          text: 'ACT I.\nSCENE I.\nEnter Orsino, Duke of Illyria...',
          format: 'json'
        },
        text: {
          text: 'ACT I.\nSCENE I.\nEnter Orsino, Duke of Illyria...',
          format: 'text'
        }
      }
    }
  });
}
