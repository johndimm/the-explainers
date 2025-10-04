#!/bin/bash

# Build script for The Explainers (full app)
echo "Building The Explainers (full app)..."

# Copy Capacitor config
cp capacitor.config.full-app.ts capacitor.config.ts

# Restore original Android app name
if [ -f android/app/src/main/res/values/strings.xml.bak ]; then
  cp android/app/src/main/res/values/strings.xml.bak android/app/src/main/res/values/strings.xml
  rm -f android/app/src/main/res/values/strings.xml.bak
else
  sed -i.bak 's/Romeo and Juliet Explained/The Explainers/g' android/app/src/main/res/values/strings.xml
  rm -f android/app/src/main/res/values/strings.xml.bak
fi

# Restore original manifest for full app
if [ -f public/manifest.json.backup ]; then
  cp public/manifest.json.backup public/manifest.json
else
  cat > public/manifest.json << 'EOF'
{
  "name": "The Explainers",
  "short_name": "Explainers",
  "description": "Understand difficult texts with AI-powered explanations",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B5CF6",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "48x48",
      "type": "image/x-icon"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF
fi

# Build the app for native
npm run build:native

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync android

# Build Android APK
echo "Building Android APK..."
cd android
./gradlew assembleDebug
cd ..

echo "The Explainers APK built successfully!"
echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"

# Clean up backup files
rm -f public/manifest.json.backup