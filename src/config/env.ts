// Client-side environment configuration for Android builds
// This file is used when BUILD_NATIVE=true (static export mode)

export const ENV = {
  GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
  DATABASE_URL: process.env.NEXT_PUBLIC_DATABASE_URL || '',
}

// For development, fall back to server-side env vars
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // In development, we can access server-side env vars
  // This is handled by Next.js API routes
}