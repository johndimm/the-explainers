// List of enabled log labels - only these will show in console
const ENABLED_LABELS: string[] = ['debug', 'mobile', 'bookmark', 'ui', 'desktop']

// Mobile console element reference
let mobileConsoleElement: HTMLDivElement | null = null

// Function to set mobile console element
export const setMobileConsole = (element: HTMLDivElement | null) => {
  mobileConsoleElement = element
}

// Check if we're on mobile
const isMobile = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Function to append to mobile console
const appendToMobileConsole = (message: string) => {
  if (mobileConsoleElement && typeof document !== 'undefined') {
    try {
      const timestamp = new Date().toLocaleTimeString()
      const logEntry = document.createElement('div')
      logEntry.style.cssText = `
        font-family: monospace;
        font-size: 12px;
        padding: 2px 4px;
        border-bottom: 1px solid #eee;
        background: #f9f9f9;
        color: #333;
      `
      logEntry.textContent = `[${timestamp}] ${message}`
      mobileConsoleElement.appendChild(logEntry)
      
      // Keep only last 50 entries
      while (mobileConsoleElement.children.length > 50) {
        mobileConsoleElement.removeChild(mobileConsoleElement.firstChild!)
      }
      
      // Auto-scroll to bottom
      mobileConsoleElement.scrollTop = mobileConsoleElement.scrollHeight
    } catch (error) {
      // Silently fail if there are any DOM issues
    }
  }
}

// Console logging is enabled for debugging

// Safe stringify function that handles circular references and React elements
const safeStringify = (arg: unknown): string => {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg)
  
  // Handle React elements and DOM nodes
  if (arg && typeof arg === 'object') {
    // Check if it's a React element
    if ('$$typeof' in arg || 'type' in arg || 'props' in arg) {
      return '[React Element]'
    }
    // Check if it's a DOM node
    if ('nodeType' in arg || 'tagName' in arg) {
      return '[DOM Element]'
    }
    // Check if it's a function
    if (typeof (arg as any) === 'function') {
      return '[Function]'
    }
    
    // Try to stringify with circular reference handling
    try {
      const seen = new WeakSet()
      return JSON.stringify(arg, (key, val) => {
        if (val != null && typeof val === 'object') {
          if (seen.has(val)) return '[Circular]'
          seen.add(val)
        }
        return val
      }, 2)
    } catch (error) {
      return '[Object - stringify failed]'
    }
  }
  
  return String(arg)
}

export const log = (label: string, ...args: unknown[]) => {
  // Always log to console
  if (typeof console !== 'undefined') {
    console.log(`[${label.toUpperCase()}]`, ...args)
  }
  
  // Show in mobile console if on mobile
  if (isMobile()) {
    const message = `[${label.toUpperCase()}] ${args.map(safeStringify).join(' ')}`
    appendToMobileConsole(message)
  }
}

export const warn = (label: string, ...args: unknown[]) => {
  const message = `[WARN ${label.toUpperCase()}] ${args.map(safeStringify).join(' ')}`
  
  // Show in mobile console if on mobile
  if (isMobile()) {
    appendToMobileConsole(message)
  }
  
  // Also show in regular console if label is enabled
  if (typeof console !== 'undefined' && console.warn) {
    if (ENABLED_LABELS.includes(label.toLowerCase())) {
      console.warn(`[${label.toUpperCase()}]`, ...args)
    }
  }
}

export const error = (label: string, ...args: unknown[]) => {
  const message = `[ERROR ${label.toUpperCase()}] ${args.map(safeStringify).join(' ')}`
  
  // Show in mobile console if on mobile
  if (isMobile()) {
    appendToMobileConsole(message)
  }
  
  // Also show in regular console if label is enabled
  if (typeof console !== 'undefined' && console.error) {
    if (ENABLED_LABELS.includes(label.toLowerCase())) {
      console.error(`[${label.toUpperCase()}]`, ...args)
    }
  }
}


