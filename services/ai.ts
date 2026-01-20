// AI Service - Handles Cruz's Helper AI chat functionality
// Uses multiple free AI providers with fallback support

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
Your personality:
- Friendly, warm, and approachable
- Concise but thorough in your responses
- Helpful and proactive in offering solutions
- You can answer questions about the app, provide general assistance, and have casual conversations

Guidelines:
- Keep responses brief but informative (under 200 words unless more detail is needed)
- Be conversational and natural
- If you don't know something, be honest about it
- Never make up factual information
- Use emojis sparingly to keep things friendly`;

// Groq API (Free tier: 14,000 tokens/min)
async function tryGroqAPI(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<AIResponse> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'Groq API key not configured' };
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      return { success: false, error: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;
    
    if (aiMessage) {
      return { success: true, message: aiMessage.trim() };
    }
    
    return { success: false, error: 'No response from Groq' };
  } catch (error) {
    console.error('Groq API exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// HuggingFace Inference API (Free tier available)
async function tryHuggingFaceAPI(userMessage: string): Promise<AIResponse> {
  const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'HuggingFace API key not configured' };
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: userMessage,
          parameters: {
            max_length: 200,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      return { success: false, error: `HuggingFace API error: ${response.status}` };
    }

    const data = await response.json();
    const aiMessage = data.generated_text || data[0]?.generated_text;
    
    if (aiMessage) {
      return { success: true, message: aiMessage.trim() };
    }
    
    return { success: false, error: 'No response from HuggingFace' };
  } catch (error) {
    console.error('HuggingFace API exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Local fallback responses for common queries
function getLocalFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|howdy|greetings)/)) {
    const greetings = [
      "Hey there! 👋 How can I help you today?",
      "Hello! I'm Cruz's Helper. What can I do for you?",
      "Hi! Great to see you. What's on your mind?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // How are you
  if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going")) {
    return "I'm doing great, thanks for asking! 😊 Ready to help you with anything you need. What can I assist you with?";
  }
  
  // Thanks
  if (lowerMessage.match(/(thank|thanks|thx)/)) {
    return "You're welcome! 😊 Is there anything else I can help you with?";
  }
  
  // App help
  if (lowerMessage.includes('how') && (lowerMessage.includes('use') || lowerMessage.includes('work'))) {
    return "I'd be happy to help you navigate the app! You can use the calculator as a regular calculator, or enter the secret code to access the hidden messaging features. Feel free to ask me anything specific!";
  }
  
  // Default
  return "I'm here to help! Could you tell me more about what you need? I can assist with app questions, general queries, or just chat.";
}

// Main function to get AI response with fallbacks
export async function getAIResponse(
  userMessage: string, 
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  console.log('Getting AI response for:', userMessage.substring(0, 50));
  
  // Try Groq first (best free option)
  const groqResponse = await tryGroqAPI(userMessage, conversationHistory);
  if (groqResponse.success) {
    console.log('Got response from Groq');
    return groqResponse;
  }
  
  // Try HuggingFace as second option
  const hfResponse = await tryHuggingFaceAPI(userMessage);
  if (hfResponse.success) {
    console.log('Got response from HuggingFace');
    return hfResponse;
  }
  
  // Fall back to local responses
  console.log('Using local fallback response');
  return {
    success: true,
    message: getLocalFallbackResponse(userMessage),
  };
}

// Export types
export type { AIResponse, ChatMessage };
