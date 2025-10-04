const fs = require('fs');
const path = require('path');

// This script updates Android icons for Romeo and Juliet
// It converts SVG to PNG and updates the Android icon files

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Generate Romeo and Juliet icon as PNG data URL
function generateRomeoAndJulietIcon(size = 192) {
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

// For now, we'll copy the existing icons and create a simple replacement
// In a real implementation, you'd convert SVG to PNG using a library like sharp or canvas
function updateAndroidIcons() {
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  
  console.log('Updating Android icons for Romeo and Juliet...');
  
  // For now, we'll create a simple approach:
  // 1. Copy the existing icons as backup
  // 2. Create new SVG files that can be manually converted to PNG
  
  Object.entries(iconSizes).forEach(([dir, size]) => {
    const mipmapDir = path.join(androidResDir, dir);
    
    if (fs.existsSync(mipmapDir)) {
      // Create backup of existing icons
      const backupDir = path.join(mipmapDir, 'backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      
      // Backup existing icons
      const iconFiles = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
      iconFiles.forEach(file => {
        const srcPath = path.join(mipmapDir, file);
        const backupPath = path.join(backupDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, backupPath);
          console.log(`Backed up ${file} for ${dir}`);
        }
      });
      
      // Generate SVG for this size
      const svg = generateRomeoAndJulietIcon(size);
      const svgPath = path.join(mipmapDir, `romeo-and-juliet-${size}.svg`);
      fs.writeFileSync(svgPath, svg);
      console.log(`Generated SVG for ${dir} (${size}x${size})`);
    }
  });
  
  console.log('\nRomeo and Juliet Android icons prepared!');
  console.log('Next steps:');
  console.log('1. Convert the SVG files to PNG using an online converter or ImageMagick');
  console.log('2. Replace ic_launcher_foreground.png with the converted PNG files');
  console.log('3. Update the background color in values/ic_launcher_background.xml');
}

// Update the background color
function updateBackgroundColor() {
  const backgroundFile = path.join(__dirname, '../android/app/src/main/res/values/ic_launcher_background.xml');
  
  if (fs.existsSync(backgroundFile)) {
    // Backup original
    fs.copyFileSync(backgroundFile, backgroundFile + '.backup');
    
    // Update with Romeo and Juliet purple background
    const newBackground = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#F8F7FF</color>
</resources>`;
    
    fs.writeFileSync(backgroundFile, newBackground);
    console.log('Updated Android icon background color to Romeo and Juliet theme');
  }
}

// Run the updates
updateAndroidIcons();
updateBackgroundColor();