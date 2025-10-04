'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function SignInTestPage() {
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    // Get current session
    getSession().then(session => {
      setSession(session)
    })

    // Collect debug info
    setDebugInfo({
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      origin: window.location.origin,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      isCapacitor: (window as any).Capacitor ? true : false,
      platform: (window as any).Capacitor?.getPlatform ? (window as any).Capacitor.getPlatform() : 'web'
    })
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/reader'
      })
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        setSession(await getSession())
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sign-In Test</h1>
      
      <div className="space-y-6">
        {/* Current Status */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Current Status</h2>
          <p><strong>Session:</strong> {session ? '✅ Signed In' : '❌ Not Signed In'}</p>
          {session && (
            <div className="mt-2">
              <p><strong>User:</strong> {session.user?.name}</p>
              <p><strong>Email:</strong> {session.user?.email}</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Sign In Button */}
        <div className="text-center">
          <button
            onClick={handleGoogleSignIn}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Google Sign-In
          </button>
        </div>

        {/* Debug Information */}
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Platform:</strong> {debugInfo.platform}</p>
            <p><strong>Is Capacitor:</strong> {debugInfo.isCapacitor ? 'Yes' : 'No'}</p>
            <p><strong>Current URL:</strong> {debugInfo.currentUrl}</p>
            <p><strong>Origin:</strong> {debugInfo.origin}</p>
            <p><strong>Protocol:</strong> {debugInfo.protocol}</p>
            <p><strong>Hostname:</strong> {debugInfo.hostname}</p>
            <p><strong>Port:</strong> {debugInfo.port || 'None'}</p>
            <p><strong>Pathname:</strong> {debugInfo.pathname}</p>
          </div>
        </div>

        {/* User Agent */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">User Agent</h2>
          <p className="text-sm break-all">{debugInfo.userAgent}</p>
        </div>

        {/* Troubleshooting Tips */}
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Troubleshooting Tips</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Make sure Google OAuth is configured for this domain</li>
            <li>Check that the redirect URI includes this domain</li>
            <li>Try clearing browser cache and cookies</li>
            <li>Check browser console for errors</li>
            <li>Ensure the app is running on the correct URL</li>
          </ul>
        </div>
      </div>
    </div>
  )
}