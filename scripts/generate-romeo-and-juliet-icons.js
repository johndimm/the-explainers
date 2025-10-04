const fs = require('fs');
const path = require('path');

// This script generates Romeo and Juliet specific icons
// It creates SVG icons and saves them to the public/icons directory

// Romeo and Juliet icon configuration
const romeoAndJulietConfig = {
  playTitle: 'Romeo and Juliet',
  appIconText: 'R&J',
  theme: {
    type: 'tragedy',
    color: '#8B5CF6',
    iconStyle: 'balcony',
    mood: 'dramatic',
    iconColor: '#8B5CF6',
    backgroundColor: '#F8F7FF',
    textColor: '#1F2937'
  },
  size: 512
};

// Generate SVG icon
function generateRomeoAndJulietIcon(size = 512) {
  const textSize = Math.floor(size * 0.4);
  const textY = size * 0.6;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F8F7FF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#8B5CF6" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" 
              fill="url(#bgGradient)" 
              stroke="#8B5CF6" 
              stroke-width="8"/>
      
      <!-- Balcony elements -->
      <path d="M150,200 L150,180 L200,180 L200,200 L200,220 L150,220 Z M312,200 L312,180 L362,180 L362,200 L362,220 L312,220 Z" 
            fill="#8B5CF6" opacity="0.3"/>
      
      <!-- Crossed swords -->
      <path d="M200,160 L200,240 M196,160 L204,160 M196,240 L204,240" 
            stroke="#8B5CF6" stroke-width="6" opacity="0.4" fill="none"/>
      <path d="M312,160 L312,240 M308,160 L316,160 M308,240 L316,240" 
            stroke="#8B5CF6" stroke-width="6" opacity="0.4" fill="none"/>
      
      <!-- Heart -->
      <path d="M256,200 C256,180, 240,160, 220,160 C200,160, 180,180, 180,200 C180,220, 200,240, 256,280 C312,240, 332,220, 332,200 C332,180, 312,160, 292,160 C272,160, 256,180, 256,200 Z" 
            fill="#8B5CF6" opacity="0.2"/>
      
      <!-- Main text -->
      <text x="${size/2}" y="${textY}" 
            text-anchor="middle" 
            font-family="serif" 
            font-size="${textSize}" 
            font-weight="bold" 
            fill="#8B5CF6"
            filter="url(#shadow)">
        R&J
      </text>
      
      <!-- Shakespeare attribution -->
      <text x="${size/2}" y="${size - 20}" 
            text-anchor="middle" 
            font-family="serif" 
            font-size="${Math.floor(size * 0.08)}" 
            fill="#8B5CF6"
            opacity="0.7">
        Shakespeare
      </text>
    </svg>
  `.trim();
}

// Generate icons for different sizes
function generateIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Generate icons for different sizes
  const sizes = [192, 512];
  
  sizes.forEach(size => {
    const svg = generateRomeoAndJulietIcon(size);
    const filename = `romeo-and-juliet-icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svg);
    console.log(`Generated ${filename}`);
  });
  
  console.log('Romeo and Juliet icons generated successfully!');
  console.log('Note: These are SVG files. For PNG files, you would need to convert them using a tool like ImageMagick or an online converter.');
}

// Run the icon generation
generateIcons();