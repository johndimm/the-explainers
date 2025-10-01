import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// For static export compatibility
export async function generateStaticParams() {
  return [
    { nextauth: ['signin'] },
    { nextauth: ['callback'] },
    { nextauth: ['signout'] },
    { nextauth: ['session'] },
    { nextauth: ['csrf'] },
    { nextauth: ['providers'] }
  ]
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
