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

// Background Colors - Cozy Dark Theme
const darkBackground = "#0A0E1A"; // Deep navy (less harsh than pure black)
const cardBackground = "#1A1F2E"; // Soft card background
const surfaceBackground = "#252B3D"; // Elevated surface
const borderColor = "#2D3548"; // Subtle borders

// Text Colors - High Readability
const textPrimary = "#F5F7FA"; // Almost white
const textSecondary = "#B4BDD1"; // Softer gray
const textTertiary = "#8891A8"; // Muted gray

// Messaging Colors - Cozy Chat Experience
const messageBubbleSent = "#5E9FFF"; // Your messages (warm blue)
const messageBubbleReceived = "#2D3548"; // Received messages (dark gray)
const chatBackground = "#0F1420"; // Slightly lighter than main background

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
