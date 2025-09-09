import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
          // Add state parameter for better mobile handling
          state: "mobile_auth"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken as string
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle mobile redirects properly
      log('NextAuth redirect callback:', { url, baseUrl })
      
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        log('NextAuth redirect: relative URL ->', redirectUrl)
        return redirectUrl
      }
      
      // If it's an absolute URL from the same origin, use it
      if (url.startsWith(baseUrl)) {
        log('NextAuth redirect: same origin URL ->', url)
        return url
      }
      
      // Default to base URL
      log('NextAuth redirect: default to baseUrl ->', baseUrl)
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    error: '/auth/signin', // Redirect errors back to sign-in
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure proper session handling
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add events for debugging
  events: {
    signOut: async (message) => {
      console.log('NextAuth signOut event:', message)
    },
    session: async (message) => {
      console.log('NextAuth session event:', message)
    }
  },
  // Mobile-specific configuration
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
  // Add debug configuration for mobile
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      log('NextAuth Error:', { code, metadata })
    },
    warn(code) {
      log('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      log('NextAuth Debug:', { code, metadata })
    }
  }
}
