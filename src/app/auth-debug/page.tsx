'use client'

import { useSession } from 'next-auth/react'
import { useTheme } from '@/hooks/useTheme'

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const theme = useTheme()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Session Status</h2>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Authenticated:</strong> {session ? 'Yes' : 'No'}</p>
        </div>

        {session && (
          <div>
            <h2 className="text-xl font-semibold mb-2">User Info</h2>
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Image:</strong> {session.user?.image}</p>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
          <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Not set'}</p>
          <p><strong>NEXT_PUBLIC_BASE_URL:</strong> {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}</p>
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side'}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">App Configuration</h2>
          <p><strong>App Name:</strong> {theme.appName}</p>
          <p><strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}</p>
          <p><strong>Single Play Mode:</strong> {theme.isSinglePlay ? 'Yes' : 'No'}</p>
          <p><strong>Play Title:</strong> {theme.playTitle}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Google OAuth Debug</h2>
          <p><strong>Google Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}</p>
          <p><strong>Google Client Secret:</strong> {process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set'}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
          <div className="bg-yellow-100 p-4 rounded">
            <p className="font-semibold">If sign-in is not working:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Check that Google OAuth is configured for this domain</li>
              <li>Verify the redirect URI includes this domain</li>
              <li>Make sure the app is running on the correct URL</li>
              <li>Check browser console for errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}