export const log = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && typeof console !== 'undefined' && console.log) {
    console.log('[Explainers]', ...args)
  }
}

export const warn = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && typeof console !== 'undefined' && console.warn) {
    console.warn('[Explainers]', ...args)
  }
}

export const error = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && typeof console !== 'undefined' && console.error) {
    console.error('[Explainers]', ...args)
  }
}


