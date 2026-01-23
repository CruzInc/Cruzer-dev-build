#!/usr/bin/env node

/**
 * Google Sign-In Redirect URI Diagnostic Tool
 * 
 * This script helps diagnose Google OAuth redirect URI issues by showing
 * exactly what redirect URIs your app will generate in different scenarios.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Google Sign-In Redirect URI Diagnostic Tool\n');
console.log('=' .repeat(70));

// Read app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
let googleClientId = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/EXPO_PUBLIC_GOOGLE_CLIENT_ID=(.+)/);
  if (match) {
    googleClientId = match[1].trim();
  }
}

// Extract configuration
const scheme = appJson.expo.scheme;
const slug = appJson.expo.slug;
const owner = appJson.expo.owner;

console.log('\n📱 App Configuration:');
console.log(`   Scheme: ${scheme}`);
console.log(`   Slug: ${slug}`);
console.log(`   Owner: ${owner}`);
console.log(`   Google Client ID: ${googleClientId || '❌ NOT CONFIGURED'}`);

console.log('\n🔗 Expected Redirect URIs:');
console.log('\nYour app will generate these redirect URIs based on the environment:\n');

// Development with Expo Go
console.log('1️⃣  Development (Expo Go):');
console.log(`   exp://localhost:19000`);
console.log(`   exp://192.168.x.x:19000 (your local IP)`);

// Development with custom scheme
console.log('\n2️⃣  Development (Custom Development Client):');
console.log(`   ${scheme}://`);

// Production/Standalone
console.log('\n3️⃣  Production (Standalone App):');
console.log(`   ${scheme}://`);

// Expo's auth proxy
console.log('\n4️⃣  Expo Auth Proxy (Web OAuth - MOST COMMON):');
console.log(`   https://auth.expo.io/@${owner}/${slug}`);

console.log('\n' + '=' .repeat(70));
console.log('\n✅ RECOMMENDED CONFIGURATION:\n');
console.log('Add ALL of these redirect URIs to your Google Cloud Console:');
console.log('(Go to: https://console.cloud.google.com/apis/credentials)\n');

const redirectUris = [
  `${scheme}://`,
  `${scheme}://redirect`,
  `https://auth.expo.io/@${owner}/${slug}`,
  `exp://localhost:19000`,
  `exp://127.0.0.1:19000`,
];

redirectUris.forEach((uri, index) => {
  console.log(`   ${index + 1}. ${uri}`);
});

console.log('\n' + '=' .repeat(70));
console.log('\n🔧 TROUBLESHOOTING STEPS:\n');

if (!googleClientId) {
  console.log('❌ Google Client ID is NOT configured in .env file!');
  console.log('   → Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to your .env file\n');
} else {
  console.log('✅ Google Client ID is configured\n');
}

console.log('1. Go to Google Cloud Console:');
console.log('   https://console.cloud.google.com/apis/credentials\n');

console.log('2. Select your OAuth 2.0 Client ID\n');

console.log('3. Add the redirect URIs listed above to "Authorized redirect URIs"\n');

console.log('4. Make sure OAuth consent screen is PUBLISHED:');
console.log('   → Go to: https://console.cloud.google.com/apis/credentials/consent');
console.log('   → Click "PUBLISH APP" button');
console.log('   → OR add your email as a test user if keeping in testing mode\n');

console.log('5. Wait 5-10 minutes for changes to propagate\n');

console.log('6. Clear app data and try again\n');

console.log('=' .repeat(70));
console.log('\n💡 Quick Test Command:\n');
console.log('   node scripts/test-google-auth.js\n');
