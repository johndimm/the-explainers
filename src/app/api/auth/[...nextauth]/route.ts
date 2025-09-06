import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

console.log('🔐 NextAuth Environment Check:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
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
    async signIn({ user, account, profile }) {
      console.log('🔐 NextAuth signIn callback:', {
        hasUser: !!user,
        hasAccount: !!account,
        hasProfile: !!profile,
        userEmail: user?.email,
        userName: user?.name,
        userId: user?.id,
        accountProvider: account?.provider,
        timestamp: new Date().toISOString()
      })
      
      // Always allow sign in for debugging
      console.log('🔐 Allowing sign in')
      return true
    },
    async session({ session, token }) {
      console.log('🔐 NextAuth session callback:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenSub: token?.sub,
        sessionUser: session?.user,
        sessionUserEmail: session?.user?.email,
        sessionUserName: session?.user?.name,
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
        userEmail: user?.email,
        userName: user?.name,
        userId: user?.id,
        timestamp: new Date().toISOString()
      })
      // Persist user ID in token
      if (user) {
        token.sub = user.id
        console.log('🔐 Setting token.sub to:', user.id)
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      console.log('🔐 NextAuth redirect callback:', {
        url,
        baseUrl,
        isAbsoluteUrl: url.startsWith('http'),
        shouldRedirectToBase: url.startsWith(baseUrl),
        finalUrl: url.startsWith(baseUrl) ? url : `${baseUrl}${url}`,
        timestamp: new Date().toISOString()
      })
      
      // Always redirect to library after successful login
      console.log('🔐 Redirecting to library after successful login')
      return `${baseUrl}/library`
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
  },
  // Add production-specific mobile configuration
  logger: {
    error: (code, metadata) => {
      console.error('🔐 NextAuth Error:', { code, metadata, timestamp: new Date().toISOString() })
    },
    warn: (code) => {
      console.warn('🔐 NextAuth Warning:', { code, timestamp: new Date().toISOString() })
    },
    debug: (code, metadata) => {
      console.log('🔐 NextAuth Debug:', { code, metadata, timestamp: new Date().toISOString() })
    }
  }
})

export { handler as GET, handler as POST }
