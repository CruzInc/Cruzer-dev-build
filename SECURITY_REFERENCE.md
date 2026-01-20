# Security Reference - Developer Documentation

**⚠️ CONFIDENTIAL - DO NOT COMMIT TO PUBLIC REPOSITORY**

This document contains sensitive information about obfuscated security features in the application.

## Access Codes

### Developer Panel PIN
- **Code**: `3671`
- **Obfuscation**: Array `[51, 54, 55, 49]` (ASCII character codes)
- **Location**: `app/index.tsx` - `handleDevLogin()` function
- **Variable**: `_0x2d4a`

### Staff Panel PIN
- **Code**: `8523`
- **Obfuscation**: Array `[56, 53, 50, 51]` (ASCII character codes)
- **Location**: `app/index.tsx` - `handleDevLogin()` function
- **Variable**: `_0x7f1b`

### Backdoor IP Access
- **IP Address**: `104.183.254.71`
- **Obfuscation**: Array `[104, 183, 254, 71]` (direct numeric values)
- **Location**: `app/index.tsx` - `openDeveloperPanel()` function
- **Purpose**: Allows automatic developer panel access without PIN when connecting from this IP

## OAuth Credentials

### Google Client ID
- **Full ID**: `1046911026897-iqjnqvjcpfv0r4vvagm5m37g7b5g4i8e.apps.googleusercontent.com`
- **Obfuscation**: Split into 3 character code arrays
  - `_0xg1`: First part (before hyphen)
  - `_0xg2`: Second part (middle section)
  - `_0xg3`: Third part (domain)
- **Location**: `app/index.tsx` - `handleGoogleSignIn()` function
- **Fallback**: Uses `process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID` if available

## Obfuscation Techniques Used

1. **ASCII Character Code Arrays**: Converts strings to arrays of character codes that are decoded at runtime
2. **Split String Construction**: Breaks strings into multiple parts that are concatenated during execution
3. **Hex-style Variable Names**: Uses names like `_0x2d4a`, `_0xgc` to obscure purpose
4. **Comparison Logic**: Uses `.every()` comparisons instead of direct string matching
5. **Environment Variable Fallback**: Provides fallback hardcoded values for OAuth credentials

## Security Features

### Staff Mode (Code: 8523)
- Search accounts by email
- View full account details
- Flag accounts for review
- Blacklist accounts (IP + MAC ban)
- Request login access (requires user authorization)
- Edit account information
- Delete accounts

### Developer Mode (Code: 3671 or IP 104.183.254.71)
- Access to all staff features
- System configuration access
- Debug information
- Beta testing controls

## Maintenance Notes

- When updating PINs, convert to ASCII codes using: `str.split('').map(c => c.charCodeAt(0))`
- When updating IP, convert octets to numeric array: `ip.split('.').map(x => parseInt(x))`
- Always test obfuscated values after changes
- Run `npx tsc --noEmit && npx eslint app/index.tsx` after any security-related changes

## Code Organization

The main application file (`app/index.tsx`) is organized into the following sections:

1. **Imports** - All dependency imports
2. **Type Declarations** - Interfaces and type definitions
3. **Configuration** - Constants and environment setup
4. **Utility Functions** - Helper functions and services
5. **Main Component** - Primary App component with all state management
6. **Calculator State** - Calculator-specific state and logic
7. **UI & Navigation State** - UI control state variables
8. **Messaging State** - Chat and messaging features
9. **Staff Panel** - Administrative functions and UI
10. **Render Methods** - UI rendering functions
11. **Styles** - StyleSheet definitions

---

**Last Updated**: 2025
**Maintained By**: Development Team
