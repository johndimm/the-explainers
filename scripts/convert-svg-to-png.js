const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// This script converts SVG Romeo and Juliet icons to PNG format for Android

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Generate Romeo and Juliet SVG content
function generateRomeoAndJulietSVG(size = 192) {
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

async function convertSVGToPNG() {
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  
  console.log('Converting Romeo and Juliet SVG icons to PNG...');
  
  for (const [dir, size] of Object.entries(iconSizes)) {
    const mipmapDir = path.join(androidResDir, dir);
    
    if (fs.existsSync(mipmapDir)) {
      try {
        // Generate SVG content
        const svgContent = generateRomeoAndJulietSVG(size);
        
        // Convert SVG to PNG using Sharp
        const pngBuffer = await sharp(Buffer.from(svgContent))
          .png()
          .resize(size, size)
          .toBuffer();
        
        // Save as ic_launcher_foreground.png
        const outputPath = path.join(mipmapDir, 'ic_launcher_foreground.png');
        fs.writeFileSync(outputPath, pngBuffer);
        
        console.log(`✅ Converted ${dir} (${size}x${size})`);
      } catch (error) {
        console.error(`❌ Error converting ${dir}:`, error.message);
      }
    }
  }
  
  console.log('\n🎭 Romeo and Juliet icons converted successfully!');
  console.log('The Android app will now use the custom Romeo and Juliet icons.');
}

// Run the conversion
convertSVGToPNG().catch(console.error);