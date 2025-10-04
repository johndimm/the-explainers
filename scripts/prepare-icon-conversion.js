const fs = require('fs');
const path = require('path');

// This script prepares the Romeo and Juliet icons for manual conversion
// It creates SVG files that can be converted to PNG using online tools

function prepareIconConversion() {
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  const iconsDir = path.join(__dirname, '../public/icons');
  
  console.log('Preparing Romeo and Juliet icons for conversion...');
  
  const iconSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };
  
  // Generate SVG content for each size
  function generateRomeoAndJulietSVG(size = 192) {
    const textSize = Math.floor(size * 0.4);
    const textY = size * 0.6;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 8;
    
    // Scale decorative elements based on icon size
    const scale = size / 512; // Scale factor from 512x512 reference
    const balconySize = 20 * scale;
    const swordSize = 15 * scale;
    const heartSize = 25 * scale;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
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
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" 
          fill="url(#bgGradient)" 
          stroke="#8B5CF6" 
          stroke-width="${Math.max(2, size/64)}"/>
  
  <!-- Balcony elements (scaled) -->
  <rect x="${centerX - balconySize}" y="${centerY - balconySize/2}" 
        width="${balconySize}" height="${balconySize/2}" 
        fill="#8B5CF6" opacity="0.3"/>
  <rect x="${centerX + balconySize/2}" y="${centerY - balconySize/2}" 
        width="${balconySize}" height="${balconySize/2}" 
        fill="#8B5CF6" opacity="0.3"/>
  
  <!-- Crossed swords (scaled) -->
  <line x1="${centerX - swordSize}" y1="${centerY - swordSize}" 
        x2="${centerX + swordSize}" y2="${centerY + swordSize}" 
        stroke="#8B5CF6" stroke-width="${Math.max(1, size/64)}" opacity="0.4"/>
  <line x1="${centerX + swordSize}" y1="${centerY - swordSize}" 
        x2="${centerX - swordSize}" y2="${centerY + swordSize}" 
        stroke="#8B5CF6" stroke-width="${Math.max(1, size/64)}" opacity="0.4"/>
  
  <!-- Heart (scaled) -->
  <path d="M${centerX},${centerY + heartSize/4} 
           C${centerX - heartSize/2},${centerY - heartSize/4}, 
             ${centerX - heartSize/4},${centerY - heartSize/2}, 
             ${centerX},${centerY - heartSize/4}
           C${centerX + heartSize/4},${centerY - heartSize/2}, 
             ${centerX + heartSize/2},${centerY - heartSize/4}, 
             ${centerX},${centerY + heartSize/4} Z" 
        fill="#8B5CF6" opacity="0.2"/>
  
  <!-- Main text -->
  <text x="${centerX}" y="${textY}" 
        text-anchor="middle" 
        font-family="serif" 
        font-size="${textSize}" 
        font-weight="bold" 
        fill="#8B5CF6"
        filter="url(#shadow)">
    R&amp;J
  </text>
  
  <!-- Shakespeare attribution (only for larger icons) -->
  ${size >= 96 ? `<text x="${centerX}" y="${size - 8}" 
        text-anchor="middle" 
        font-family="serif" 
        font-size="${Math.max(6, size/16)}" 
        fill="#8B5CF6"
        opacity="0.7">
    Shakespeare
  </text>` : ''}
</svg>`;
  }
  
  // Create SVG files for each size
  Object.entries(iconSizes).forEach(([dir, size]) => {
    const mipmapDir = path.join(androidResDir, dir);
    
    if (fs.existsSync(mipmapDir)) {
      const svgContent = generateRomeoAndJulietSVG(size);
      const svgPath = path.join(mipmapDir, `romeo-and-juliet-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      
      console.log(`✅ Created SVG for ${dir} (${size}x${size})`);
    }
  });
  
  // Create a conversion guide
  const conversionGuide = `# Romeo and Juliet Icon Conversion Guide

## Current Status
- ✅ Background color: Updated to purple theme (#F8F7FF)
- ✅ SVG files: Generated for all Android icon sizes
- ❌ PNG files: Need to be converted from SVG

## Files to Convert
The following SVG files need to be converted to PNG:

1. android/app/src/main/res/mipmap-mdpi/romeo-and-juliet-48x48.svg
2. android/app/src/main/res/mipmap-hdpi/romeo-and-juliet-72x72.svg
3. android/app/src/main/res/mipmap-xhdpi/romeo-and-juliet-96x96.svg
4. android/app/src/main/res/mipmap-xxhdpi/romeo-and-juliet-144x144.svg
5. android/app/src/main/res/mipmap-xxxhdpi/romeo-and-juliet-192x192.svg

## Conversion Methods

### Method 1: Online Converter
1. Go to https://convertio.co/svg-png/ or https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set output size to match the SVG size (48x48, 72x72, etc.)
4. Download the PNG files
5. Rename them to ic_launcher_foreground.png
6. Replace the existing files in each mipmap directory

### Method 2: ImageMagick (Command Line)
\`\`\`bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu

# Convert each SVG to PNG
convert romeo-and-juliet-48x48.svg ic_launcher_foreground.png
convert romeo-and-juliet-72x72.svg ic_launcher_foreground.png
# ... repeat for each size
\`\`\`

### Method 3: Using Node.js (if libraries work)
\`\`\`bash
npm install sharp
node scripts/convert-svg-to-png.js
\`\`\`

## After Conversion
1. Replace ic_launcher_foreground.png in each mipmap directory
2. The background color is already set to purple theme
3. Build the app: npm run build:romeo-and-juliet
4. The app will display the custom Romeo and Juliet icon

## Icon Design
- Background: Light purple circle with purple border
- Text: "R&J" in large, bold serif font
- Elements: Balcony, crossed swords, heart
- Theme: Romeo and Juliet purple (#8B5CF6)
- Attribution: "Shakespeare" text at bottom
`;
  
  const guidePath = path.join(__dirname, '../ICON_CONVERSION_GUIDE.md');
  fs.writeFileSync(guidePath, conversionGuide);
  
  console.log('\n📋 Conversion guide created: ICON_CONVERSION_GUIDE.md');
  console.log('\n🎭 Romeo and Juliet icons prepared for conversion!');
  console.log('✅ SVG files created for all Android icon sizes');
  console.log('✅ Background color updated to purple theme');
  console.log('📖 See ICON_CONVERSION_GUIDE.md for conversion instructions');
}

prepareIconConversion();