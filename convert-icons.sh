#!/bin/bash

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
    magick mipmap-mdpi/romeo-and-juliet-48x48.svg mipmap-mdpi/ic_launcher_foreground.png
    echo "✅ Converted mdpi (48x48)"
fi

# hdpi (72x72)
if [ -f "mipmap-hdpi/romeo-and-juliet-72x72.svg" ]; then
    magick mipmap-hdpi/romeo-and-juliet-72x72.svg mipmap-hdpi/ic_launcher_foreground.png
    echo "✅ Converted hdpi (72x72)"
fi

# xhdpi (96x96)
if [ -f "mipmap-xhdpi/romeo-and-juliet-96x96.svg" ]; then
    magick mipmap-xhdpi/romeo-and-juliet-96x96.svg mipmap-xhdpi/ic_launcher_foreground.png
    echo "✅ Converted xhdpi (96x96)"
fi

# xxhdpi (144x144)
if [ -f "mipmap-xxhdpi/romeo-and-juliet-144x144.svg" ]; then
    magick mipmap-xxhdpi/romeo-and-juliet-144x144.svg mipmap-xxhdpi/ic_launcher_foreground.png
    echo "✅ Converted xxhdpi (144x144)"
fi

# xxxhdpi (192x192)
if [ -f "mipmap-xxxhdpi/romeo-and-juliet-192x192.svg" ]; then
    magick mipmap-xxxhdpi/romeo-and-juliet-192x192.svg mipmap-xxxhdpi/ic_launcher_foreground.png
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
