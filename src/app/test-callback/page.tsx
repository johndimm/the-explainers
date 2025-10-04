'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestCallback() {
  const searchParams = useSearchParams()
  const [callbackData, setCallbackData] = useState<any>(null)

  useEffect(() => {
    // Get all URL parameters
    const params: any = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    setCallbackData({
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      params: params,
      userAgent: navigator.userAgent,
      isCapacitor: !!(window as any).Capacitor,
      platform: (window as any).Capacitor?.getPlatform ? (window as any).Capacitor.getPlatform() : 'web'
    })
  }, [searchParams])

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      background: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a1a1a'
        }}>
          OAuth Callback Test
        </h1>
        
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Callback Information
          </h2>
          
          <div style={{
            display: 'grid',
            gap: '10px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <div><strong>URL:</strong> {callbackData?.url || 'Loading...'}</div>
            <div><strong>Origin:</strong> {callbackData?.origin || 'Loading...'}</div>
            <div><strong>Pathname:</strong> {callbackData?.pathname || 'Loading...'}</div>
            <div><strong>Search:</strong> {callbackData?.search || 'Loading...'}</div>
            <div><strong>Hash:</strong> {callbackData?.hash || 'Loading...'}</div>
            <div><strong>Platform:</strong> {callbackData?.platform || 'Loading...'}</div>
            <div><strong>Is Capacitor:</strong> {callbackData?.isCapacitor ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div style={{
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1976d2'
          }}>
            URL Parameters
          </h2>
          
          {callbackData?.params ? (
            <div style={{
              display: 'grid',
              gap: '8px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {Object.entries(callbackData.params).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {String(value)}
                </div>
              ))}
            </div>
          ) : (
            <div>Loading parameters...</div>
          )}
        </div>

        <div style={{
          background: '#fff3e0',
          border: '1px solid #ff9800',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#f57c00'
          }}>
            Test OAuth Flow
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                const baseUrl = window.location.origin
                const authUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(baseUrl + '/test-callback')}`
                window.location.href = authUrl
              }}
              style={{
                padding: '10px 20px',
                background: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Test Google Sign-in
            </button>
            
            <button
              onClick={() => {
                const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
                const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/test-callback')}`
                window.location.href = authUrl
              }}
              style={{
                padding: '10px 20px',
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Test Production Sign-in
            </button>
          </div>
        </div>

        <div style={{
          background: '#f3e5f5',
          border: '1px solid #9c27b0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#7b1fa2'
          }}>
            Debug Information
          </h2>
          
          <div style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            background: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            <pre>{JSON.stringify(callbackData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}