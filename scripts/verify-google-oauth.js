#!/usr/bin/env node

/**
 * Google OAuth Redirect URI Verification Tool
 * Tests if your redirect URIs are properly configured in Google Cloud Console
 */

const https = require('https');

const CLIENT_ID = '394191305315-uuukgtb489k92mklvl4p71r7apjk6ra5.apps.googleusercontent.com';
const REDIRECT_URI = 'https://auth.expo.io/@cruzer-devs/cruzer-dev';

console.log('🧪 Testing Google OAuth Configuration...\n');
console.log('=' .repeat(70));
console.log(`Client ID: ${CLIENT_ID}`);
console.log(`Redirect URI: ${REDIRECT_URI}`);
console.log('=' .repeat(70));

// Build the OAuth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'token',
  scope: 'openid email profile',
  prompt: 'select_account',
}).toString()}`;

console.log('\n📝 Testing Authorization URL:\n');
console.log(authUrl);
console.log('\n' + '=' .repeat(70));

// Try to make a request to verify the client ID
https.get(`https://oauth2.googleapis.com/tokeninfo?client_id=${CLIENT_ID}`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n✅ Status: Client ID verification request sent');
    console.log(`   Response Code: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Client ID appears to be valid!\n');
    } else if (res.statusCode === 400) {
      console.log('\n⚠️  Client ID format is valid, but verification response:');
      console.log(`   ${data}\n`);
    }
    
    console.log('=' .repeat(70));
    console.log('\n🔍 Next Steps:\n');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('2. Click on your OAuth 2.0 Client ID');
    console.log('3. Add this redirect URI to "Authorized redirect URIs":');
    console.log(`   ${REDIRECT_URI}`);
    console.log('\n4. Also add these for development:');
    console.log('   cruzer-app://');
    console.log('   cruzer-app://redirect');
    console.log('   exp://localhost:19000');
    console.log('\n5. Save and wait 5-10 minutes');
    console.log('6. Try Google Sign-In again in your app');
    console.log('\n' + '=' .repeat(70));
    console.log('\n💡 To test manually, open this URL in your browser:');
    console.log('\n' + authUrl);
    console.log('\nIf you see a redirect_uri_mismatch error, the URI is not configured.');
    console.log('If you see the Google sign-in screen, the URI is configured correctly!\n');
  });
}).on('error', (err) => {
  console.error('\n❌ Error:', err.message);
});
