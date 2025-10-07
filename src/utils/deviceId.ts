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
    return crypto.randomUUID()
  }
  
  // Fallback: timestamp + random string
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `device_${timestamp}_${randomPart}`
}

/**
 * Get or create a unique device ID for this browser instance
 * Stores the ID in localStorage so it persists across sessions
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder that will be replaced
    return 'server-side-placeholder'
  }

  try {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      // Generate new unique device ID
      deviceId = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
      console.log('🆔 Generated new device ID:', deviceId)
    } else {
      console.log('🆔 Using existing device ID:', deviceId)
    }
    
    return deviceId
  } catch (error) {
    // If localStorage fails, generate a temporary ID
    console.warn('Failed to access localStorage, using temporary device ID')
    return generateDeviceId()
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