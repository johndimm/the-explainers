#!/bin/bash

# Build for Vercel development server
echo "Building for Vercel development server..."

# Backup original config
cp capacitor.config.ts capacitor.config.backup.ts

# Use Vercel config
cp capacitor.config.vercel.ts capacitor.config.ts

# Build and sync
npm run build:native
npx cap sync android

# Restore original config
cp capacitor.config.backup.ts capacitor.config.ts
rm capacitor.config.backup.ts

# Build Android APK
cd android && ./gradlew assembleDebug

echo "Build complete! APK location: android/app/build/outputs/apk/debug/app-debug.apk"