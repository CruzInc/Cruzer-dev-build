#!/bin/bash

echo "================================================"
echo "Google Sign-In Configuration Diagnostic"
echo "================================================"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check Google Client ID
    if grep -q "EXPO_PUBLIC_GOOGLE_CLIENT_ID" .env; then
        CLIENT_ID=$(grep "EXPO_PUBLIC_GOOGLE_CLIENT_ID" .env | cut -d '=' -f 2)
        
        if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "YOUR-WEB-CLIENT-ID-HERE.apps.googleusercontent.com" ]; then
            echo "❌ Google Client ID is not set or using placeholder"
            echo "   Action: Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in .env"
        else
            echo "✅ Google Client ID is configured"
            echo "   Client ID: $CLIENT_ID"
            
            # Validate format
            if [[ $CLIENT_ID == *".apps.googleusercontent.com" ]]; then
                echo "✅ Client ID format looks valid"
            else
                echo "⚠️  Client ID format may be invalid (should end with .apps.googleusercontent.com)"
            fi
        fi
    else
        echo "❌ EXPO_PUBLIC_GOOGLE_CLIENT_ID not found in .env"
        echo "   Action: Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to .env"
    fi
else
    echo "❌ .env file not found"
    echo "   Action: Copy env.example to .env and configure it"
fi

echo ""
echo "================================================"
echo "Common Issues & Solutions"
echo "================================================"
echo ""
echo "1. 'Contact the Developer' Error"
echo "   → Go to Google Cloud Console"
echo "   → APIs & Services → OAuth consent screen"
echo "   → Click 'PUBLISH APP'"
echo ""
echo "2. 'Redirect URI Mismatch'"
echo "   → Add these URIs in Google Cloud Console:"
echo "     • cruzer-app://redirect"
echo "     • cruzer-app:/"
echo "     • exp://localhost:8081"
echo ""
echo "3. 'Invalid Client'"
echo "   → Check your Client ID is correct"
echo "   → Use Web Client ID (not iOS/Android)"
echo "   → Copy from Google Cloud Console → Credentials"
echo ""
echo "================================================"
echo "Next Steps"
echo "================================================"
echo ""
echo "1. Visit: https://console.cloud.google.com"
echo "2. Select your project"
echo "3. Follow instructions in GOOGLE_LOGIN_FIX.md"
echo "4. Test the login in your app"
echo ""
echo "For detailed help, see:"
echo "  • GOOGLE_LOGIN_FIX.md"
echo "  • GOOGLE_SIGNIN_SETUP.md"
echo ""
