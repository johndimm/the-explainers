// Debug utility for controlled logging
// Set DEBUG_ENABLED to false to disable all logs, or configure specific categories

const DEBUG_ENABLED = true // Enable debug logs for text selection troubleshooting

// Enable/disable specific debug categories
const DEBUG_CATEGORIES = {
  CHAT: false,
  PROFILE: false,
  READER: true,
  SEARCH: false,
  NAVIGATION: false,
  STORAGE: false,
  SELECTION: false,
  BOOK: false,
  CREDITS: false,
  MENU: false,
  SCROLL: false,
  TOUCH: false,
  API: false,
  CONTEXT: false,
  LAYOUT: false
} as const

type DebugCategory = keyof typeof DEBUG_CATEGORIES

/**
 * Controlled console.log wrapper
 * @param category - The debug category (e.g., 'CHAT', 'PROFILE', etc.)
 * @param message - The message to log
 * @param data - Optional additional data to log
 */
export const debugLog = (category: DebugCategory, message: string, ...data: any[]) => {
  if (!DEBUG_ENABLED || !DEBUG_CATEGORIES[category]) {
    return
  }
  
  // Clean output - just the message
  if (data.length > 0) {
    console.log(message, ...data)
  } else {
    console.log(message)
  }
}

/**
 * Enable/disable specific debug categories at runtime
 */
export const setDebugCategory = (category: DebugCategory, enabled: boolean) => {
  (DEBUG_CATEGORIES as any)[category] = enabled
}

/**
 * Enable/disable all debug logging
 */
export const setDebugEnabled = (enabled: boolean) => {
  // This would require modifying DEBUG_ENABLED, but since it's const,
  // this is more for documentation. In practice, change DEBUG_ENABLED above.
  console.log(`Debug logging ${enabled ? 'enabled' : 'disabled'}. Modify DEBUG_ENABLED in debug.ts for persistent changes.`)
}

/**
 * Quick helpers for common debug scenarios
 */
export const debugChat = (message: string, ...data: any[]) => debugLog('CHAT', message, ...data)
export const debugProfile = (message: string, ...data: any[]) => debugLog('PROFILE', message, ...data)
export const debugReader = (message: string, ...data: any[]) => debugLog('READER', message, ...data)
export const debugSearch = (message: string, ...data: any[]) => debugLog('SEARCH', message, ...data)
export const debugNavigation = (message: string, ...data: any[]) => debugLog('NAVIGATION', message, ...data)
export const debugStorage = (message: string, ...data: any[]) => debugLog('STORAGE', message, ...data)
export const debugSelection = (message: string, ...data: any[]) => debugLog('SELECTION', message, ...data)
export const debugBook = (message: string, ...data: any[]) => debugLog('BOOK', message, ...data)
export const debugContext = (message: string, ...data: any[]) => debugLog('CONTEXT', message, ...data)
export const debugCredits = (message: string, ...data: any[]) => debugLog('CREDITS', message, ...data)