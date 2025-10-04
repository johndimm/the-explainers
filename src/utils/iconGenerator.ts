import { ThemeConfig } from './themeConfig'

export interface IconConfig {
  playTitle: string
  appIconText: string
  theme: ThemeConfig
  size?: number
}

export interface GeneratedIcon {
  svg: string
  png?: string
  favicon?: string
  appleTouchIcon?: string
}

/**
 * Generate SVG icon for a play based on theme and text
 */
export function generatePlayIcon(config: IconConfig): GeneratedIcon {
  const { playTitle, appIconText, theme, size = 512 } = config
  
  // Theme-specific icon elements
  const iconElements = getThemeIconElements(theme)
  
  // Generate SVG
  const svg = generateSVGIcon({
    text: appIconText,
    theme,
    size,
    elements: iconElements
  })
  
  return {
    svg,
    // PNG and other formats would be generated server-side
  }
}

/**
 * Get theme-specific icon elements
 */
function getThemeIconElements(theme: ThemeConfig) {
  const baseElements = {
    background: {
      type: 'circle',
      fill: theme.backgroundColor,
      stroke: theme.color,
      strokeWidth: 4
    },
    text: {
      fill: theme.color,
      fontSize: 'bold',
      fontFamily: 'serif'
    }
  }
  
  // Add theme-specific decorative elements
  const decorativeElements = getDecorativeElements(theme)
  
  return {
    ...baseElements,
    decorative: decorativeElements
  }
}

/**
 * Get decorative elements based on theme type
 */
function getDecorativeElements(theme: ThemeConfig) {
  switch (theme.type) {
    case 'tragedy':
      // Check if this is specifically Romeo and Juliet
      if (theme.color === '#8B5CF6') { // Romeo and Juliet purple
        return {
          balcony: {
            type: 'path',
            d: 'M150,200 L150,180 L200,180 L200,200 L200,220 L150,220 Z M312,200 L312,180 L362,180 L362,200 L362,220 L312,220 Z',
            fill: theme.color,
            opacity: 0.3
          },
          crossedSwords: [
            {
              type: 'path',
              d: 'M200,160 L200,240 M196,160 L204,160 M196,240 L204,240',
              stroke: theme.color,
              strokeWidth: 6,
              opacity: 0.4
            },
            {
              type: 'path',
              d: 'M312,160 L312,240 M308,160 L316,160 M308,240 L316,240',
              stroke: theme.color,
              strokeWidth: 6,
              opacity: 0.4
            }
          ],
          heart: {
            type: 'path',
            d: 'M256,200 C256,180, 240,160, 220,160 C200,160, 180,180, 180,200 C180,220, 200,240, 256,280 C312,240, 332,220, 332,200 C332,180, 312,160, 292,160 C272,160, 256,180, 256,200 Z',
            fill: theme.color,
            opacity: 0.2
          }
        }
      } else {
        // Generic tragedy elements
        return {
          crown: {
            type: 'path',
            d: 'M256,80 L200,120 L150,100 L100,120 L50,100 L50,200 L462,200 L462,100 L412,120 L362,100 L312,120 L256,80 Z',
            fill: theme.color,
            opacity: 0.3
          },
          sword: {
            type: 'rect',
            x: 240,
            y: 180,
            width: 32,
            height: 120,
            fill: theme.color,
            opacity: 0.2
          }
        }
      }
    
    case 'comedy':
      return {
        mask: {
          type: 'path',
          d: 'M256,100 C200,100, 150,150, 150,200 C150,250, 200,300, 256,300 C312,300, 362,250, 362,200 C362,150, 312,100, 256,100 Z',
          fill: theme.color,
          opacity: 0.3
        },
        smile: {
          type: 'path',
          d: 'M200,220 Q256,280, 312,220',
          stroke: theme.color,
          strokeWidth: 8,
          fill: 'none',
          opacity: 0.4
        }
      }
    
    case 'history':
      return {
        scroll: {
          type: 'rect',
          x: 150,
          y: 120,
          width: 212,
          height: 160,
          rx: 20,
          fill: theme.color,
          opacity: 0.2
        },
        seal: {
          type: 'circle',
          cx: 256,
          cy: 200,
          r: 30,
          fill: theme.color,
          opacity: 0.3
        }
      }
    
    case 'romance':
      return {
        heart: {
          type: 'path',
          d: 'M256,200 C256,150, 200,120, 200,150 C200,120, 150,150, 150,200 C150,250, 200,280, 256,320 C312,280, 362,250, 362,200 C362,150, 312,120, 312,150 C312,120, 256,150, 256,200 Z',
          fill: theme.color,
          opacity: 0.3
        },
        stars: [
          {
            type: 'path',
            d: 'M180,160 L185,175 L200,175 L188,185 L193,200 L180,190 L167,200 L172,185 L160,175 L175,175 Z',
            fill: theme.color,
            opacity: 0.4
          },
          {
            type: 'path',
            d: 'M332,160 L337,175 L352,175 L340,185 L345,200 L332,190 L319,200 L324,185 L312,175 L327,175 Z',
            fill: theme.color,
            opacity: 0.4
          }
        ]
      }
    
    default:
      return {}
  }
}

