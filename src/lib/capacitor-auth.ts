// Capacitor-specific authentication handling
import { Capacitor } from '@capacitor/core'

export async function signInWithGoogle() {
  if (!Capacitor.isNativePlatform()) {
    // For web, use regular NextAuth
    const { signIn } = await import('next-auth/react')
    return signIn('google')
  }

  // For mobile, use window.open with _system
  try {
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(redirectUrl)}`
    
    window.open(googleAuthUrl, '_system')
    
  } catch (error) {
    console.error('Capacitor auth error:', error)
    throw error
  }
}

export async function signOut() {
  if (!Capacitor.isNativePlatform()) {
    // For web, use regular NextAuth
    const { signOut } = await import('next-auth/react')
    return signOut()
  }

  // For mobile, redirect to home
  try {
    window.location.href = '/'
  } catch (error) {
    console.error('Capacitor signout error:', error)
  }
}