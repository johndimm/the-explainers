import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

console.log('🔐 NextAuth Environment Check:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  timestamp: new Date().toISOString(),
  // Additional debugging for mobile
  userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
  isMobile: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 'server'
})

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Add explicit redirect URI for debugging
      authorization: {
        params: {
          prompt: "select_account", // Force account selection
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      console.log('🔐 NextAuth session callback:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenSub: token?.sub,
        sessionUser: session?.user,
        timestamp: new Date().toISOString()
      })
      // Add user ID to session
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      console.log('🔐 NextAuth JWT callback:', {
        hasToken: !!token,
        hasUser: !!user,
        tokenSub: token?.sub,
        user: user?.email,
        timestamp: new Date().toISOString()
      })
      // Persist user ID in token
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  // Mobile-specific configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Ensure proper mobile handling
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
})

export { handler as GET, handler as POST }
