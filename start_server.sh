#!/bin/bash
# 🚀 RESTAURANT OS - STABLE STARTUP SCRIPT
# Grade VI Environment Stabilization

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

echo "📍 PATH: $PATH"
echo "📍 NODE: $(which node)"
echo "📍 NPM: $(which npm)"

# Clear Next.js cache
echo "🧹 Clearing .next cache..."
rm -rf .next

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules missing. Installing..."
    npm install
fi

# Launch Dev Server
echo "🔥 Starting Development Server..."
npm run dev
