// Capacitor-specific authentication handling
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export async function signInWithGoogle() {
  if (!Capacitor.isNativePlatform()) {
    // For web, use regular NextAuth
    const { signIn } = await import('next-auth/react')
    return signIn('google')
  }

  // For mobile, use Capacitor Browser plugin
  try {
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(redirectUrl)}`
    
    await Browser.open({ url: googleAuthUrl })
    
    // Listen for the callback
    Browser.addListener('browserFinished', () => {
      // Check if authentication was successful
      window.location.reload()
    })
    
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

  // For mobile, clear any stored auth data
  try {
    await Browser.close()
    window.location.href = '/'
  } catch (error) {
    console.error('Capacitor signout error:', error)
  }
}