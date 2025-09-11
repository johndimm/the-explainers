// List of enabled log labels - only these will show in console
const ENABLED_LABELS = ['prompt']

export const log = (label: string, ...args: unknown[]) => {
  if (typeof console !== 'undefined' && console.log) {
    if (ENABLED_LABELS.includes(label.toLowerCase())) {
      console.log(`[${label.toUpperCase()}]`, ...args)
    }
  }
}

export const warn = (label: string, ...args: unknown[]) => {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`[${label.toUpperCase()}]`, ...args)
  }
}

export const error = (label: string, ...args: unknown[]) => {
  if (typeof console !== 'undefined' && console.error) {
    console.error(`[${label.toUpperCase()}]`, ...args)
  }
}


