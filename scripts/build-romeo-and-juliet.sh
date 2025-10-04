#!/bin/bash

# Build script for Romeo and Juliet Explained app
echo "Building Romeo and Juliet Explained app..."

# Copy Romeo and Juliet config to app config
cp src/config/romeo-and-juliet.ts src/config/app-config.ts

# Copy Capacitor config
cp capacitor.config.romeo-and-juliet.ts capacitor.config.ts

# Update Android app name
sed -i.bak 's/The Explainers/Romeo and Juliet Explained/g' android/app/src/main/res/values/strings.xml
# Remove the backup file immediately to avoid Android build issues
rm -f android/app/src/main/res/values/strings.xml.bak

# Generate Romeo and Juliet icons
node scripts/generate-romeo-and-juliet-icons.js

# Update Android icons
node scripts/update-android-icons.js

# Prepare icons for conversion
node scripts/prepare-icon-conversion.js

# Copy Romeo and Juliet manifest
cp public/manifest.json public/manifest.json.backup
cat > public/manifest.json << 'EOF'
{
  "name": "Romeo and Juliet Explained",
  "short_name": "R&J Explained",
  "description": "Understand Romeo and Juliet with AI-powered explanations",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B5CF6",
  "icons": [
    {
      "src": "/icons/romeo-and-juliet-icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/romeo-and-juliet-icon-512x512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
}
EOF

# Build the app for native
npm run build:native

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync android

# Clean up extra files that cause build issues
echo "Cleaning up extra files..."
find android/app/src/main/res -name "romeo-and-juliet-*.svg" -delete
find android/app/src/main/res -name "romeo-and-juliet-*.png" -delete
find android/app/src/main/res -name "romeo-and-juliet-*.txt" -delete
find android/app/src/main/res -name "*.backup" -delete

# Build Android APK
echo "Building Android APK..."
cd android
./gradlew assembleDebug
cd ..

echo "Romeo and Juliet Explained APK built successfully!"
echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"

# Clean up backup files
rm -f public/manifest.json.backup