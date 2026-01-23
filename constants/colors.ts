/**
 * Cruzer Color Palette
 * Warm, welcoming, cozy theme for better UX
 */

// Primary Brand Colors - Warm & Inviting
const primaryBlue = "#5E9FFF"; // Softer, warmer blue
const accentOrange = "#FF9F5A"; // Warm orange accent
const successGreen = "#5FD97A"; // Friendly green
const warningYellow = "#FFD65A"; // Soft yellow
const errorRed = "#FF6B6B"; // Gentle red

// Background Colors - True Black Theme (Default)
const darkBackground = "#000000"; // Pure black (default)
const cardBackground = "#0A0A0A"; // Slightly lighter black
const surfaceBackground = "#121212"; // Elevated surface
const borderColor = "#1A1A1A"; // Subtle borders

// Text Colors - High Readability
const textPrimary = "#F5F7FA"; // Almost white
const textSecondary = "#B4BDD1"; // Softer gray
const textTertiary = "#8891A8"; // Muted gray

// Messaging Colors - Pure Black Chat Experience (Default)
const messageBubbleSent = "#5E9FFF"; // Your messages (warm blue)
const messageBubbleReceived = "#1A1A1A"; // Received messages (dark)
const chatBackground = "#000000"; // Pure black background (default)

export default {
  // Light mode (for future use)
  light: {
    text: "#1A1F2E",
    background: "#F5F7FA",
    tint: primaryBlue,
    tabIconDefault: "#8891A8",
    tabIconSelected: primaryBlue,
  },
  
  // Dark mode (current theme)
  dark: {
    // Backgrounds
    background: darkBackground,
    card: cardBackground,
    surface: surfaceBackground,
    chat: chatBackground,
    
    // Text
    text: textPrimary,
    textSecondary: textSecondary,
    textTertiary: textTertiary,
    
    // Brand
    primary: primaryBlue,
    accent: accentOrange,
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    
    // Borders
    border: borderColor,
    divider: "#1F2537",
    
    // Messaging
    messageSent: messageBubbleSent,
    messageReceived: messageBubbleReceived,
    
    // Interactive
    tint: primaryBlue,
    tabIconDefault: textTertiary,
    tabIconSelected: primaryBlue,
    
    // Status
    online: successGreen,
    offline: textTertiary,
    away: warningYellow,
  },
};
