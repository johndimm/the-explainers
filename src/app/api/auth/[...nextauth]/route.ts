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
    async redirect({ url, baseUrl }) {
      console.log('🔐 NextAuth redirect callback:', {
        url,
        baseUrl,
        isAbsoluteUrl: url.startsWith('http'),
        shouldRedirectToBase: url.startsWith(baseUrl),
        finalUrl: url.startsWith(baseUrl) ? url : `${baseUrl}${url}`,
        timestamp: new Date().toISOString()
      })
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
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

// Add request logging wrapper
const loggedHandler = {
  GET: async (req: any, context: any) => {
    console.log('🔐 NextAuth GET request:', {
      url: req.url,
      method: req.method,
      headers: {
        'user-agent': req.headers.get('user-agent'),
        'referer': req.headers.get('referer'),
        'origin': req.headers.get('origin')
      },
      timestamp: new Date().toISOString()
    })
    return handler.GET(req, context)
  },
  POST: async (req: any, context: any) => {
    console.log('🔐 NextAuth POST request:', {
      url: req.url,
      method: req.method,
      headers: {
        'user-agent': req.headers.get('user-agent'),
        'referer': req.headers.get('referer'),
        'origin': req.headers.get('origin')
      },
      timestamp: new Date().toISOString()
    })
    return handler.POST(req, context)
  }
}

export { loggedHandler as GET, loggedHandler as POST }
