// List of enabled log labels - only these will show in console
const ENABLED_LABELS: string[] = ['chat-history']

// Mobile console element reference
let mobileConsoleElement: HTMLDivElement | null = null

// Function to set mobile console element
export const setMobileConsole = (element: HTMLDivElement | null) => {
  // Avoid clearing existing overlay on null
  if (!element) return
  mobileConsoleElement = element
}

// Check if we're on mobile
const isMobile = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Ensure a console root exists; if not, create an attached overlay at the bottom
const ensureConsoleRoot = (): HTMLDivElement | null => {
  if (mobileConsoleElement) return mobileConsoleElement
  if (typeof document === 'undefined') return null

  // Reuse existing root if present (prevents duplicates across bundles)
  const existing = document.getElementById('te-mobile-console-root') as HTMLDivElement | null
  if (existing) {
    mobileConsoleElement = existing
    return mobileConsoleElement
  }

  // Clean up any stale overlays created by previous builds (no id set)
  try {
    const staleLogs = Array.from(document.querySelectorAll('div.mobile-console-log')) as HTMLDivElement[]
    staleLogs.forEach(logEl => {
      const parent = logEl.parentElement as HTMLDivElement | null
      if (parent && parent.id !== 'te-mobile-console-root') {
        const isFixed = parent.style && parent.style.position === 'fixed'
        if (isFixed) {
          parent.remove()
        }
      }
    })
  } catch { /* ignore */ }

  const root = document.createElement('div')
  root.id = 'te-mobile-console-root'
  root.style.position = 'fixed'
  root.style.left = '0'
  root.style.right = '0'
  // Position flush to bottom, respecting safe-area
  root.style.bottom = 'env(safe-area-inset-bottom, 0px)'
  root.style.zIndex = '2147483000'
  root.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace'
  root.style.color = '#0f0'

  const header = document.createElement('div')
  header.style.background = '#111'
  header.style.color = '#fff'
  header.style.padding = '12px 14px'
  header.style.borderTop = '1px solid #333'
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.justifyContent = 'space-between'
  header.style.cursor = 'pointer'
  header.style.userSelect = 'none'
  header.style.minHeight = '40px'
  header.style.borderRadius = '6px'
  header.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
  header.style.touchAction = 'manipulation'
  header.setAttribute('role', 'button')
  const title = document.createElement('span')
  title.textContent = 'Console'
  title.style.fontSize = '12px'
  title.style.opacity = '0.9'
  const caret = document.createElement('span')
  // Start collapsed by default
  caret.textContent = '▲'
  caret.style.fontSize = '12px'
  caret.style.opacity = '0.9'
  header.appendChild(title)
  header.appendChild(caret)

  const logEl = document.createElement('div')
  logEl.className = 'mobile-console-log'
  logEl.style.background = '#000'
  // Start collapsed by default
  logEl.style.maxHeight = '0px'
  logEl.style.overflowY = 'auto'
  logEl.style.transition = 'max-height 200ms ease'
  logEl.style.padding = '0 12px'
  logEl.style.fontSize = '12px'
  logEl.style.lineHeight = '1.4'
  logEl.style.borderTop = '1px solid #222'
  logEl.style.borderRadius = '6px'

  let expanded = false
  header.onclick = () => {
    expanded = !expanded
    logEl.style.maxHeight = expanded ? '40vh' : '0px'
    logEl.style.padding = expanded ? '8px 12px' : '0 12px'
    caret.textContent = expanded ? '▼' : '▲'
  }

  root.appendChild(header)
  root.appendChild(logEl)
  document.body.appendChild(root)
  // Reserve space below app content so the bar does not cover text
  try {
    const applyBodyPadding = () => {
      const headerHeight = header.getBoundingClientRect().height || 40
      // Expose the height via CSS var for components to consume
      document.documentElement.style.setProperty('--mobile-console-header-height', `${headerHeight}px`)
      // Also pad body to guarantee space even for full-viewport containers
      document.body.style.paddingBottom = `calc(${headerHeight}px + env(safe-area-inset-bottom, 0px))`
    }
    applyBodyPadding()
    window.addEventListener('resize', applyBodyPadding)
    window.addEventListener('orientationchange', applyBodyPadding)
  } catch { /* ignore */ }
  mobileConsoleElement = root
  return mobileConsoleElement
}

