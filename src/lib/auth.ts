import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
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
  }
}
