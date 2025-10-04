# Romeo and Juliet Icon Conversion Guide

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
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu

# Convert each SVG to PNG
convert romeo-and-juliet-48x48.svg ic_launcher_foreground.png
convert romeo-and-juliet-72x72.svg ic_launcher_foreground.png
# ... repeat for each size
```

### Method 3: Using Node.js (if libraries work)
```bash
npm install sharp
node scripts/convert-svg-to-png.js
```

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