// Function to append to mobile console
const appendToMobileConsole = (message: string) => {
  try {
    if (!mobileConsoleElement) {
      // If no element registered, create a default one so logs are visible
      ensureConsoleRoot()
    }
    if (!mobileConsoleElement) return
    // Find or create the log container inside the provided element
  let logEl = mobileConsoleElement.querySelector('.mobile-console-log') as HTMLDivElement | null
    // If a log element exists but no header sibling, add a header for toggling
    if (logEl && !(mobileConsoleElement.firstElementChild && mobileConsoleElement.firstElementChild !== logEl)) {
      const header = document.createElement('div')
      header.style.background = '#111'
      header.style.color = '#fff'
      header.style.padding = '8px 12px'
      header.style.borderTop = '1px solid #333'
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.justifyContent = 'space-between'
      header.style.cursor = 'pointer'
      header.style.userSelect = 'none'
      header.setAttribute('role', 'button')
      const title = document.createElement('span')
      title.textContent = 'Console'
      title.style.fontSize = '12px'
      title.style.opacity = '0.9'
      const caret = document.createElement('span')
      // Start collapsed by default
      caret.textContent = '▲'
      caret.style.fontSize = '12px'
      caret.style.opacity = '0.9'
      header.appendChild(title)
      header.appendChild(caret)

      let expanded = false
      header.onclick = () => {
        expanded = !expanded
        logEl!.style.maxHeight = expanded ? '40vh' : '0px'
        logEl!.style.padding = expanded ? '8px 12px' : '0 12px'
        caret.textContent = expanded ? '▼' : '▲'
      }

      mobileConsoleElement.insertBefore(header, logEl)
    }

    if (!logEl) {
      // If the expected container is missing, recreate structure
      mobileConsoleElement.innerHTML = ''
      const header = document.createElement('div')
      header.style.background = '#111'
      header.style.color = '#fff'
      header.style.padding = '8px 12px'
      header.style.borderTop = '1px solid #333'
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.justifyContent = 'space-between'
      header.style.cursor = 'pointer'
      header.style.userSelect = 'none'
      header.setAttribute('role', 'button')
      const title = document.createElement('span')
      title.textContent = 'Console'
      title.style.fontSize = '12px'
      title.style.opacity = '0.9'
      const caret = document.createElement('span')
      // Start collapsed by default
      caret.textContent = '▲'
      caret.style.fontSize = '12px'
      caret.style.opacity = '0.9'
      header.appendChild(title)
      header.appendChild(caret)

      logEl = document.createElement('div')
      logEl.className = 'mobile-console-log'
      logEl.style.background = '#000'
      // Start collapsed by default
      logEl.style.maxHeight = '0px'
      logEl.style.overflowY = 'auto'
      logEl.style.transition = 'max-height 200ms ease'
      logEl.style.padding = '0 12px'
      logEl.style.fontSize = '12px'
      logEl.style.lineHeight = '1.4'
      logEl.style.borderTop = '1px solid #222'

      let expanded = false
      header.onclick = () => {
        expanded = !expanded
        logEl!.style.maxHeight = expanded ? '40vh' : '0px'
        logEl!.style.padding = expanded ? '8px 12px' : '0 12px'
        caret.textContent = expanded ? '▼' : '▲'
      }

      mobileConsoleElement.appendChild(header)
      mobileConsoleElement.appendChild(logEl)
    }

    const line = document.createElement('div')
    line.textContent = message
    line.style.whiteSpace = 'pre-wrap'
    line.style.wordBreak = 'break-word'
    line.style.color = '#0f0'
    logEl.appendChild(line)

    // Keep last 200 lines to avoid unbounded growth
    const maxLines = 200
    while (logEl.childNodes.length > maxLines) {
      logEl.removeChild(logEl.firstChild as ChildNode)
    }

    // Auto-scroll to bottom
    logEl.scrollTop = logEl.scrollHeight
  } catch {
    // no-op: never let logging crash the app
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
  // Only log if label is enabled
  if (ENABLED_LABELS.includes(label) && typeof console !== 'undefined') {
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

// Initialize overlay early on mobile (in WebView or mobile browser)
try {
  if (typeof window !== 'undefined' && isMobile()) {
    ensureConsoleRoot()
    appendToMobileConsole('[INIT] Mobile console overlay ready')
  }
} catch {
  // ignore
}

  // Also show in regular console if label is enabled
  if (typeof console !== 'undefined' && console.error) {
    if (ENABLED_LABELS.includes(label.toLowerCase())) {
      console.error(`[${label.toUpperCase()}]`, ...args)
    }
  }
}
