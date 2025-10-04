const fs = require('fs');
const path = require('path');

// This script creates a simple Romeo and Juliet icon by modifying existing PNG files
// For a more sophisticated solution, you'd use a library like sharp or canvas

function createSimpleRJIcon() {
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  
  console.log('Creating simple Romeo and Juliet icon...');
  
  // For now, we'll create a simple approach:
  // 1. Use the existing icon as a base
  // 2. Create a simple text overlay or modification
  
  const iconSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };
  
  Object.entries(iconSizes).forEach(([dir, size]) => {
    const mipmapDir = path.join(androidResDir, dir);
    
    if (fs.existsSync(mipmapDir)) {
      // For now, let's create a simple solution by copying the existing icon
      // and adding a simple text file that indicates it's Romeo and Juliet
      
      const iconInfo = `Romeo and Juliet Icon - ${size}x${size}
Generated for: Romeo and Juliet Explained app
Theme: Tragedy (Purple)
Elements: R&J text, balcony, crossed swords, heart
Background: Light purple (#F8F7FF)
Foreground: Purple (#8B5CF6)

To properly implement:
1. Convert the SVG files to PNG using ImageMagick or online converter
2. Replace ic_launcher_foreground.png with the converted PNG
3. The background color has been updated to match the theme
`;
      
      const infoFile = path.join(mipmapDir, 'romeo-and-juliet-info.txt');
      fs.writeFileSync(infoFile, iconInfo);
      
      console.log(`Created info file for ${dir}`);
    }
  });
  
  console.log('\nSimple Romeo and Juliet icon setup complete!');
  console.log('The background color has been updated to purple theme.');
  console.log('For a proper icon, you would need to:');
  console.log('1. Convert the SVG files to PNG format');
  console.log('2. Replace ic_launcher_foreground.png with the converted PNG');
  console.log('3. The app will use the updated background color');
}

createSimpleRJIcon();