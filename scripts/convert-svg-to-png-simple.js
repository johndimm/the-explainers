const fs = require('fs');
const path = require('path');

// This script converts SVG files to PNG using a simple approach
// Since Sharp and other libraries are having issues, we'll use a different method

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function convertSVGToPNG() {
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  
  console.log('🔄 Converting Romeo and Juliet SVG icons to PNG...');
  
  try {
    // Try using svg2png if available
    const svg2png = require('svg2png');
    
    for (const [dir, size] of Object.entries(iconSizes)) {
      const mipmapDir = path.join(androidResDir, dir);
      
      if (fs.existsSync(mipmapDir)) {
        const svgPath = path.join(mipmapDir, `romeo-and-juliet-${size}x${size}.svg`);
        const pngPath = path.join(mipmapDir, 'ic_launcher_foreground.png');
        
        if (fs.existsSync(svgPath)) {
          try {
            const svgBuffer = fs.readFileSync(svgPath);
            const pngBuffer = await svg2png(svgBuffer, { width: size, height: size });
            fs.writeFileSync(pngPath, pngBuffer);
            console.log(`✅ Converted ${dir} (${size}x${size})`);
          } catch (error) {
            console.error(`❌ Error converting ${dir}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n🎭 Romeo and Juliet icons converted successfully!');
    return true;
    
  } catch (error) {
    console.log('❌ svg2png not available, trying alternative method...');
    return false;
  }
}

// Alternative method using a simple approach
function createSimplePNGConversion() {
  console.log('📋 Creating conversion instructions...');
  
  const conversionScript = `#!/bin/bash

# Romeo and Juliet Icon Conversion Script
# This script helps convert SVG files to PNG using ImageMagick

echo "🎭 Converting Romeo and Juliet icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install imagemagick
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install imagemagick
    else
        echo "❌ Please install ImageMagick manually"
        exit 1
    fi
fi

# Convert each SVG to PNG
echo "🔄 Converting SVG files to PNG..."

cd android/app/src/main/res

# mdpi (48x48)
if [ -f "mipmap-mdpi/romeo-and-juliet-48x48.svg" ]; then
    convert mipmap-mdpi/romeo-and-juliet-48x48.svg mipmap-mdpi/ic_launcher_foreground.png
    echo "✅ Converted mdpi (48x48)"
fi

# hdpi (72x72)
if [ -f "mipmap-hdpi/romeo-and-juliet-72x72.svg" ]; then
    convert mipmap-hdpi/romeo-and-juliet-72x72.svg mipmap-hdpi/ic_launcher_foreground.png
    echo "✅ Converted hdpi (72x72)"
fi

# xhdpi (96x96)
if [ -f "mipmap-xhdpi/romeo-and-juliet-96x96.svg" ]; then
    convert mipmap-xhdpi/romeo-and-juliet-96x96.svg mipmap-xhdpi/ic_launcher_foreground.png
    echo "✅ Converted xhdpi (96x96)"
fi

# xxhdpi (144x144)
if [ -f "mipmap-xxhdpi/romeo-and-juliet-144x144.svg" ]; then
    convert mipmap-xxhdpi/romeo-and-juliet-144x144.svg mipmap-xxhdpi/ic_launcher_foreground.png
    echo "✅ Converted xxhdpi (144x144)"
fi

# xxxhdpi (192x192)
if [ -f "mipmap-xxxhdpi/romeo-and-juliet-192x192.svg" ]; then
    convert mipmap-xxxhdpi/romeo-and-juliet-192x192.svg mipmap-xxxhdpi/ic_launcher_foreground.png
    echo "✅ Converted xxxhdpi (192x192)"
fi

echo ""
echo "🎭 Romeo and Juliet icons converted successfully!"
echo "📱 The Android app will now use the custom Romeo and Juliet icons."
echo ""
echo "Next steps:"
echo "1. Run: npm run build:romeo-and-juliet"
echo "2. Install the APK on your device"
echo "3. Enjoy your custom Romeo and Juliet icon! 🎭"
`;

  const scriptPath = path.join(__dirname, '../convert-icons.sh');
  fs.writeFileSync(scriptPath, conversionScript);
  
  // Make the script executable
  fs.chmodSync(scriptPath, '755');
  
  console.log('📄 Created conversion script: convert-icons.sh');
  console.log('🚀 Run: ./convert-icons.sh');
  
  return true;
}

// Main execution
async function main() {
  console.log('🎭 Romeo and Juliet Icon Conversion Helper');
  console.log('==========================================');
  
  // Try the first method
  const success = await convertSVGToPNG();
  
  if (!success) {
    // Fall back to alternative method
    createSimplePNGConversion();
  }
}

main().catch(console.error);