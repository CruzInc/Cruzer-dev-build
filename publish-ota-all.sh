#!/bin/bash

# Cruzer OTA Update Publishing Automation
# Publishes updates to all mapped channels (preview, production, production-apk, cruzer-dev)
# Usage: ./publish-ota-all.sh "Your update message"

set -e  # Exit on error

if [ -z "$1" ]; then
  echo "❌ Error: Please provide an update message"
  echo "Usage: ./publish-ota-all.sh \"Your update message\""
  exit 1
fi

MESSAGE="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FULL_MESSAGE="$MESSAGE (published $TIMESTAMP)"

echo "🚀 Starting OTA publishing to all channels..."
echo "📝 Message: $FULL_MESSAGE"
echo ""

# Array of channels to publish to
CHANNELS=("preview" "production" "cruzer-dev")

# Counter for tracking success
SUCCESS_COUNT=0
FAILED_CHANNELS=()

for CHANNEL in "${CHANNELS[@]}"; do
  echo "⏳ Publishing to channel: $CHANNEL..."
  
  if eas update --channel "$CHANNEL" --message "$FULL_MESSAGE" 2>&1 | grep -q "Published!"; then
    echo "✅ Successfully published to $CHANNEL"
    ((SUCCESS_COUNT++))
  else
    echo "❌ Failed to publish to $CHANNEL"
    FAILED_CHANNELS+=("$CHANNEL")
  fi
  echo ""
done

# Summary
echo "════════════════════════════════════════════════════════════"
echo "📊 Publication Summary"
echo "════════════════════════════════════════════════════════════"
echo "✅ Successful: $SUCCESS_COUNT out of ${#CHANNELS[@]} channels"

if [ ${#FAILED_CHANNELS[@]} -gt 0 ]; then
  echo "❌ Failed channels: ${FAILED_CHANNELS[*]}"
  exit 1
else
  echo "🎉 All channels updated successfully!"
  echo ""
  echo "📱 Users on these channels will receive updates:"
  echo "   • preview"
  echo "   • production"
  echo "   • cruzer-dev"
  echo ""
  echo "🔗 EAS Dashboard: https://expo.dev/accounts/cruzer-devs/projects/cruzer-dev/updates"
  exit 0
fi
