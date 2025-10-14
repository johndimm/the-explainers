/**
 * Device ID generation utility
 * Creates a unique identifier for each device/browser instance
 */

const DEVICE_ID_KEY = 'explainer_device_id'

/**
 * Generate a unique device ID using crypto.randomUUID() if available,
 * or fallback to a combination of timestamp and random string
 */
function generateDeviceId(): string {
  // Try to use crypto.randomUUID() for better uniqueness
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID()
    } catch (error) {
      console.warn('crypto.randomUUID() failed, using fallback:', error)
    }
  }
  
  // Fallback: timestamp + random string + performance.now for better uniqueness
  const timestamp = Date.now().toString(36)
  const performanceTime = typeof performance !== 'undefined' ? performance.now().toString(36) : '0'
  const randomPart = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)
  
  return `device_${timestamp}_${performanceTime}_${randomPart}_${randomPart2}`
}

/**
 * Get or create a unique device ID for this browser instance
 * Stores the ID in localStorage so it persists across sessions
 */
export function getDeviceId(): string {
  // Debug logging disabled - uncomment for troubleshooting
  // console.log('🔍 getDeviceId called - window:', typeof window, 'localStorage:', typeof localStorage)
  // console.log('🔍 User agent:', navigator.userAgent)
  // console.log('🔍 Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder that will be replaced
    // console.log('🔍 Server-side, returning placeholder')
    return 'server-side-placeholder'
  }

  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, generating temporary device ID')
      const tempId = generateDeviceId()
      // console.log('🆔 Generated temporary device ID (no localStorage):', tempId)
      return tempId
    }

    // Test localStorage functionality (disabled for production)
    // try {
    //   const testKey = 'test_storage_' + Date.now()
    //   localStorage.setItem(testKey, 'test')
    //   const testValue = localStorage.getItem(testKey)
    //   localStorage.removeItem(testKey)
    //   console.log('🔍 localStorage test:', testValue === 'test' ? 'PASSED' : 'FAILED')
    // } catch (testError) {
    //   console.warn('❌ localStorage test failed:', testError)
    // }

    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    // Debug logging disabled
    // console.log('🔍 Retrieved from localStorage:', deviceId)
    // console.log('🔍 All localStorage keys:', Object.keys(localStorage))
    
    if (!deviceId) {
      // Generate new unique device ID
      deviceId = generateDeviceId()
      // Debug logging disabled
      // console.log('🆔 Generated new device ID:', deviceId)
      try {
        localStorage.setItem(DEVICE_ID_KEY, deviceId)
        // console.log('✅ Stored device ID in localStorage')
        // Verify it was stored
        const verifyId = localStorage.getItem(DEVICE_ID_KEY)
        // console.log('🔍 Verification - stored ID:', verifyId, 'matches:', verifyId === deviceId)
      } catch (storageError) {
        console.warn('❌ Failed to store device ID in localStorage:', storageError)
      }
    } else {
      // Debug logging disabled
      // console.log('🆔 Using existing device ID:', deviceId)
    }
    
    return deviceId
  } catch (error) {
    // If localStorage fails, generate a temporary ID
    console.warn('❌ Failed to access localStorage, using temporary device ID:', error)
    const tempId = generateDeviceId()
    // console.log('🆔 Generated temporary device ID (error):', tempId)
    return tempId
  }
}

/**
 * Reset the device ID (useful for testing or if user wants to start fresh)
 */
export function resetDeviceId(): string {
  if (typeof window === 'undefined') {
    return generateDeviceId()
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY)
    const newDeviceId = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, newDeviceId)
    console.log('🔄 Reset device ID to:', newDeviceId)
    return newDeviceId
  } catch (error) {
    console.warn('Failed to reset device ID in localStorage')
    return generateDeviceId()
  }
}

/**
 * Get device ID without creating one (returns null if none exists)
 */
export function getExistingDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return localStorage.getItem(DEVICE_ID_KEY)
  } catch (error) {
    return null
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use getDeviceId() instead
 */
export function getUniqueUserAgent(): string {
  return getDeviceId()
}