/**
 * Generate SVG icon
 */
function generateSVGIcon(config: {
  text: string
  theme: ThemeConfig
  size: number
  elements: any
}): string {
  const { text, theme, size, elements } = config
  
  // Calculate text size based on icon size
  const textSize = Math.floor(size * 0.4)
  const textY = size * 0.6
  
  // Generate decorative elements SVG
  const decorativeSVG = generateDecorativeSVG(elements.decorative, size)
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${theme.backgroundColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${theme.color};stop-opacity:0.1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="${theme.color}" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" 
              fill="url(#bgGradient)" 
              stroke="${theme.color}" 
              stroke-width="8"/>
      
      <!-- Decorative elements -->
      ${decorativeSVG}
      
      <!-- Main text -->
      <text x="${size/2}" y="${textY}" 
            text-anchor="middle" 
            font-family="serif" 
            font-size="${textSize}" 
            font-weight="bold" 
            fill="${theme.color}"
            filter="url(#shadow)">
        ${text}
      </text>
      
      <!-- Shakespeare attribution (if applicable) -->
      <text x="${size/2}" y="${size - 20}" 
            text-anchor="middle" 
            font-family="serif" 
            font-size="${Math.floor(size * 0.08)}" 
            fill="${theme.color}"
            opacity="0.7">
        Shakespeare
      </text>
    </svg>
  `.trim()
}

/**
 * Generate decorative elements SVG
 */
function generateDecorativeSVG(elements: any, size: number): string {
  if (!elements) return ''
  
  let svg = ''
  
  Object.entries(elements).forEach(([key, element]: [string, any]) => {
    if (Array.isArray(element)) {
      // Handle arrays of elements (like stars)
      element.forEach((el, index) => {
        svg += generateElementSVG(el, size, `${key}-${index}`)
      })
    } else {
      svg += generateElementSVG(element, size, key)
    }
  })
  
  return svg
}

/**
 * Generate individual element SVG
 */
function generateElementSVG(element: any, size: number, key: string): string {
  const { type, ...attrs } = element
  
  switch (type) {
    case 'path':
      return `<path d="${attrs.d}" fill="${attrs.fill}" stroke="${attrs.stroke || 'none'}" stroke-width="${attrs.strokeWidth || 0}" opacity="${attrs.opacity || 1}"/>`
    
    case 'rect':
      return `<rect x="${attrs.x}" y="${attrs.y}" width="${attrs.width}" height="${attrs.height}" rx="${attrs.rx || 0}" fill="${attrs.fill}" opacity="${attrs.opacity || 1}"/>`
    
    case 'circle':
      return `<circle cx="${attrs.cx}" cy="${attrs.cy}" r="${attrs.r}" fill="${attrs.fill}" opacity="${attrs.opacity || 1}"/>`
    
    default:
      return ''
  }
}

/**
 * Generate favicon HTML
 */
export function generateFaviconHTML(config: IconConfig): string {
  const icon = generatePlayIcon(config)
  
  return `
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${btoa(icon.svg)}">
    <link rel="apple-touch-icon" href="data:image/svg+xml;base64,${btoa(icon.svg)}">
    <meta name="theme-color" content="${config.theme.color}">
  `
}

/**
 * Generate app icon for different sizes
 */
export function generateAppIcons(config: IconConfig): Record<string, string> {
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
  const icons: Record<string, string> = {}
  
  sizes.forEach(size => {
    const iconConfig = { ...config, size }
    const icon = generatePlayIcon(iconConfig)
    icons[`icon-${size}x${size}`] = icon.svg
  })
  
  return icons
}

/**
 * Generate manifest.json for PWA
 */
export function generateManifest(config: IconConfig): any {
  const icons = generateAppIcons(config)
  
  return {
    name: config.playTitle,
    short_name: config.appIconText,
    description: `Understand ${config.playTitle} with AI-powered explanations`,
    start_url: '/',
    display: 'standalone',
    background_color: config.theme.backgroundColor,
    theme_color: config.theme.color,
    icons: Object.entries(icons).map(([name, svg]) => ({
      src: `data:image/svg+xml;base64,${btoa(svg)}`,
      sizes: name.replace('icon-', '').replace('x', 'x'),
      type: 'image/svg+xml'
    }))
  }
}