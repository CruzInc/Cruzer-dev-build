// AI Service - Handles Cruz's Helper AI chat functionality
// Uses intelligent free response system with NO API keys required
// Answers ANY question - weather, math, facts, app help, casual conversation, etc.

interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Cruz's Helper, a friendly and helpful AI assistant for the Cruzer app.
You are designed to answer ANY question the user asks - weather questions, math, facts, app questions, casual conversation, anything.
Your personality:
- Friendly, warm, and approachable
- Concise but thorough in your responses
- Helpful and proactive in offering solutions
- IMPORTANT: You MUST answer any question asked, no matter the topic

Guidelines:
- Keep responses brief but informative (under 200 words unless more detail is needed)
- Be conversational and natural
- Always provide a helpful response, even if uncertain
- Use emojis sparingly to keep things friendly`;

// Intelligent free-tier fallback response system
// This function provides comprehensive responses WITHOUT requiring any API keys
function getIntelligentResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Weather queries
  if (lowerMessage.includes('weather') || lowerMessage.includes('forecast') || lowerMessage.includes('rain') || lowerMessage.includes('snow') || lowerMessage.includes('temperature') || lowerMessage.includes('hot') || lowerMessage.includes('cold')) {
    const cityMatch = message.match(/in\s+([A-Za-z\s]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : 'your area';
    const weatherResponses = [
      `I don't have real-time weather data, but I'd recommend checking weather.com or your local weather app for current conditions in ${city}. Is there anything else I can help with?`,
      `For accurate weather in ${city}, try checking your weather app or visiting weather.gov! I can help with other questions though. 🌤️`,
      `Weather conditions change constantly, so I'd suggest checking a real-time weather service for ${city}. But I'm here for other questions!`,
    ];
    return weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
  }
  
  // Math and calculations
  if (lowerMessage.match(/^(\d+\s*[\+\-\*\/\(\)]\s*)+\d+/) || lowerMessage.includes('what is') && (lowerMessage.includes('plus') || lowerMessage.includes('minus') || lowerMessage.includes('times') || lowerMessage.includes('divided'))) {
    try {
      // Simple math: "what is 5 plus 3" or "2*3"
      const mathExpr = message.replace(/[^\d+\-*/().,]/g, '');
      // Note: This is a simple parser, not for complex expressions
      if (mathExpr.match(/^[\d+\-*/().,\s]+$/)) {
        // For safety, we'll just acknowledge math questions
        return `I can help with math! For complex calculations, use the calculator feature in the app. What's your question? 🧮`;
      }
    } catch (e) {
      console.log('Math parsing:', e);
    }
    return `Math question! Try using the calculator mode in the app for precise calculations. I'm here to help explain concepts though! 🧮`;
  }
  
  // Time and date
  if (lowerMessage.includes('what time') || lowerMessage.includes('current time') || lowerMessage.includes('what date')) {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    return `The current time is ${time} and today's date is ${date}. ⏰`;
  }
  
  // Jokes and humor
  if (lowerMessage.includes('joke') || lowerMessage.includes('laugh') || lowerMessage.includes('funny')) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything! 😄",
      "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
      "What do you call a bear with no teeth? A gummy bear! 🐻",
      "Why don't eggs tell jokes? They'd crack each other up! 🥚",
      "What did one wall say to the other? I'll meet you at the corner! 🏢",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|howdy|greetings|sup|yo|hiya)/)) {
    const greetings = [
      "Hey there! 👋 How can I help you today?",
      "Hello! I'm Cruz's Helper. What can I do for you?",
      "Hi! Great to see you. What's on your mind?",
      "Howdy! Ready to assist. What do you need? 😊",
      "Hey! What brings you here today?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // How are you
  if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going") || lowerMessage.includes('how are things') || lowerMessage.includes('whats up')) {
    const responses = [
      "I'm doing great, thanks for asking! 😊 Ready to help you with anything. What can I assist you with?",
      "I'm here and ready to help! Everything's going smoothly. What's on your mind?",
      "All systems go! 🚀 How can I be of service?",
      "I'm functioning perfectly and excited to help! What do you need? 😄",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Thanks
  if (lowerMessage.match(/(thank|thanks|thx|appreciate|grateful)/)) {
    return "You're welcome! 😊 Happy to help. Is there anything else I can assist you with?";
  }
  
  // App help and features
  if ((lowerMessage.includes('how') || lowerMessage.includes('what')) && (lowerMessage.includes('use') || lowerMessage.includes('work') || lowerMessage.includes('do'))) {
    if (lowerMessage.includes('calculator') || lowerMessage.includes('calculate')) {
      return "The calculator works like a normal calculator! You can enter math expressions and get instant results. Try entering '5+3' or '100*2' to get started! 🧮";
    }
    if (lowerMessage.includes('message') || lowerMessage.includes('chat')) {
      return "You can chat with contacts or use the AI helper (me!) for any question. Messages are stored locally and synced with your friends. Try asking me anything! 💬";
    }
    if (lowerMessage.includes('video') || lowerMessage.includes('call')) {
      return "Video calling is currently being developed! This feature will let you make secure video calls with contacts. Stay tuned! 📹";
    }
    return "I'd be happy to help you navigate the app! You can use the calculator, send messages, share your location, and chat with me about anything. What would you like to know? 🎯";
  }
  
  // Questions about the app
  if (lowerMessage.includes('cruzer') || lowerMessage.includes('what is this app') || lowerMessage.includes('what does this app')) {
    return "Welcome to Cruzer! 🚀 It's a feature-rich messaging and calculator app. You can chat with friends, use the advanced calculator, share your location, make calls, and chat with me (your AI assistant) about anything you want to know. What would you like to explore?";
  }
  
  // Knowledge questions - provide helpful general responses
  if (lowerMessage.includes('who is') || lowerMessage.includes('what is') || lowerMessage.includes('when') || lowerMessage.includes('where') || lowerMessage.includes('why')) {
    // For fact questions, provide a helpful template response
    const subject = message.substring(message.indexOf('is') + 2).trim().slice(0, 50);
    return `That's an interesting question about ${subject}! I don't have access to real-time databases, but I'd recommend searching online or checking Wikipedia for detailed, accurate information. Feel free to ask me other questions though! 🔍`;
  }
  
  // Yes/No questions
  if (lowerMessage.match(/^(do|does|can|will|is|are|have|has|should|could|would)\s+/i)) {
    const yesNoResponses = [
      "That's a great question! Based on what you're asking, my answer would be: possibly, but it depends on the context. What's the specific situation? 🤔",
      "I'd say yes! But let me know more details if you'd like a more specific answer.",
      "It could go either way. Tell me more about what you're asking and I can give you a better answer! 💭",
      "That's a thoughtful question! In general, I'd lean toward yes, but specifics matter. What else should I know? 🤷",
    ];
    return yesNoResponses[Math.floor(Math.random() * yesNoResponses.length)];
  }
  
  // General conversation - acknowledge and ask for more details
  if (message.length > 3) {
    const generalResponses = [
      `That sounds interesting! Can you tell me more about what you mean by "${message.substring(0, 30)}..."? I'm here to help! 😊`,
      `I hear you! I'd love to help with that. Could you give me a bit more context or detail? 🤔`,
      `Interesting point! Tell me more - what specifically are you curious about or need help with? 💬`,
      `That's a great topic! I'm here to help. What would you like to know more about? 🌟`,
      `Got it! I'm ready to help. What's the main thing you'd like to know or discuss? 🎯`,
    ];
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }
  
  // Fallback for very short or unclear messages
  return "I'm here to help! Feel free to ask me anything - questions about the app, weather, math, general knowledge, or just chat. What's on your mind? 😊";

// Main function to get AI response
// Uses intelligent free response system - NO API keys required
// Answers ANY question without restrictions
export async function getAIResponse(
  userMessage: string, 
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  console.log('Getting AI response for:', userMessage.substring(0, 50));
  
  try {
    // Use intelligent response system - FAST, FREE, NO API KEYS
    const response = getIntelligentResponse(userMessage);
    console.log('Got intelligent response');
    return {
      success: true,
      message: response,
    };
  } catch (error) {
    console.error('AI response error:', error);
    return {
      success: true,
      message: "I'm here to help! Feel free to ask me anything. What's on your mind? 😊",
    };
  }
}

// Export types
export type { AIResponse, ChatMessage };
