import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Keyboard,
  Alert,
  Linking,
  ActivityIndicator,
  UIManager,
  LayoutAnimation,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { Send, Phone, Video, Settings, Image as ImageIcon, FileText, User, X, Info, Pin, BellOff, Lock, Search, LogOut, MapPin, Camera, Crown, Globe, ArrowLeft, ArrowRight, RotateCcw, Home } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import MapView, { Marker } from 'react-native-maps';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { telnyxService } from '../services/telnyx';
import { getAIResponse, ChatMessage } from '../services/ai';
import Purchases, { LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';
import { WebView } from 'react-native-webview';

// Ensure WebBrowser redirect is properly handled
WebBrowser.maybeCompleteAuthSession();

type CalculatorMode = "calculator" | "messages" | "chat" | "videoCall" | "info" | "profile" | "auth" | "developer" | "location" | "camera" | "phoneDialer" | "activeCall" | "activeVideoCall" | "smsChat" | "browser";

// Browser hot links
const BROWSER_HOT_LINKS = [
  { name: 'Lowkeydis', url: 'https://lowkeydis.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: 'Spotify', url: 'https://spotify.com' },
  { name: 'Discord', url: 'https://discord.com' },
];

// Browser data per user
interface BrowserData {
  history: { url: string; title: string; timestamp: Date }[];
  bookmarks: { url: string; title: string }[];
  lastVisitedUrl: string;
}

interface CallLog {
  id: string;
  phoneNumber: string;
  name?: string;
  type: "incoming" | "outgoing" | "missed";
  timestamp: Date;
  duration?: number;
}

interface SMSConversation {
  id: string;
  phoneNumber: string;
  name?: string;
  messages: SMSMessage[];
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface SMSMessage {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "failed";
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "aspen";
  timestamp: Date;
  image?: string;
  file?: { name: string; uri: string };
  effect?: "slam" | "float";
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  profilePicture?: string;
}

interface ChatContact {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  isPinned: boolean;
  isMuted: boolean;
  profilePicture?: string;
  isAI?: boolean;
}

interface UserAccount {
  id: string;
  email: string;
  password: string;
  publicName: string;
  privateName: string;
  lockEnabled: boolean;
  lockCode: string;
  lastLogin: Date;
  profilePicture?: string;
  isGoogleAccount?: boolean;
  phoneNumber?: string;
  whitelisted?: boolean;
}

interface LockPromptState {
  visible: boolean;
  onSuccess: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  address?: string;
}

type LocationVisibility = "everyone" | "contacts" | "nobody" | "silent";

// Responsive sizing helper
const getResponsiveSizes = () => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Scale based on smaller dimension to handle portrait/landscape
  const minDimension = Math.min(screenWidth, screenHeight);
  
  return {
    displayFontSize: Math.max(48, Math.min(72, minDimension * 0.15)),
    buttonFontSize: Math.max(24, Math.min(32, minDimension * 0.08)),
    operatorFontSize: Math.max(28, Math.min(40, minDimension * 0.10)),
    buttonMargin: Math.max(4, Math.min(6, minDimension * 0.01)),
    paddingHorizontal: Math.max(8, Math.min(12, minDimension * 0.02)),
  };
};

export default function CalculatorApp() {
  // Create responsive styles on every render based on screen dimensions
  const styles = createStyles();
  
  const [display, setDisplay] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<string>("");
  const [operation, setOperation] = useState<string>("");
  const [shouldResetDisplay, setShouldResetDisplay] = useState<boolean>(false);
  const [mode, setMode] = useState<CalculatorMode>("calculator");
  const [fadeAnim] = useState(new Animated.Value(1));
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey there!",
      sender: "aspen",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [sendingAs, setSendingAs] = useState<"user" | "aspen">("user");
  const scrollViewRef = useRef<ScrollView>(null);
  const effectAnimations = useRef<{ [key: string]: { scale: Animated.Value; opacity: Animated.Value; translateY: Animated.Value } }>({}).current;
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [keepMessages, setKeepMessages] = useState<boolean>(true);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: "Contact",
    phone: "",
    email: "",
    address: "",
  });
  const [showContactInfo, setShowContactInfo] = useState<boolean>(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState<boolean>(false);
  const [tempContactInfo, setTempContactInfo] = useState<ContactInfo>(contactInfo);
  const [chatBackgroundColor, setChatBackgroundColor] = useState<string>("#000000");
  const [chatBackgroundImage, setChatBackgroundImage] = useState<string | undefined>(undefined);
  const [longPressedMessage, setLongPressedMessage] = useState<string | null>(null);
  const [showMessageActions, setShowMessageActions] = useState<boolean>(false);
  const [showEffectPicker, setShowEffectPicker] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>("");
  const [messagingAppColor, setMessagingAppColor] = useState<string>("#000000");
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const [contacts, setContacts] = useState<ChatContact[]>([
    {
      id: "cruz",
      name: "Cruz's Helper",
      lastMessage: "Hi! I'm here to help you with the app.",
      timestamp: new Date(),
      unread: 0,
      isPinned: false,
      isMuted: false,
      isAI: true,
    },
  ]);
  const [selectedContactId, setSelectedContactId] = useState<string>("cruz");
  const [longPressedContact, setLongPressedContact] = useState<string | null>(null);
  const [showContactActions, setShowContactActions] = useState<boolean>(false);
  const [showImportContacts, setShowImportContacts] = useState<boolean>(false);
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [selectedImportContacts, setSelectedImportContacts] = useState<string[]>([]);
  const [showAddContactManually, setShowAddContactManually] = useState<boolean>(false);
  const [manualContactName, setManualContactName] = useState<string>("");
  const [manualContactPhone, setManualContactPhone] = useState<string>("");
  const [manualContactEmail, setManualContactEmail] = useState<string>("");
  const [aiMessages, setAiMessages] = useState<Message[]>([{
    id: "1",
    text: "Hi! I'm Cruz's Helper. I'm here to help you with the app. Ask me anything!",
    sender: "aspen",
    timestamp: new Date(),
  }]);
  const [confetti, setConfetti] = useState<{ id: string; x: number; y: number; color: string; rotation: number }[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>("");
  const [authPublicName, setAuthPublicName] = useState<string>("");
  const [authPrivateName, setAuthPrivateName] = useState<string>("");
  const [lockPrompt, setLockPrompt] = useState<LockPromptState>({ visible: false, onSuccess: () => {} });
  const [lockCodeInput, setLockCodeInput] = useState<string>("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [devSearchQuery, setDevSearchQuery] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationVisibility, setLocationVisibility] = useState<LocationVisibility>("contacts");
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState<boolean>(false);
  const [dialerInput, setDialerInput] = useState<string>("");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [smsConversations, setSmsConversations] = useState<SMSConversation[]>([]);
  const [activeCallNumber, setActiveCallNumber] = useState<string>("");
  const [activeCallDuration, setActiveCallDuration] = useState<number>(0);
  const [isCallMuted, setIsCallMuted] = useState<boolean>(false);
  const [isCallOnSpeaker, setIsCallOnSpeaker] = useState<boolean>(false);
  const [selectedSMSConversation, setSelectedSMSConversation] = useState<string | null>(null);
  const [smsInputText, setSmsInputText] = useState<string>("");
  const callTimerRef = useRef<any>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const processedAiMessageIndexRef = useRef<number>(0);
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [lastMessageCheck, setLastMessageCheck] = useState<Date>(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const pollingIntervalRef = useRef<any>(null);
  const [isVIP, setIsVIP] = useState<boolean>(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState<boolean>(false);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [userIP, setUserIP] = useState<string>("");
  const _0x7c = [0x31, 0x30, 0x34, 0x2e, 0x31, 0x38, 0x33, 0x2e, 0x32, 0x35, 0x34, 0x2e, 0x37, 0x31];
  
  // Browser state
  const [browserUrl, setBrowserUrl] = useState<string>("https://google.com");
  const [browserTitle, setBrowserTitle] = useState<string>("Browser");
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [browserLoading, setBrowserLoading] = useState<boolean>(false);
  const [browserUrlInput, setBrowserUrlInput] = useState<string>("https://google.com");
  const webViewRef = useRef<WebView>(null);
  
  // Per-user browser data storage
  const [userBrowserData, setUserBrowserData] = useState<{ [userId: string]: BrowserData }>({});
  
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  
  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  
  const { messages: aiAgentMessages, sendMessage: sendAiMessage } = useRorkAgent({
    tools: {},
  });

  // AI conversation history for context
  const aiConversationHistory = useRef<ChatMessage[]>([]);

  // Enhanced AI function using the AI service with fallbacks
  const sendToFreeAI = async (userMessage: string): Promise<string> => {
    try {
      // Build conversation history for context
      const history: ChatMessage[] = aiConversationHistory.current.slice(-6);
      
      // Use the AI service which has multiple providers and fallbacks
      const response = await getAIResponse(userMessage, history);
      
      if (response.success && response.message) {
        // Add to conversation history
        aiConversationHistory.current.push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response.message }
        );
        
        // Keep history manageable
        if (aiConversationHistory.current.length > 20) {
          aiConversationHistory.current = aiConversationHistory.current.slice(-10);
        }
        
        return response.message;
      }
      
      return '';
    } catch (error) {
      console.error('AI service error:', error);
      return '';
    }
  };

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
        console.log('User IP:', data.ip);
      } catch (error) {
        console.log('Failed to fetch IP:', error);
      }
    };
    fetchIP();
  }, []);

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        const _0x6a = process.env.EXPO_PUBLIC_RC_IOS || '';
        const _0x6b = process.env.EXPO_PUBLIC_RC_ANDROID || '';

        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: _0x6a });
        } else if (Platform.OS === 'android') {
          await Purchases.configure({ apiKey: _0x6b });
        }

        console.log('RevenueCat configured successfully');
        
        const customerInfo = await Purchases.getCustomerInfo();
        setIsVIP(customerInfo.entitlements.active['vip'] !== undefined);
        
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setOfferings(offerings.current);
        }
      } catch (error) {
        console.error('RevenueCat configuration error:', error);
      }
    };

    if (Platform.OS !== 'web') {
      initRevenueCat();
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoadingSubscription(true);
      
      if (!offerings || !offerings.availablePackages || offerings.availablePackages.length === 0) {
        Alert.alert('Error', 'No subscription packages available');
        return;
      }

      const packageToPurchase = offerings.availablePackages[0];
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      if (customerInfo.entitlements.active['vip']) {
        setIsVIP(true);
        Alert.alert('Success', 'Welcome to VIP! Enjoy your premium features.');
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      }
      console.error('Purchase error:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoadingSubscription(true);
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active['vip']) {
        setIsVIP(true);
        Alert.alert('Success', 'Your VIP subscription has been restored!');
      } else {
        Alert.alert('No Subscription', 'No active subscription found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      console.error('Restore error:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const updateLocation = useCallback(async () => {
    if (locationVisibility === "silent") return;
    
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = geocode[0]
        ? `${geocode[0].city || ""}, ${geocode[0].region || ""}`
        : "Unknown location";

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(),
        address,
      });
    } catch (error) {
      console.log("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  }, [locationVisibility]);

  useEffect(() => {
    if (mode === "messages") {
      updateLocation();
    }
  }, [mode, updateLocation]);
  
  useEffect(() => {
    const glitchAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );
    glitchAnimation.start();
    return () => glitchAnimation.stop();
  }, [glitchAnim]);
  
  useEffect(() => {
    if (aiAgentMessages.length > processedAiMessageIndexRef.current) {
      const newMessages = aiAgentMessages.slice(processedAiMessageIndexRef.current);
      console.log('Processing new AI messages:', newMessages.length);
      
      const lastMessage = newMessages[newMessages.length - 1];
      
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.parts) {
        let fullText = '';
        let hasToolCalls = false;
        
        for (const part of lastMessage.parts) {
          if (part.type === 'text' && part.text) {
            fullText += part.text;
          }
          if (part.type === 'tool') {
            hasToolCalls = true;
          }
        }
        
        fullText = fullText.trim();
        
        if (fullText && !hasToolCalls) {
          let cleanResponse = fullText
            .replace(/^(Cruz's Helper:|Assistant:|AI:|Helper:)\s*/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          
          if (cleanResponse.length > 0) {
            setIsAiTyping(false);
            
            setAiMessages(prev => {
              const existingIds = new Set(prev.map(m => m.text));
              if (existingIds.has(cleanResponse)) {
                console.log('Duplicate message content, skipping');
                return prev;
              }
              
              const aiResponse: Message = {
                id: Date.now().toString() + '-ai-' + Math.random().toString(36).substr(2, 9),
                text: cleanResponse,
                sender: 'aspen',
                timestamp: new Date(),
              };
              
              console.log('Adding AI response:', cleanResponse.substring(0, 50));
              
              setContacts(c => c.map(contact => 
                contact.id === 'cruz' ? { ...contact, lastMessage: cleanResponse.substring(0, 50) + (cleanResponse.length > 50 ? '...' : ''), timestamp: new Date() } : contact
              ));
              
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
              
              return [...prev, aiResponse];
            });
          }
        }
      }
      
      processedAiMessageIndexRef.current = aiAgentMessages.length;
    }
  }, [aiAgentMessages]);

  const pollForMessages = useCallback(async () => {
    try {
      const result = await telnyxService.getMessages(lastMessageCheck);
      
      if (result.success && result.messages && result.messages.length > 0) {
        const newMessages = result.messages.filter(msg => 
          !processedMessageIdsRef.current.has(msg.sid)
        );

        if (newMessages.length > 0) {
          console.log(`📨 Processing ${newMessages.length} new messages`);
          
          newMessages.forEach(msg => {
            processedMessageIdsRef.current.add(msg.sid);
            
            const fromNumber = msg.from;
            const messageBody = msg.body;
            const timestamp = new Date(msg.date_sent);
            
            console.log('Received message from:', fromNumber, 'Body:', messageBody);
            
            setSmsConversations(prevConvos => {
              let existingConvo = prevConvos.find(c => c.phoneNumber === fromNumber);
              
              const newSMSMessage: SMSMessage = {
                id: msg.sid,
                text: messageBody,
                sender: 'other',
                timestamp: timestamp,
                status: 'delivered',
              };
              
              if (existingConvo) {
                const messageExists = existingConvo.messages.some(m => m.id === msg.sid);
                if (messageExists) {
                  return prevConvos;
                }
                
                return prevConvos.map(c => 
                  c.phoneNumber === fromNumber
                    ? {
                        ...c,
                        messages: [...c.messages, newSMSMessage],
                        lastMessage: messageBody,
                        timestamp: timestamp,
                        unread: c.id === selectedSMSConversation ? c.unread : c.unread + 1,
                      }
                    : c
                );
              } else {
                const newConvo: SMSConversation = {
                  id: Date.now().toString() + '-' + fromNumber,
                  phoneNumber: fromNumber,
                  messages: [newSMSMessage],
                  lastMessage: messageBody,
                  timestamp: timestamp,
                  unread: 1,
                };
                return [newConvo, ...prevConvos];
              }
            });
          });
          
          setLastMessageCheck(new Date());
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [lastMessageCheck, selectedSMSConversation]);

  useEffect(() => {
    if (mode === 'phoneDialer' || mode === 'smsChat') {
      console.log('🔄 Starting message polling...');
      pollForMessages();
      
      pollingIntervalRef.current = setInterval(() => {
        pollForMessages();
      }, 5000);
      
      return () => {
        if (pollingIntervalRef.current) {
          console.log('⏹️ Stopping message polling');
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [mode, pollForMessages]);

  const handleNumberPress = (num: string) => {
    if (shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperationPress = (op: string) => {
    if (operation && !shouldResetDisplay) {
      handleEquals();
    }
    setPreviousValue(display);
    setOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (!operation || !previousValue) return;

    const prev = parseFloat(previousValue);
    const current = parseFloat(display);
    let result = 0;

    switch (operation) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "×":
        result = prev * current;
        break;
      case "÷":
        result = current !== 0 ? prev / current : 0;
        break;
    }

    const resultStr = result.toString();
    setDisplay(resultStr);
    setPreviousValue("");
    setOperation("");
    setShouldResetDisplay(true);

    if (resultStr === "69420" || display === "69420") {
      setTimeout(() => {
        switchMode("messages");
      }, 300);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue("");
    setOperation("");
    setShouldResetDisplay(false);
  };

  const handlePercentage = () => {
    const value = parseFloat(display) / 100;
    setDisplay(value.toString());
  };

  const handleToggleSign = () => {
    if (display === "0") return;
    const value = parseFloat(display) * -1;
    setDisplay(value.toString());
  };

  const switchMode = (newMode: CalculatorMode) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setMode(newMode);
    }, 200);
  };

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const handleSendMessage = async (image?: string, file?: { name: string; uri: string }, effect?: "slam" | "float") => {
    if (inputText.trim() === "" && !image && !file) return;

    const selectedContact = contacts.find(c => c.id === selectedContactId);
    
    if (selectedContact?.isAI) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: "user",
        timestamp: new Date(),
        image,
        file,
      };
      
      const updatedAiMessages = [...aiMessages, userMessage];
      setAiMessages(updatedAiMessages);
      
      const messageToSend = inputText.trim();
      setInputText("");
      setIsAiTyping(true);
      
      setContacts(contacts.map(c => 
        c.id === selectedContactId 
          ? { ...c, lastMessage: messageToSend, timestamp: new Date() } 
          : c
      ));
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      try {
        console.log("Sending message to AI:", messageToSend);
        
        // Try free AI first (Groq), fallback to rork agent
        const freeAiResponse = await sendToFreeAI(messageToSend);
        
        if (freeAiResponse) {
          // Got response from free AI
          setIsAiTyping(false);
          const aiResponse: Message = {
            id: Date.now().toString() + '-ai-' + Math.random().toString(36).substr(2, 9),
            text: freeAiResponse,
            sender: 'aspen',
            timestamp: new Date(),
          };
          
          setAiMessages(prev => [...prev, aiResponse]);
          setContacts(c => c.map(contact => 
            contact.id === 'cruz' ? { ...contact, lastMessage: freeAiResponse.substring(0, 50) + (freeAiResponse.length > 50 ? '...' : ''), timestamp: new Date() } : contact
          ));
          
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          // Fallback to rork agent
          const prompt = `You are Cruz's Helper, a friendly and helpful AI assistant. Answer the user's question directly and concisely. If the user asks about weather, news, facts, or anything that would need current information, provide the best answer you can based on your knowledge. Always give a single, clear, well-formatted response. Never split your answer into multiple messages. Be conversational and helpful.\n\nUser question: ${messageToSend}`;
          await sendAiMessage(prompt);
        }
        console.log("AI message sent successfully");
      } catch (error) {
        console.error("AI Error:", error);
        setIsAiTyping(false);
        const errorMessage: Message = {
          id: Date.now().toString() + '-error',
          text: "Sorry, I'm having trouble responding right now. Please try again.",
          sender: 'aspen',
          timestamp: new Date(),
        };
        setAiMessages(prev => [...prev, errorMessage]);
        setContacts(prev => prev.map(c => 
          c.id === 'cruz' ? { ...c, lastMessage: "Error - please try again", timestamp: new Date() } : c
        ));
      }
    } else {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: sendingAs,
        timestamp: new Date(),
        image,
        file,
        effect,
      };

      const updatedMessages = keepMessages ? [...messages, newMessage] : [messages[0], newMessage];
      setMessages(updatedMessages);
      setInputText("");

      if (effect) {
        playMessageEffect(newMessage.id, effect);
      }
      
      setContacts(contacts.map(c => 
        c.id === selectedContactId 
          ? { ...c, lastMessage: inputText.trim() || "Image", timestamp: new Date() } 
          : c
      ));

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const playMessageEffect = (messageId: string, effect: "slam" | "float") => {
    if (!effectAnimations[messageId]) {
      effectAnimations[messageId] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
      };
    }

    const { scale, opacity, translateY } = effectAnimations[messageId];

    if (effect === "slam") {
      const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
        id: `${messageId}-confetti-${i}`,
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        color: ['#FF3B30', '#FF9F0A', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#FF2D55'][Math.floor(Math.random() * 7)],
        rotation: Math.random() * 360,
      }));
      setConfetti(confettiParticles);
      
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 5,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(() => setConfetti([]), 500);
      });
    } else if (effect === "float") {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        translateY.setValue(0);
        opacity.setValue(1);
      });
    }
  };

  const handleLongPressMessage = (messageId: string) => {
    setLongPressedMessage(messageId);
    setShowMessageActions(true);
  };

  const handleEditMessage = () => {
    const message = messages.find((m) => m.id === longPressedMessage);
    if (message) {
      setEditingMessageId(message.id);
      setEditingMessageText(message.text);
      setShowMessageActions(false);
    }
  };

  const handleDeleteMessage = () => {
    setMessages(messages.filter((m) => m.id !== longPressedMessage));
    setShowMessageActions(false);
    setLongPressedMessage(null);
  };

  const handleApplyEffect = (effect: "slam" | "float") => {
    setShowEffectPicker(false);
    setShowMessageActions(false);
    if (longPressedMessage) {
      playMessageEffect(longPressedMessage, effect);
    }
    setLongPressedMessage(null);
  };

  const saveEditedMessage = () => {
    setMessages(
      messages.map((m) =>
        m.id === editingMessageId ? { ...m, text: editingMessageText } : m
      )
    );
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const handleImagePicker = async () => {
    setShowImageSourcePicker(true);
  };

  const openImageLibrary = async () => {
    setShowImageSourcePicker(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleSendMessage(result.assets[0].uri, undefined);
    }
  };

  const openCameraForChat = async () => {
    setShowImageSourcePicker(false);
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera permission is required to take photos.");
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleSendMessage(result.assets[0].uri, undefined);
    }
  };

  const handleFilePicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      handleSendMessage(undefined, { name: result.assets[0].name, uri: result.assets[0].uri });
    }
  };

  const panicButton = () => {
    switchMode("calculator");
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const saveContactInfo = () => {
    setContactInfo(tempContactInfo);
    setIsEditingContactInfo(false);
  };

  const handleChangeProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTempContactInfo({ ...tempContactInfo, profilePicture: result.assets[0].uri });
    }
  };

  const handleChangeChatBackground = async (type: "color" | "image") => {
    if (type === "image") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setChatBackgroundImage(result.assets[0].uri);
        setChatBackgroundColor("#000000");
      }
    }
  };

  const openContactInfo = () => {
    setTempContactInfo(contactInfo);
    setShowContactInfo(true);
  };

  const openChat = (contactId: string) => {
    setSelectedContactId(contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, unread: 0 } : c
      ));
    }
    switchMode("chat");
  };

  const closeChat = () => {
    switchMode("messages");
  };

  const toggleSendingAs = () => {
    setSendingAs(sendingAs === "user" ? "aspen" : "user");
  };

  const openVideoCall = () => {
    const contact = contacts.find(c => c.id === selectedContactId);
    if (contact?.isAI) {
      Alert.alert("Not Available", "Video calls with AI are not available.");
      return;
    }
    Alert.alert("Video Call", "Video calling feature coming soon!");
  };

  const closeVideoCall = () => {
    switchMode("chat");
  };
  
  const openInfoScreen = () => {
    switchMode("info");
  };
  
  const closeInfoScreen = () => {
    switchMode("messages");
  };
  
  const handleLongPressContact = (contactId: string) => {
    setLongPressedContact(contactId);
    setShowContactActions(true);
  };
  
  const handlePinContact = () => {
    const contact = contacts.find(c => c.id === longPressedContact);
    if (!contact) return;
    
    const pinnedCount = contacts.filter(c => c.isPinned).length;
    
    if (!contact.isPinned && pinnedCount >= 3) {
      Alert.alert("Maximum Pins Reached", "You can only pin up to 3 contacts at a time.");
      setShowContactActions(false);
      return;
    }
    
    setContacts(contacts.map(c => 
      c.id === longPressedContact ? { ...c, isPinned: !c.isPinned } : c
    ));
    setShowContactActions(false);
    setLongPressedContact(null);
  };
  
  const handleMuteContact = () => {
    setContacts(contacts.map(c => 
      c.id === longPressedContact ? { ...c, isMuted: !c.isMuted } : c
    ));
    setShowContactActions(false);
    setLongPressedContact(null);
  };
  
  const handleDeleteContact = () => {
    setContacts(contacts.filter(c => c.id !== longPressedContact));
    setShowContactActions(false);
    setLongPressedContact(null);
  };
  
  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      setDeviceContacts(data);
      setShowImportContacts(true);
    } else {
      Alert.alert("Permission Denied", "Please allow access to contacts in settings.");
    }
  };
  
  const toggleImportContact = (contactId: string) => {
    if (selectedImportContacts.includes(contactId)) {
      setSelectedImportContacts(selectedImportContacts.filter(id => id !== contactId));
    } else {
      setSelectedImportContacts([...selectedImportContacts, contactId]);
    }
  };
  
  const importSelectedContacts = () => {
    const newContacts: ChatContact[] = deviceContacts
      .filter(c => selectedImportContacts.includes(c.id))
      .map(c => ({
        id: c.id,
        name: c.name || "Unknown",
        lastMessage: "",
        timestamp: new Date(),
        unread: 0,
        isPinned: false,
        isMuted: false,
      }));
    
    setContacts([...contacts, ...newContacts]);
    setShowImportContacts(false);
    setSelectedImportContacts([]);
    
    if (newContacts.length > 0) {
      setTimeout(() => {
        setSelectedContactId(newContacts[0].id);
        switchMode("chat");
      }, 300);
    }
  };
  
  const handleAddContactManually = () => {
    if (!manualContactName.trim()) {
      Alert.alert("Error", "Please enter a contact name");
      return;
    }
    
    const newContact: ChatContact = {
      id: Date.now().toString(),
      name: manualContactName.trim(),
      lastMessage: "",
      timestamp: new Date(),
      unread: 0,
      isPinned: false,
      isMuted: false,
    };
    
    setContacts([...contacts, newContact]);
    setShowAddContactManually(false);
    setManualContactName("");
    setManualContactPhone("");
    setManualContactEmail("");
    
    setTimeout(() => {
      setSelectedContactId(newContact.id);
      switchMode("chat");
    }, 300);
  };
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const openProfile = () => {
    if (currentUser) {
      switchMode("profile");
    } else {
      switchMode("auth");
    }
  };

  const generatePhoneNumber = () => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const firstPart = Math.floor(Math.random() * 900) + 100;
    const secondPart = Math.floor(Math.random() * 9000) + 1000;
    return `+1 (${areaCode}) ${firstPart}-${secondPart}`;
  };

  const handleSignUp = () => {
    if (!authEmail || !authPassword || !authPublicName || !authPrivateName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (userAccounts.find(u => u.email === authEmail)) {
      Alert.alert("Error", "Account already exists");
      return;
    }

    const newAccount: UserAccount = {
      id: Date.now().toString(),
      email: authEmail,
      password: authPassword,
      publicName: authPublicName,
      privateName: authPrivateName,
      lockEnabled: false,
      lockCode: "",
      lastLogin: new Date(),
      phoneNumber: generatePhoneNumber(),
    };

    setUserAccounts([...userAccounts, newAccount]);
    setCurrentUser(newAccount);
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthPublicName("");
    setAuthPrivateName("");
    switchMode("profile");
  };

  const handleSignIn = () => {
    if (!authEmail || !authPassword) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    const account = userAccounts.find(u => u.email === authEmail && u.password === authPassword);
    if (!account) {
      Alert.alert("Error", "Invalid credentials");
      return;
    }

    account.lastLogin = new Date();
    if (!account.phoneNumber) {
      account.phoneNumber = generatePhoneNumber();
    }
    setCurrentUser(account);
    setAuthEmail("");
    setAuthPassword("");
    switchMode("profile");
  };

  const handleGoogleSignIn = async () => {
    try {
      // Use environment variable for client ID, fallback to hardcoded for development
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '1046911026897-iqjnqvjcpfv0r4vvagm5m37g7b5g4i8e.apps.googleusercontent.com';
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'rork-app',
        path: 'auth/callback',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'openid email profile',
        prompt: 'select_account',
      }).toString()}`;

      console.log('Opening Google Sign-In:', authUrl);
      console.log('Redirect URI:', redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        showInRecents: true,
        preferEphemeralSession: false,
      });

      console.log('Auth result:', result);

      if (result.type === 'success' && result.url) {
        // Parse the URL fragment for the access token
        const urlParts = result.url.split('#');
        const fragment = urlParts[1] || '';
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');

        if (accessToken) {
          // Fetch user info from Google
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          
          if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info');
          }
          
          const userInfo = await userInfoResponse.json();

          console.log('Google user info:', userInfo);

          const googleEmail = userInfo.email;
          const googleName = userInfo.name || 'Google User';
          const googlePicture = userInfo.picture;

          // Check for existing account
          const existingAccount = userAccounts.find(u => u.email === googleEmail);

          if (existingAccount) {
            // Update existing account
            const updatedAccount = {
              ...existingAccount,
              lastLogin: new Date(),
              profilePicture: googlePicture || existingAccount.profilePicture,
              phoneNumber: existingAccount.phoneNumber || generatePhoneNumber(),
            };
            
            setUserAccounts(userAccounts.map(u => 
              u.email === googleEmail ? updatedAccount : u
            ));
            setCurrentUser(updatedAccount);
            
            // Smooth transition with layout animation
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            switchMode('profile');
          } else {
            // Create new account
            const newAccount: UserAccount = {
              id: Date.now().toString(),
              email: googleEmail,
              password: 'google-oauth-' + Date.now(),
              publicName: googleName,
              privateName: googleName,
              lockEnabled: false,
              lockCode: '',
              lastLogin: new Date(),
              profilePicture: googlePicture,
              isGoogleAccount: true,
              phoneNumber: generatePhoneNumber(),
            };

            setUserAccounts([...userAccounts, newAccount]);
            setCurrentUser(newAccount);
            
            // Smooth transition with layout animation
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            switchMode('profile');
          }
          
          Alert.alert('Welcome!', `Signed in as ${googleName}`);
        } else {
          Alert.alert('Sign In Error', 'Failed to get access token from Google. Please try again.');
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google Sign-In');
      } else if (result.type === 'dismiss') {
        console.log('Auth session was dismissed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert(
        'Sign In Failed', 
        'Unable to sign in with Google. Please check your internet connection and try again.'
      );
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    switchMode("messages");
  };

  const handleUpdateProfile = () => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      publicName: authPublicName || currentUser.publicName,
      privateName: authPrivateName || currentUser.privateName,
      email: authEmail || currentUser.email,
    };

    setUserAccounts(userAccounts.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setAuthPublicName("");
    setAuthPrivateName("");
    setAuthEmail("");
    Alert.alert("Success", "Profile updated");
  };

  const handleUpdatePassword = () => {
    if (!currentUser) return;
    if (currentPasswordInput !== currentUser.password) {
      Alert.alert("Error", "Current password is incorrect");
      return;
    }
    if (!newPasswordInput) {
      Alert.alert("Error", "Please enter new password");
      return;
    }

    const updatedUser = {
      ...currentUser,
      password: newPasswordInput,
    };

    setUserAccounts(userAccounts.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    Alert.alert("Success", "Password updated");
  };

  const handleToggleLock = () => {
    if (!currentUser) return;

    if (!currentUser.lockEnabled) {
      setLockPrompt({
        visible: true,
        onSuccess: () => {
          if (lockCodeInput.length < 4) {
            Alert.alert("Error", "Lock code must be at least 4 characters");
            return;
          }
          const updatedUser = {
            ...currentUser,
            lockEnabled: true,
            lockCode: lockCodeInput,
          };
          setUserAccounts(userAccounts.map(u => u.id === currentUser.id ? updatedUser : u));
          setCurrentUser(updatedUser);
          setLockCodeInput("");
          setLockPrompt({ visible: false, onSuccess: () => {} });
          Alert.alert("Success", "Lock enabled");
        },
      });
    } else {
      const updatedUser = {
        ...currentUser,
        lockEnabled: false,
        lockCode: "",
      };
      setUserAccounts(userAccounts.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      Alert.alert("Success", "Lock disabled");
    }
  };

  const checkLockAndOpenChat = (contactId: string) => {
    if (currentUser?.lockEnabled) {
      setLockPrompt({
        visible: true,
        onSuccess: () => {
          if (lockCodeInput === currentUser.lockCode) {
            setLockCodeInput("");
            setLockPrompt({ visible: false, onSuccess: () => {} });
            setTimeout(() => {
              openChat(contactId);
            }, 100);
          } else {
            Alert.alert("Error", "Incorrect lock code");
            setLockCodeInput("");
          }
        },
      });
    } else {
      openChat(contactId);
    }
  };

  const [showDevLogin, setShowDevLogin] = useState<boolean>(false);
  const [devPinInput, setDevPinInput] = useState<string>("");

  const openDeveloperPanel = () => {
    const _0x8a = _0x7c.map(c => String.fromCharCode(c)).join('');
    if (userIP && userIP === _0x8a) {
      switchMode("developer");
      return;
    }
    setShowDevLogin(true);
  };

  const handleDevLogin = () => {
    const _0x4f = [0x31, 0x30, 0x39, 0x30];
    const _0x5a = _0x4f.map(c => String.fromCharCode(c)).join('');
    if (devPinInput === _0x5a) {
      setShowDevLogin(false);
      setDevPinInput("");
      switchMode("developer");
    } else {
      Alert.alert("Access Denied", "Invalid PIN.");
      setDevPinInput("");
    }
  };

  const closeDeveloperPanel = () => {
    switchMode("messages");
  };

  const openLocationScreen = () => {
    switchMode("location");
  };

  const closeLocationScreen = () => {
    switchMode("messages");
  };

  const openCameraScreen = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera permission is required to take photos and videos.");
        return;
      }
    }
    switchMode("camera");
  };

  const closeCameraScreen = () => {
    switchMode("messages");
  };

  const toggleCameraFacing = () => {
    setCameraFacing(current => (current === "back" ? "front" : "back"));
  };

  // Browser functions
  const openBrowser = () => {
    // Load user's last visited URL if available
    if (currentUser) {
      const userData = userBrowserData[currentUser.id];
      if (userData?.lastVisitedUrl) {
        setBrowserUrl(userData.lastVisitedUrl);
        setBrowserUrlInput(userData.lastVisitedUrl);
      }
    }
    switchMode("browser");
  };

  const closeBrowser = () => {
    // Save current URL for user
    if (currentUser) {
      setUserBrowserData(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          lastVisitedUrl: browserUrl,
          history: [
            ...(prev[currentUser.id]?.history || []),
          ],
          bookmarks: prev[currentUser.id]?.bookmarks || [],
        },
      }));
    }
    switchMode("messages");
  };

  const navigateToUrl = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    setBrowserUrl(finalUrl);
    setBrowserUrlInput(finalUrl);
  };

  const addToHistory = (url: string, title: string) => {
    if (!currentUser) return;
    
    setUserBrowserData(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id],
        history: [
          { url, title, timestamp: new Date() },
          ...(prev[currentUser.id]?.history || []).slice(0, 99), // Keep last 100 entries
        ],
        bookmarks: prev[currentUser.id]?.bookmarks || [],
        lastVisitedUrl: url,
      },
    }));
  };

  const handleBrowserNavigationChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setBrowserUrl(navState.url);
    setBrowserUrlInput(navState.url);
    setBrowserLoading(navState.loading);
    
    if (navState.title && !navState.loading) {
      setBrowserTitle(navState.title);
      addToHistory(navState.url, navState.title);
    }
  };

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const refreshBrowser = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const goHome = () => {
    navigateToUrl('https://google.com');
  };

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      Alert.alert("Photo Taken", "Photo saved successfully!", [
        { text: "Take Another", style: "default" },
        { text: "Done", onPress: () => closeCameraScreen() },
      ]);
      console.log("Photo:", photo.uri);
    } catch (error) {
      console.log("Camera error:", error);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const filteredAccounts = userAccounts.filter(account =>
    account.email.toLowerCase().includes(devSearchQuery.toLowerCase()) ||
    account.publicName.toLowerCase().includes(devSearchQuery.toLowerCase()) ||
    account.privateName.toLowerCase().includes(devSearchQuery.toLowerCase())
  );

  const renderCalculator = () => (
    <Animated.View style={[styles.calculatorContainer, { opacity: fadeAnim }]}>
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          <CalcButton
            text="C"
            onPress={handleClear}
            style={styles.functionButton}
            textStyle={styles.functionButtonText}
          />
          <CalcButton
            text="±"
            onPress={handleToggleSign}
            style={styles.functionButton}
            textStyle={styles.functionButtonText}
          />
          <CalcButton
            text="%"
            onPress={handlePercentage}
            style={styles.functionButton}
            textStyle={styles.functionButtonText}
          />
          <CalcButton
            text="÷"
            onPress={() => handleOperationPress("÷")}
            style={styles.operatorButton}
            textStyle={styles.operatorButtonText}
          />
        </View>

        <View style={styles.buttonRow}>
          <CalcButton text="7" onPress={() => handleNumberPress("7")} />
          <CalcButton text="8" onPress={() => handleNumberPress("8")} />
          <CalcButton text="9" onPress={() => handleNumberPress("9")} />
          <CalcButton
            text="×"
            onPress={() => handleOperationPress("×")}
            style={styles.operatorButton}
            textStyle={styles.operatorButtonText}
          />
        </View>

        <View style={styles.buttonRow}>
          <CalcButton text="4" onPress={() => handleNumberPress("4")} />
          <CalcButton text="5" onPress={() => handleNumberPress("5")} />
          <CalcButton text="6" onPress={() => handleNumberPress("6")} />
          <CalcButton
            text="-"
            onPress={() => handleOperationPress("-")}
            style={styles.operatorButton}
            textStyle={styles.operatorButtonText}
          />
        </View>

        <View style={styles.buttonRow}>
          <CalcButton text="1" onPress={() => handleNumberPress("1")} />
          <CalcButton text="2" onPress={() => handleNumberPress("2")} />
          <CalcButton text="3" onPress={() => handleNumberPress("3")} />
          <CalcButton
            text="+"
            onPress={() => handleOperationPress("+")}
            style={styles.operatorButton}
            textStyle={styles.operatorButtonText}
          />
        </View>

        <View style={styles.buttonRow}>
          <CalcButton
            text="0"
            onPress={() => handleNumberPress("0")}
            style={styles.zeroButton}
          />
          <CalcButton text="." onPress={() => handleNumberPress(".")} />
          <CalcButton
            text="="
            onPress={handleEquals}
            style={styles.operatorButton}
            textStyle={styles.operatorButtonText}
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderMessages = () => {
    const sortedContacts = [...contacts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    const iconColor = messagingAppColor === "#007AFF" ? "#000000" : "#007AFF";
    
    return (
      <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim, backgroundColor: messagingAppColor }]}>
        <View style={styles.messagesHeader}>
          <TouchableOpacity onPress={panicButton} style={styles.panicButton}>
            <Text style={styles.panicEmoji}>📲</Text>
          </TouchableOpacity>
          <View style={styles.messagesHeaderCenter}>
            <Animated.View style={{ transform: [{ translateX: glitchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) }] }}>
              <Text style={styles.cruzerTitle}>Cruzer</Text>
            </Animated.View>
            {currentUser?.phoneNumber && (
              <Text style={styles.phoneNumberText}>{currentUser.phoneNumber}</Text>
            )}
          </View>
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity onPress={() => switchMode("phoneDialer")} style={styles.panicButton}>
              <Phone size={24} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openInfoScreen} style={styles.panicButton}>
              <Info size={24} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openProfile} style={styles.panicButton}>
              <User size={24} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openDeveloperPanel} style={styles.developerButton}>
              <Text style={styles.developerEmoji}>💻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.addContactButtonContainer}>
          <TouchableOpacity
            style={styles.addContactButton}
            onPress={() => setShowAddContactManually(true)}
          >
            <Text style={styles.addContactButtonText}>+</Text>
            <Text style={styles.addContactButtonLabel}>Add Contact</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.messagesList}>
          {sortedContacts.map(contact => (
            <TouchableOpacity 
              key={contact.id}
              style={styles.messageItem} 
              onPress={() => checkLockAndOpenChat(contact.id)}
              onLongPress={() => handleLongPressContact(contact.id)}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, contact.isAI && { backgroundColor: "#34C759" }]}>
                  {contact.profilePicture ? (
                    <Image source={{ uri: contact.profilePicture }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{contact.name[0]}</Text>
                  )}
                </View>
                {contact.isPinned && (
                  <View style={styles.pinBadge}>
                    <Pin size={12} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <View style={styles.messageNameRow}>
                    <Text style={styles.messageName}>{contact.name}</Text>
                    {contact.isMuted && (
                      <BellOff size={14} color="#8E8E93" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                  <Text style={styles.messageTime}>
                    {contact.timestamp.toLocaleDateString() === new Date().toLocaleDateString()
                      ? formatTime(contact.timestamp)
                      : contact.timestamp.toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.messagePreview, contact.isMuted && { color: "#5E5E63" }]}>
                  {contact.lastMessage || "No messages yet"}
                </Text>
              </View>
              {contact.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{contact.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.bottomNavBar}>
          <TouchableOpacity onPress={openLocationScreen} style={styles.bottomNavButton}>
            <MapPin size={24} color={mode === "location" ? "#007AFF" : "#8E8E93"} strokeWidth={2} />
            <Text style={[styles.bottomNavText, mode === "location" && styles.bottomNavTextActive]}>Location</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.bottomNavButton}>
            <Send size={24} color={mode === "messages" ? "#007AFF" : "#8E8E93"} strokeWidth={2} />
            <Text style={[styles.bottomNavText, mode === "messages" && styles.bottomNavTextActive]}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openCameraScreen} style={styles.bottomNavButton}>
            <Camera size={24} color={mode === "camera" ? "#007AFF" : "#8E8E93"} strokeWidth={2} />
            <Text style={[styles.bottomNavText, mode === "camera" && styles.bottomNavTextActive]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openBrowser} style={styles.bottomNavButton}>
            <Globe size={24} color={mode === "browser" ? "#007AFF" : "#8E8E93"} strokeWidth={2} />
            <Text style={[styles.bottomNavText, mode === "browser" && styles.bottomNavTextActive]}>Browser</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderChat = () => {
    const selectedContact = contacts.find(c => c.id === selectedContactId);
    const currentMessages = selectedContact?.isAI ? aiMessages : messages;
    const showSwitcher = !selectedContact?.isAI;
    
    return (
    <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
      <KeyboardAvoidingView
        style={styles.chatKeyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <TouchableOpacity onPress={panicButton} style={styles.panicButtonSmall}>
              <Text style={styles.panicEmojiSmall}>📲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeChat} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chatHeaderCenter}>
            <TouchableOpacity onPress={openContactInfo} style={[styles.smallAvatar, selectedContact?.isAI && { backgroundColor: "#34C759" }]}>
              {contactInfo.profilePicture ? (
                <Image source={{ uri: contactInfo.profilePicture }} style={styles.smallAvatarImage} />
              ) : (
                <Text style={styles.smallAvatarText}>{selectedContact?.name?.[0] || "A"}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.chatHeaderName}>{selectedContact?.name || contactInfo.name}</Text>
            {showSwitcher && (
              <TouchableOpacity onPress={toggleSendingAs} style={styles.switcherButton}>
                <Text style={styles.switcherEmoji}>👀</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerIconButton} onPress={() => Alert.alert("Voice Call", "Voice calling feature coming soon!")}>
              <Phone size={22} color="#007AFF" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={openVideoCall}>
              <Video size={24} color="#007AFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chatMessages}>
          {chatBackgroundImage && (
            <Image
              source={{ uri: chatBackgroundImage }}
              style={styles.chatBackgroundImage}
              resizeMode="cover"
            />
          )}
          <ScrollView
            ref={scrollViewRef}
            style={[styles.chatMessagesScroll, { backgroundColor: chatBackgroundImage ? "transparent" : chatBackgroundColor }]}
            contentContainerStyle={styles.chatMessagesContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {currentMessages.map((message) => {
                      if (message.text === '') return null;
              const effectAnim = effectAnimations[message.id];
              const hasEffect = message.effect === 'slam' || message.effect === 'float';

              return (
                <View key={message.id}>
                  <Animated.View style={hasEffect && effectAnim ? {
                    transform: [
                      { scale: effectAnim.scale },
                      { translateY: effectAnim.translateY },
                    ],
                    opacity: effectAnim.opacity,
                  } : undefined}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onLongPress={() => handleLongPressMessage(message.id)}
                      style={[
                        styles.messageBubble,
                        message.sender === "user"
                          ? styles.userBubble
                          : styles.aspenBubble,
                      ]}
                    >
                      {message.image && (
                        <Image
                          source={{ uri: message.image }}
                          style={styles.messageImage}
                          resizeMode="cover"
                        />
                      )}
                      {message.file && (
                        <View style={styles.fileContainer}>
                          <FileText size={24} color="#007AFF" />
                          <Text style={styles.fileName}>{message.file.name}</Text>
                        </View>
                      )}
                      {message.text !== "" && (
                        <Text
                          style={[
                            styles.messageBubbleText,
                            message.sender === "user"
                              ? styles.userBubbleText
                              : styles.aspenBubbleText,
                          ]}
                        >
                          {message.text}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                  <Text
                    style={[
                      styles.messageTimestamp,
                      message.sender === "user"
                        ? styles.messageTimestampRight
                        : styles.messageTimestampLeft,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              );
            })}
                            {isAiTyping && selectedContact?.isAI && (
                              <View style={styles.typingIndicator}>
                                <View style={styles.typingBubble}>
                                  <View style={styles.typingDots}>
                                    <View style={[styles.typingDot, styles.typingDot1]} />
                                    <View style={[styles.typingDot, styles.typingDot2]} />
                                    <View style={[styles.typingDot, styles.typingDot3]} />
                                  </View>
                                </View>
                              </View>
                            )}
          </ScrollView>
          {confetti.length > 0 && (
            <View style={styles.confettiContainer}>
              {confetti.map(particle => (
                <Animated.View
                  key={particle.id}
                  style={[
                    styles.confettiParticle,
                    {
                      backgroundColor: particle.color,
                      left: `${50 + particle.x}%`,
                      top: `${50 + particle.y}%`,
                      transform: [{ rotate: `${particle.rotation}deg` }],
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.dismissKeyboardButton}
          onPress={dismissKeyboard}
          activeOpacity={0.6}
        >
          <Text style={styles.dismissKeyboardText}>⌨️</Text>
        </TouchableOpacity>

        {editingMessageId && (
          <View style={styles.editingBar}>
            <View style={styles.editingBarContent}>
              <Text style={styles.editingBarText}>Editing message</Text>
              <TouchableOpacity onPress={cancelEditMessage}>
                <X size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.chatInputContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleImagePicker}
          >
            <ImageIcon size={26} color="#007AFF" strokeWidth={2} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleFilePicker}
          >
            <FileText size={26} color="#007AFF" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.chatInput}
              placeholder="Message"
              placeholderTextColor="#8E8E93"
              value={editingMessageId ? editingMessageText : inputText}
              onChangeText={editingMessageId ? setEditingMessageText : setInputText}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={toggleSettings}
          >
            <Settings size={22} color="#007AFF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (editingMessageId ? editingMessageText.trim() === "" : inputText.trim() === "") && styles.sendButtonDisabled,
            ]}
            onPress={() => editingMessageId ? saveEditedMessage() : handleSendMessage()}
            disabled={editingMessageId ? editingMessageText.trim() === "" : inputText.trim() === ""}
          >
            <Send
              size={20}
              color="#FFFFFF"
              strokeWidth={2.5}
              fill="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        
        {showSettings && (
          <View style={styles.settingsPanel}>
            <ScrollView style={styles.settingsPanelScroll}>
              {!selectedContact?.isAI && (
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Keep sent messages in chat</Text>
                  <TouchableOpacity
                    style={[styles.toggleSwitch, keepMessages && styles.toggleSwitchActive]}
                    onPress={() => setKeepMessages(!keepMessages)}
                  >
                    <View style={[styles.toggleThumb, keepMessages && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Contact Info</Text>
                <TouchableOpacity onPress={openContactInfo}>
                  <Text style={styles.editContactText}>View/Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Messaging App Color</Text>
                <View style={styles.colorPickerRow}>
                  {[
                    { color: "#FF3B30", name: "red" },
                    { color: "#34C759", name: "green" },
                    { color: "#007AFF", name: "blue" },
                    { color: "#000000", name: "black" },
                    { color: "#FFFFFF", name: "white" },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: item.color },
                        item.color === "#FFFFFF" && { borderWidth: 1, borderColor: "#8E8E93" },
                        messagingAppColor === item.color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setMessagingAppColor(item.color)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Background Image</Text>
                <TouchableOpacity onPress={() => handleChangeChatBackground("image")} style={styles.imagePicker}>
                  <Text style={styles.editContactText}>Choose Image</Text>
                </TouchableOpacity>
              </View>

              {chatBackgroundImage && (
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Remove Background Image</Text>
                  <TouchableOpacity onPress={() => setChatBackgroundImage(undefined)}>
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              

            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Animated.View>
    );
  };

  const renderInfoScreen = () => (
    <Animated.View style={[styles.infoContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.infoSafeArea}>
        <View style={styles.infoHeader}>
          <TouchableOpacity onPress={closeInfoScreen} style={styles.infoBackButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.infoTitle}>App Information</Text>
          <View style={styles.infoBackButton} />
        </View>
        
        <ScrollView style={styles.infoContent}>
          <View style={styles.infoSection}>
            <Text style={styles.infoCreatedBy}>App Information</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Support Email</Text>
            <Text style={styles.infoEmail}>cruzzerapps@gmail.com</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Join Our Discord</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://discord.gg/vGQweSv7j4')}>
              <Text style={styles.infoEmail}>discord.gg/vGQweSv7j4</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoFooter}>
            <Text style={styles.infoThankYou}>Thank you for using this app!</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );

  const renderVideoCall = () => (
    <Animated.View style={[styles.videoCallContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.videoBackButton} onPress={closeVideoCall}>
        <Text style={styles.videoBackButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.videoImageContainer}>
        <Image
          source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hta1czh5uqojza6egdeyk" }}
          style={styles.videoImage}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
  );

  const renderAuthScreen = () => (
    <Animated.View style={[styles.authContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.authSafeArea}>
        <View style={styles.authHeader}>
          <TouchableOpacity onPress={() => switchMode("messages")} style={styles.authBackButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.authTitle}>{authMode === "signin" ? "Sign In" : "Sign Up"}</Text>
          <View style={styles.authBackButton} />
        </View>

        <ScrollView style={styles.authContent}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {authMode === "signup" && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Public Name</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Display name for others"
                  placeholderTextColor="#8E8E93"
                  value={authPublicName}
                  onChangeText={setAuthPublicName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Private Name</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Name for app purposes"
                  placeholderTextColor="#8E8E93"
                  value={authPrivateName}
                  onChangeText={setAuthPrivateName}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.authInput}
              placeholder="Enter your email"
              placeholderTextColor="#8E8E93"
              value={authEmail}
              onChangeText={setAuthEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.authInput}
              placeholder="Enter your password"
              placeholderTextColor="#8E8E93"
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {authMode === "signup" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.authInput}
                placeholder="Confirm your password"
                placeholderTextColor="#8E8E93"
                value={authConfirmPassword}
                onChangeText={setAuthConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={authMode === "signin" ? handleSignIn : handleSignUp}
          >
            <Text style={styles.primaryButtonText}>
              {authMode === "signin" ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuthButton}
            onPress={() => {
              setAuthMode(authMode === "signin" ? "signup" : "signin");
              setAuthEmail("");
              setAuthPassword("");
              setAuthConfirmPassword("");
              setAuthPublicName("");
              setAuthPrivateName("");
            }}
          >
            <Text style={styles.switchAuthText}>
              {authMode === "signin"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );

  const renderProfileScreen = () => (
    <Animated.View style={[styles.profileContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.profileSafeArea}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => switchMode("messages")} style={styles.profileBackButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.profileTitle}>Profile</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <LogOut size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.profileContent}>
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              {currentUser?.profilePicture ? (
                <Image source={{ uri: currentUser.profilePicture }} style={styles.profileAvatarImage} />
              ) : (
                <User size={60} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.profileName}>{currentUser?.publicName}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email}</Text>
            {currentUser?.phoneNumber && (
              <Text style={styles.profilePhone}>{currentUser.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.profileEditSection}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Public Name</Text>
              <TextInput
                style={styles.authInput}
                placeholder={currentUser?.publicName}
                placeholderTextColor="#8E8E93"
                value={authPublicName}
                onChangeText={setAuthPublicName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Private Name</Text>
              <TextInput
                style={styles.authInput}
                placeholder={currentUser?.privateName}
                placeholderTextColor="#8E8E93"
                value={authPrivateName}
                onChangeText={setAuthPrivateName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.authInput}
                placeholder={currentUser?.email}
                placeholderTextColor="#8E8E93"
                value={authEmail}
                onChangeText={setAuthEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleUpdateProfile}>
              <Text style={styles.secondaryButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileEditSection}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.authInput}
                placeholder="Enter current password"
                placeholderTextColor="#8E8E93"
                value={currentPasswordInput}
                onChangeText={setCurrentPasswordInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.authInput}
                placeholder="Enter new password"
                placeholderTextColor="#8E8E93"
                value={newPasswordInput}
                onChangeText={setNewPasswordInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleUpdatePassword}>
              <Text style={styles.secondaryButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileEditSection}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.lockSettingRow}>
              <View style={styles.lockSettingInfo}>
                <Lock size={24} color="#FFFFFF" />
                <View style={styles.lockSettingText}>
                  <Text style={styles.lockSettingTitle}>Lock Chats</Text>
                  <Text style={styles.lockSettingDesc}>
                    Require code to open chats
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleSwitch, currentUser?.lockEnabled && styles.toggleSwitchActive]}
                onPress={handleToggleLock}
              >
                <View style={[styles.toggleThumb, currentUser?.lockEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            {currentUser?.lockEnabled && (
              <View style={styles.lockCodeInfo}>
                <Text style={styles.lockCodeLabel}>Lock Code Set</Text>
                <Text style={styles.lockCodeValue}>{currentUser.lockCode.split('').map(() => '•').join('')}</Text>
              </View>
            )}
          </View>

          {Platform.OS !== 'web' && (
            <View style={styles.profileEditSection}>
              <Text style={styles.sectionTitle}>Subscriptions</Text>

              {(isVIP || currentUser?.whitelisted) ? (
                <View style={styles.vipActiveCard}>
                  <View style={styles.vipActiveHeader}>
                    <Crown size={32} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.vipActiveTitle}>VIP Member</Text>
                  </View>
                  <Text style={styles.vipActiveDescription}>
                    You are currently subscribed to VIP. Enjoy all premium features!
                  </Text>
                  <TouchableOpacity 
                    style={styles.manageSubscriptionButton}
                    onPress={() => Alert.alert('Manage Subscription', 'Visit your App Store account to manage your subscription.')}
                  >
                    <Text style={styles.manageSubscriptionButtonText}>Manage Subscription</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <Crown size={28} color="#FFD700" />
                    <Text style={styles.subscriptionTitle}>VIP Subscription</Text>
                  </View>
                  
                  <View style={styles.subscriptionPricing}>
                    <Text style={styles.subscriptionPrice}>$5.00</Text>
                    <Text style={styles.subscriptionPeriod}>every 2 weeks</Text>
                  </View>

                  <View style={styles.subscriptionFeatures}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureCheckmark}>✓</Text>
                      <Text style={styles.featureText}>Premium features access</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureCheckmark}>✓</Text>
                      <Text style={styles.featureText}>Priority support</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureCheckmark}>✓</Text>
                      <Text style={styles.featureText}>No ads</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureCheckmark}>✓</Text>
                      <Text style={styles.featureText}>Exclusive content</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.subscribeButton, loadingSubscription && styles.subscribeButtonDisabled]}
                    onPress={handleSubscribe}
                    disabled={loadingSubscription}
                  >
                    {loadingSubscription ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.restoreButton}
                    onPress={handleRestorePurchases}
                    disabled={loadingSubscription}
                  >
                    <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );

  const renderLocationScreen = () => {
    const usersWithLocation = userAccounts
      .filter(u => u.id !== currentUser?.id)
      .map((user, index) => ({
        ...user,
        latitude: currentLocation ? currentLocation.latitude + (Math.random() - 0.5) * 0.1 : 0,
        longitude: currentLocation ? currentLocation.longitude + (Math.random() - 0.5) * 0.1 : 0,
      }));

    return (
      <Animated.View style={[styles.locationContainer, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.locationSafeArea}>
          <View style={styles.locationHeader}>
            <TouchableOpacity onPress={closeLocationScreen} style={styles.locationBackButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.locationTitle}>Location</Text>
            <TouchableOpacity onPress={updateLocation} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {currentLocation && locationVisibility !== "silent" ? (
            <MapView
              style={styles.mapView}
              region={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation
            >
              {usersWithLocation.map((user) => (
                <Marker
                  key={user.id}
                  coordinate={{
                    latitude: user.latitude,
                    longitude: user.longitude,
                  }}
                  title={user.publicName}
                  description={user.email}
                >
                  <View style={styles.mapMarker}>
                    <View style={styles.mapMarkerCircle}>
                      <Text style={styles.mapMarkerText}>{user.publicName[0]}</Text>
                    </View>
                  </View>
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={styles.locationNoMapContainer}>
              <MapPin size={64} color="#8E8E93" />
              <Text style={styles.locationNoMapText}>
                {locationLoading
                  ? "Loading location..."
                  : "Enable location to see map"}
              </Text>
            </View>
          )}

          <View style={styles.locationControlsContainer}>
            <View style={styles.locationVisibilitySection}>
              <Text style={styles.locationSectionTitle}>Who can see your location</Text>
              
              <TouchableOpacity
                style={[styles.locationVisibilityOption, locationVisibility === "everyone" && styles.locationVisibilityOptionActive]}
                onPress={() => setLocationVisibility("everyone")}
              >
                <View style={styles.locationVisibilityOptionContent}>
                  <Text style={styles.locationVisibilityOptionTitle}>Everyone</Text>
                  <Text style={styles.locationVisibilityOptionDesc}>All users can see your location</Text>
                </View>
                {locationVisibility === "everyone" && (
                  <View style={styles.locationVisibilityCheckmark}>
                    <Text style={styles.locationVisibilityCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationVisibilityOption, locationVisibility === "contacts" && styles.locationVisibilityOptionActive]}
                onPress={() => setLocationVisibility("contacts")}
              >
                <View style={styles.locationVisibilityOptionContent}>
                  <Text style={styles.locationVisibilityOptionTitle}>Contacts Only</Text>
                  <Text style={styles.locationVisibilityOptionDesc}>Only your contacts can see</Text>
                </View>
                {locationVisibility === "contacts" && (
                  <View style={styles.locationVisibilityCheckmark}>
                    <Text style={styles.locationVisibilityCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationVisibilityOption, locationVisibility === "nobody" && styles.locationVisibilityOptionActive]}
                onPress={() => setLocationVisibility("nobody")}
              >
                <View style={styles.locationVisibilityOptionContent}>
                  <Text style={styles.locationVisibilityOptionTitle}>Nobody</Text>
                  <Text style={styles.locationVisibilityOptionDesc}>Location tracked but hidden</Text>
                </View>
                {locationVisibility === "nobody" && (
                  <View style={styles.locationVisibilityCheckmark}>
                    <Text style={styles.locationVisibilityCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationVisibilityOption, locationVisibility === "silent" && styles.locationVisibilityOptionActive]}
                onPress={() => {
                  setLocationVisibility("silent");
                  setCurrentLocation(null);
                }}
              >
                <View style={styles.locationVisibilityOptionContent}>
                  <Text style={styles.locationVisibilityOptionTitle}>Silent Mode</Text>
                  <Text style={styles.locationVisibilityOptionDesc}>Turn off location tracking</Text>
                </View>
                {locationVisibility === "silent" && (
                  <View style={styles.locationVisibilityCheckmark}>
                    <Text style={styles.locationVisibilityCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  };

  const handleDialerPress = (digit: string) => {
    setDialerInput(dialerInput + digit);
  };

  const handleDialerDelete = () => {
    setDialerInput(dialerInput.slice(0, -1));
  };

  const handleDialerCall = async () => {
    if (dialerInput.trim() === "") return;
    
    console.log("Initiating call to:", dialerInput);
    setActiveCallNumber(dialerInput);
    setActiveCallDuration(0);
    switchMode("activeCall");
    
    const newCallLog: CallLog = {
      id: Date.now().toString(),
      phoneNumber: dialerInput,
      type: "outgoing",
      timestamp: new Date(),
    };
    setCallLogs([newCallLog, ...callLogs]);
    
    const result = await telnyxService.makeCall(dialerInput);
    
    if (result.success && result.id) {
      console.log("Telnyx call initiated:", result.id);
      setActiveCallSid(result.id);
      
      callTimerRef.current = setInterval(() => {
        setActiveCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      console.error("Failed to initiate call:", result.error);
      Alert.alert("Call Failed", result.error || "Unable to place call");
      switchMode("phoneDialer");
    }
    
    setDialerInput("");
  };

  const handleEndCall = async () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    if (activeCallSid) {
      const result = await telnyxService.endCall(activeCallSid);
      if (result.success) {
        console.log("Call ended successfully");
      } else {
        console.error("Failed to end call:", result.error);
      }
      setActiveCallSid(null);
    }
    
    setCallLogs(callLogs.map(log => 
      log.phoneNumber === activeCallNumber && !log.duration
        ? { ...log, duration: activeCallDuration }
        : log
    ));
    
    setActiveCallNumber("");
    setActiveCallDuration(0);
    setIsCallMuted(false);
    setIsCallOnSpeaker(false);
    switchMode("phoneDialer");
  };

  const toggleMute = () => {
    setIsCallMuted(!isCallMuted);
  };

  const toggleSpeaker = () => {
    setIsCallOnSpeaker(!isCallOnSpeaker);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openSMSConversation = (phoneNumber: string) => {
    let conversation = smsConversations.find(c => c.phoneNumber === phoneNumber);
    
    if (!conversation) {
      conversation = {
        id: Date.now().toString(),
        phoneNumber,
        messages: [],
        lastMessage: "",
        timestamp: new Date(),
        unread: 0,
      };
      setSmsConversations([conversation, ...smsConversations]);
      setSelectedSMSConversation(conversation.id);
    } else {
      setSelectedSMSConversation(conversation.id);
      setSmsConversations(smsConversations.map(c => 
        c.id === conversation!.id ? { ...c, unread: 0 } : c
      ));
    }
    
    switchMode("smsChat");
  };

  const handleSendSMS = async () => {
    if (smsInputText.trim() === "" || !selectedSMSConversation) return;
    
    const conversation = smsConversations.find(c => c.id === selectedSMSConversation);
    if (!conversation) return;
    
    const messageText = smsInputText.trim();
    setSmsInputText("");
    
    const newMessage: SMSMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
      status: "sending",
    };
    
    setSmsConversations(smsConversations.map(c => 
      c.id === selectedSMSConversation
        ? {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessage: newMessage.text,
            timestamp: new Date(),
          }
        : c
    ));
    
    console.log("Sending SMS to:", conversation.phoneNumber, "Message:", messageText);
    
    const result = await telnyxService.sendSMS(conversation.phoneNumber, messageText);
    
    setSmsConversations(prevConvos => prevConvos.map(c => 
      c.id === selectedSMSConversation
        ? {
            ...c,
            messages: c.messages.map(m => 
              m.id === newMessage.id
                ? { ...m, status: result.success ? "sent" : "failed" }
                : m
            ),
          }
        : c
    ));
    
    if (!result.success) {
      Alert.alert("Message Failed", result.error || "Unable to send message");
    } else {
      console.log("SMS sent successfully:", result.id);
    }
  };

  const renderPhoneDialer = () => (
    <Animated.View style={[styles.phoneDialerContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.phoneDialerSafeArea}>
        <View style={styles.phoneDialerHeader}>
          <TouchableOpacity onPress={() => switchMode("messages")} style={styles.phoneDialerBackButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.phoneDialerTitle}>Phone</Text>
          <View style={styles.phoneDialerBackButton} />
        </View>

        <View style={styles.dialerDisplayContainer}>
          <Text style={styles.dialerDisplay}>
            {dialerInput || "Enter number"}
          </Text>
          {dialerInput.length > 0 && (
            <TouchableOpacity onPress={handleDialerDelete} style={styles.dialerDeleteButton}>
              <Text style={styles.dialerDeleteText}>⌫</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dialerPad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['*', '0', '#']].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.dialerRow}>
              {row.map(digit => (
                <TouchableOpacity
                  key={digit}
                  style={styles.dialerButton}
                  onPress={() => handleDialerPress(digit)}
                >
                  <Text style={styles.dialerButtonText}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.dialerActions}>
          <TouchableOpacity
            style={styles.dialerCallButton}
            onPress={handleDialerCall}
            activeOpacity={0.8}
          >
            <Phone size={32} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.callHistorySection}>
          <Text style={styles.callHistoryTitle}>Recent Calls</Text>
          <ScrollView style={styles.callHistoryList}>
            {callLogs.length === 0 ? (
              <Text style={styles.noCallsText}>No call history</Text>
            ) : (
              callLogs.map(log => (
                <View key={log.id} style={styles.callLogItem}>
                  <View style={styles.callLogIcon}>
                    <Phone 
                      size={20} 
                      color={log.type === "missed" ? "#FF3B30" : "#34C759"}
                    />
                  </View>
                  <View style={styles.callLogInfo}>
                    <Text style={styles.callLogNumber}>{log.phoneNumber}</Text>
                    <Text style={styles.callLogTime}>
                      {log.timestamp.toLocaleString()}
                      {log.duration ? ` • ${formatCallDuration(log.duration)}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      setDialerInput(log.phoneNumber);
                      handleDialerCall();
                    }}
                    style={styles.callLogCallButton}
                  >
                    <Phone size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.dialerButtonsRow}>
          <TouchableOpacity
            style={[
              styles.dialerSMSButton,
              styles.dialerInAppButton,
              !dialerInput.trim() && styles.dialerSMSButtonDisabled,
            ]}
            onPress={() => {
              if (dialerInput.trim()) {
                openSMSConversation(dialerInput);
                setDialerInput("");
              } else {
                Alert.alert("Enter Phone Number", "Please enter a phone number to send a message.");
              }
            }}
            disabled={!dialerInput.trim()}
            activeOpacity={0.8}
          >
            <Send size={24} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 10 }} fill="#FFFFFF" />
            <Text style={styles.dialerSMSButtonText}>Send SMS via SignalWire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dialerSMSButton,
              !dialerInput.trim() && styles.dialerSMSButtonDisabled,
            ]}
            onPress={async () => {
              if (dialerInput.trim()) {
                const phoneNumber = dialerInput.replace(/[^0-9+]/g, '');
                const smsUrl = Platform.OS === 'ios' 
                  ? `sms:${phoneNumber}`
                  : `sms:${phoneNumber}`;
                
                const canOpen = await Linking.canOpenURL(smsUrl);
                if (canOpen) {
                  await Linking.openURL(smsUrl);
                } else {
                  Alert.alert("Error", "Cannot open messaging app");
                }
              } else {
                Alert.alert("Enter Phone Number", "Please enter a phone number to send a message.");
              }
            }}
            disabled={!dialerInput.trim()}
            activeOpacity={0.8}
          >
            <Send size={20} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={styles.dialerSMSButtonText}>Open Native SMS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderActiveCall = () => (
    <Animated.View style={[styles.activeCallContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.activeCallSafeArea}>
        <View style={styles.activeCallContent}>
          <Text style={styles.activeCallNumber}>{activeCallNumber}</Text>
          <Text style={styles.activeCallStatus}>Calling...</Text>
          <Text style={styles.activeCallDuration}>{formatCallDuration(activeCallDuration)}</Text>

          <View style={styles.activeCallControls}>
            <TouchableOpacity
              style={[styles.callControlButton, isCallMuted && styles.callControlButtonActive]}
              onPress={toggleMute}
            >
              <Text style={styles.callControlButtonText}>🔇</Text>
              <Text style={styles.callControlLabel}>{isCallMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callControlButton, isCallOnSpeaker && styles.callControlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Text style={styles.callControlButtonText}>🔊</Text>
              <Text style={styles.callControlLabel}>Speaker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callControlButton}
              onPress={() => Alert.alert("Keypad", "Keypad feature coming soon!")}
            >
              <Text style={styles.callControlButtonText}>⌨️</Text>
              <Text style={styles.callControlLabel}>Keypad</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
          >
            <Phone size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderSMSChat = () => {
    const conversation = smsConversations.find(c => c.id === selectedSMSConversation);
    if (!conversation) return null;

    return (
      <Animated.View style={[styles.smsChatContainer, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          style={styles.smsChatKeyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.smsChatHeader}>
            <TouchableOpacity onPress={() => switchMode("phoneDialer")} style={styles.smsChatBackButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.smsChatHeaderCenter}>
              <Text style={styles.smsChatHeaderNumber}>{conversation.phoneNumber}</Text>
              {conversation.name && (
                <Text style={styles.smsChatHeaderName}>{conversation.name}</Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => {
                setDialerInput(conversation.phoneNumber);
                handleDialerCall();
              }}
              style={styles.smsChatCallButton}
            >
              <Phone size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.smsMessagesScroll}
            contentContainerStyle={styles.smsMessagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {conversation.messages.length === 0 ? (
              <View style={styles.noMessagesContainer}>
                <Text style={styles.noMessagesText}>No messages yet</Text>
              </View>
            ) : (
              conversation.messages.map(message => (
                <View key={message.id} style={styles.smsMessageContainer}>
                  <View
                    style={[
                      styles.smsMessageBubble,
                      message.sender === "user" ? styles.smsUserBubble : styles.smsOtherBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smsMessageText,
                        message.sender === "user" ? styles.smsUserText : styles.smsOtherText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.smsMessageTimestamp,
                      message.sender === "user" ? styles.smsTimestampRight : styles.smsTimestampLeft,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.smsInputContainer}>
            <TextInput
              style={styles.smsInput}
              placeholder="Text message"
              placeholderTextColor="#8E8E93"
              value={smsInputText}
              onChangeText={setSmsInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.smsSendButton,
                smsInputText.trim() === "" && styles.smsSendButtonDisabled,
              ]}
              onPress={handleSendSMS}
              disabled={smsInputText.trim() === ""}
            >
              <Send size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  };

  const renderCameraScreen = () => (
    <Animated.View style={[styles.cameraContainer, { opacity: fadeAnim }]}>
      <CameraView
        style={styles.cameraView}
        facing={cameraFacing}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <SafeAreaView style={styles.cameraOverlay}>
          <View style={styles.cameraTopControls}>
            <TouchableOpacity onPress={closeCameraScreen} style={styles.cameraCloseButton}>
              <X size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraBottomControls}>
            <View style={styles.cameraControlsSpacer} />
            <TouchableOpacity onPress={takePicture} style={styles.cameraShutterButton}>
              <View style={styles.cameraShutterInner} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.cameraFlipButton}>
              <Text style={styles.cameraFlipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </Animated.View>
  );

  const renderBrowser = () => (
    <Animated.View style={[styles.browserContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.browserSafeArea}>
        {/* Browser Header */}
        <View style={styles.browserHeader}>
          <TouchableOpacity onPress={closeBrowser} style={styles.browserBackButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.browserTitle} numberOfLines={1}>{browserTitle}</Text>
          <View style={styles.browserBackButton} />
        </View>

        {/* URL Bar */}
        <View style={styles.browserUrlBar}>
          <TextInput
            style={styles.browserUrlInput}
            value={browserUrlInput}
            onChangeText={setBrowserUrlInput}
            onSubmitEditing={() => navigateToUrl(browserUrlInput)}
            placeholder="Enter URL or search..."
            placeholderTextColor="#8E8E93"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
          />
          {browserLoading && (
            <ActivityIndicator size="small" color="#007AFF" style={styles.browserLoadingIndicator} />
          )}
        </View>

        {/* Hot Links Bar */}
        <View style={styles.browserHotLinksContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.browserHotLinksScroll}>
            {BROWSER_HOT_LINKS.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.browserHotLinkButton}
                onPress={() => navigateToUrl(link.url)}
              >
                <Text style={styles.browserHotLinkText}>{link.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* WebView */}
        <View style={styles.browserWebViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: browserUrl }}
            style={styles.browserWebView}
            onNavigationStateChange={handleBrowserNavigationChange}
            onLoadStart={() => setBrowserLoading(true)}
            onLoadEnd={() => setBrowserLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            cacheEnabled={true}
            incognito={false}
            userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            renderLoading={() => (
              <View style={styles.browserLoadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.browserLoadingText}>Loading...</Text>
              </View>
            )}
          />
        </View>

        {/* Navigation Controls */}
        <View style={styles.browserNavBar}>
          <TouchableOpacity 
            onPress={goBack} 
            style={[styles.browserNavButton, !canGoBack && styles.browserNavButtonDisabled]}
            disabled={!canGoBack}
          >
            <ArrowLeft size={24} color={canGoBack ? "#007AFF" : "#3A3A3C"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={goForward} 
            style={[styles.browserNavButton, !canGoForward && styles.browserNavButtonDisabled]}
            disabled={!canGoForward}
          >
            <ArrowRight size={24} color={canGoForward ? "#007AFF" : "#3A3A3C"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshBrowser} style={styles.browserNavButton}>
            <RotateCcw size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goHome} style={styles.browserNavButton}>
            <Home size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const handleWhitelist = (accountId: string) => {
    setUserAccounts(userAccounts.map(acc => 
      acc.id === accountId ? { ...acc, whitelisted: true } : acc
    ));
    Alert.alert("Success", "User has been whitelisted for VIP access.");
  };

  const handleUnwhitelist = (accountId: string) => {
    setUserAccounts(userAccounts.map(acc => 
      acc.id === accountId ? { ...acc, whitelisted: false } : acc
    ));
    Alert.alert("Success", "User VIP whitelist has been removed.");
  };

  const toggleAccountExpand = (accountId: string) => {
    setExpandedAccountId(expandedAccountId === accountId ? null : accountId);
  };

  const renderDeveloperPanel = () => (
    <Animated.View style={[styles.developerContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.developerSafeArea}>
        <View style={styles.developerHeader}>
          <TouchableOpacity onPress={closeDeveloperPanel} style={styles.developerBackButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.developerTitle}>Developer Panel</Text>
          <View style={styles.developerBackButton} />
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search accounts..."
            placeholderTextColor="#8E8E93"
            value={devSearchQuery}
            onChangeText={setDevSearchQuery}
          />
        </View>

        <View style={styles.devAccountTabs}>
          <Text style={styles.devAccountTabsTitle}>User Accounts ({filteredAccounts.length})</Text>
        </View>

        <ScrollView style={styles.developerContent}>
          {filteredAccounts.length === 0 ? (
            <View style={styles.noAccountsContainer}>
              <Text style={styles.noAccountsText}>No accounts found</Text>
            </View>
          ) : (
            filteredAccounts.map((account) => (
              <View key={account.id} style={styles.accountCard}>
                <TouchableOpacity 
                  style={styles.accountCardHeader}
                  onPress={() => toggleAccountExpand(account.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountCardHeaderLeft}>
                    <View style={[styles.accountCardAvatar, account.whitelisted && styles.accountCardAvatarVIP]}>
                      <Text style={styles.accountCardAvatarText}>{account.publicName[0]}</Text>
                    </View>
                    <View style={styles.accountCardHeaderInfo}>
                      <Text style={styles.accountCardTitle}>{account.publicName}</Text>
                      <Text style={styles.accountCardEmail}>{account.email}</Text>
                    </View>
                  </View>
                  <View style={styles.accountCardBadges}>
                    {account.isGoogleAccount && (
                      <View style={styles.googleBadge}>
                        <Text style={styles.googleBadgeText}>Google</Text>
                      </View>
                    )}
                    {account.whitelisted && (
                      <View style={styles.vipBadge}>
                        <Crown size={12} color="#FFD700" />
                        <Text style={styles.vipBadgeText}>VIP</Text>
                      </View>
                    )}
                    {currentUser?.id === account.id && (
                      <View style={styles.currentUserBadge}>
                        <Text style={styles.currentUserBadgeText}>Current</Text>
                      </View>
                    )}
                    <Text style={styles.expandIndicator}>{expandedAccountId === account.id ? '▼' : '▶'}</Text>
                  </View>
                </TouchableOpacity>

                {expandedAccountId === account.id && (
                  <View style={styles.accountCardDetails}>
                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Email:</Text>
                      <Text style={styles.accountCardValue}>{account.email}</Text>
                    </View>

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Password:</Text>
                      <Text style={styles.accountCardValue}>{account.password}</Text>
                    </View>

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Private Name:</Text>
                      <Text style={styles.accountCardValue}>{account.privateName}</Text>
                    </View>

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Phone:</Text>
                      <Text style={styles.accountCardValue}>{account.phoneNumber || 'N/A'}</Text>
                    </View>

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Lock Enabled:</Text>
                      <Text style={styles.accountCardValue}>
                        {account.lockEnabled ? "Yes" : "No"}
                      </Text>
                    </View>

                    {account.lockEnabled && (
                      <View style={styles.accountCardRow}>
                        <Text style={styles.accountCardLabel}>Lock Code:</Text>
                        <Text style={styles.accountCardValue}>{account.lockCode}</Text>
                      </View>
                    )}

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Last Login:</Text>
                      <Text style={styles.accountCardValue}>
                        {account.lastLogin.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>VIP Status:</Text>
                      <Text style={[styles.accountCardValue, account.whitelisted && styles.vipStatusText]}>
                        {account.whitelisted ? "Whitelisted" : "Standard"}
                      </Text>
                    </View>

                    <View style={styles.accountCardRow}>
                      <Text style={styles.accountCardLabel}>Account Type:</Text>
                      <Text style={styles.accountCardValue}>
                        {account.isGoogleAccount ? "Google Account" : "Email/Password"}
                      </Text>
                    </View>

                    <View style={styles.whitelistButtonContainer}>
                      {account.whitelisted ? (
                        <TouchableOpacity
                          style={styles.unwhitelistButton}
                          onPress={() => handleUnwhitelist(account.id)}
                        >
                          <Text style={styles.unwhitelistButtonText}>Remove Whitelist</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.whitelistButton}
                          onPress={() => handleWhitelist(account.id)}
                        >
                          <Crown size={18} color="#000000" />
                          <Text style={styles.whitelistButtonText}>Whitelist for VIP</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {mode === "calculator" && renderCalculator()}
      {mode === "messages" && renderMessages()}
      {mode === "chat" && renderChat()}
      {mode === "videoCall" && renderVideoCall()}
      {mode === "info" && renderInfoScreen()}
      {mode === "auth" && renderAuthScreen()}
      {mode === "profile" && renderProfileScreen()}
      {mode === "developer" && renderDeveloperPanel()}
      {mode === "location" && renderLocationScreen()}
      {mode === "camera" && renderCameraScreen()}
      {mode === "browser" && renderBrowser()}
      {mode === "phoneDialer" && renderPhoneDialer()}
      {mode === "activeCall" && renderActiveCall()}
      {mode === "smsChat" && renderSMSChat()}

      <Modal
        visible={showContactInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactInfo(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowContactInfo(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contact Info</Text>
            <TouchableOpacity
              onPress={() => {
                if (isEditingContactInfo) {
                  saveContactInfo();
                } else {
                  setIsEditingContactInfo(true);
                }
              }}
            >
              <Text style={styles.modalSaveText}>
                {isEditingContactInfo ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.profilePictureSection}>
              <TouchableOpacity
                onPress={isEditingContactInfo ? handleChangeProfilePicture : undefined}
                style={styles.largeAvatar}
              >
                {tempContactInfo.profilePicture ? (
                  <Image
                    source={{ uri: tempContactInfo.profilePicture }}
                    style={styles.largeAvatarImage}
                  />
                ) : (
                  <View style={styles.largeAvatarPlaceholder}>
                    <User size={60} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              {isEditingContactInfo && (
                <Text style={styles.changePhotoText}>Tap to change photo</Text>
              )}
            </View>

            <View style={styles.contactInfoSection}>
              <View style={styles.contactInfoItem}>
                <Text style={styles.contactInfoLabel}>Name</Text>
                {isEditingContactInfo ? (
                  <TextInput
                    style={styles.contactInfoInput}
                    value={tempContactInfo.name}
                    onChangeText={(text) =>
                      setTempContactInfo({ ...tempContactInfo, name: text })
                    }
                  />
                ) : (
                  <Text style={styles.contactInfoValue}>{tempContactInfo.name}</Text>
                )}
              </View>

              <View style={styles.contactInfoItem}>
                <Text style={styles.contactInfoLabel}>Phone</Text>
                {isEditingContactInfo ? (
                  <TextInput
                    style={styles.contactInfoInput}
                    value={tempContactInfo.phone}
                    onChangeText={(text) =>
                      setTempContactInfo({ ...tempContactInfo, phone: text })
                    }
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.contactInfoValue}>{tempContactInfo.phone}</Text>
                )}
              </View>

              <View style={styles.contactInfoItem}>
                <Text style={styles.contactInfoLabel}>Email</Text>
                {isEditingContactInfo ? (
                  <TextInput
                    style={styles.contactInfoInput}
                    value={tempContactInfo.email}
                    onChangeText={(text) =>
                      setTempContactInfo({ ...tempContactInfo, email: text })
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.contactInfoValue}>{tempContactInfo.email}</Text>
                )}
              </View>

              <View style={styles.contactInfoItem}>
                <Text style={styles.contactInfoLabel}>Address</Text>
                {isEditingContactInfo ? (
                  <TextInput
                    style={[styles.contactInfoInput, styles.contactInfoInputMultiline]}
                    value={tempContactInfo.address}
                    onChangeText={(text) =>
                      setTempContactInfo({ ...tempContactInfo, address: text })
                    }
                    multiline
                  />
                ) : (
                  <Text style={styles.contactInfoValue}>{tempContactInfo.address}</Text>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showMessageActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageActions(false)}
        >
          <View style={styles.actionSheet}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditMessage}>
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDeleteMessage}>
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowMessageActions(false);
                setShowEffectPicker(true);
              }}
            >
              <Text style={styles.actionButtonText}>Send with Effect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCancel]}
              onPress={() => setShowMessageActions(false)}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextBold]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showEffectPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEffectPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEffectPicker(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.effectPickerHeader}>
              <Text style={styles.effectPickerTitle}>Choose Effect</Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleApplyEffect("slam")}
            >
              <Text style={styles.actionButtonText}>Slam</Text>
              <Text style={styles.effectDescription}>Flash big on the screen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleApplyEffect("float")}
            >
              <Text style={styles.actionButtonText}>Float</Text>
              <Text style={styles.effectDescription}>Letters slowly float upwards</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCancel]}
              onPress={() => setShowEffectPicker(false)}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextBold]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showContactActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowContactActions(false)}
        >
          <View style={styles.actionSheet}>
            {contacts.find(c => c.id === longPressedContact)?.isPinned ? (
              <TouchableOpacity style={styles.actionButton} onPress={handlePinContact}>
                <Text style={styles.actionButtonText}>Unpin</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={handlePinContact}>
                <Text style={styles.actionButtonText}>Pin</Text>
              </TouchableOpacity>
            )}
            {contacts.find(c => c.id === longPressedContact)?.isMuted ? (
              <TouchableOpacity style={styles.actionButton} onPress={handleMuteContact}>
                <Text style={styles.actionButtonText}>Unmute</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={handleMuteContact}>
                <Text style={styles.actionButtonText}>Mute</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleDeleteContact}>
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCancel]}
              onPress={() => setShowContactActions(false)}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextBold]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImportContacts}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowImportContacts(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowImportContacts(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Import Contacts</Text>
            <TouchableOpacity onPress={importSelectedContacts}>
              <Text style={styles.modalSaveText}>Import</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {deviceContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.importContactItem}
                onPress={() => toggleImportContact(contact.id)}
              >
                <View style={styles.importContactInfo}>
                  <View style={styles.importAvatar}>
                    <Text style={styles.importAvatarText}>
                      {contact.name?.[0] || "?"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.importContactName}>{contact.name || "Unknown"}</Text>
                    {contact.phoneNumbers && contact.phoneNumbers[0] && (
                      <Text style={styles.importContactPhone}>
                        {contact.phoneNumbers[0].number}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.importCheckbox,
                  selectedImportContacts.includes(contact.id) && styles.importCheckboxSelected
                ]}>
                  {selectedImportContacts.includes(contact.id) && (
                    <Text style={styles.importCheckmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={lockPrompt.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setLockPrompt({ visible: false, onSuccess: () => {} })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLockPrompt({ visible: false, onSuccess: () => {} })}
        >
          <View style={styles.lockPromptContainer}>
            <View style={styles.lockPromptHeader}>
              <Lock size={32} color="#007AFF" />
              <Text style={styles.lockPromptTitle}>
                {currentUser?.lockEnabled ? "Enter Lock Code" : "Set Lock Code"}
              </Text>
            </View>
            <TextInput
              style={styles.lockPromptInput}
              placeholder="Enter code"
              placeholderTextColor="#8E8E93"
              value={lockCodeInput}
              onChangeText={setLockCodeInput}
              secureTextEntry
              keyboardType="default"
              autoFocus
            />
            <TouchableOpacity
              style={styles.lockPromptButton}
              onPress={lockPrompt.onSuccess}
            >
              <Text style={styles.lockPromptButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lockPromptCancelButton}
              onPress={() => {
                setLockCodeInput("");
                setLockPrompt({ visible: false, onSuccess: () => {} });
              }}
            >
              <Text style={styles.lockPromptCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImageSourcePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageSourcePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageSourcePicker(false)}
        >
          <View style={styles.actionSheet}>
            <TouchableOpacity style={styles.actionButton} onPress={openCameraForChat}>
              <Text style={styles.actionButtonText}>Take Photo or Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={openImageLibrary}>
              <Text style={styles.actionButtonText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCancel]}
              onPress={() => setShowImageSourcePicker(false)}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextBold]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddContactManually}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddContactManually(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddContactManually(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <View style={styles.modalHeaderRightButtons}>
              <TouchableOpacity 
                onPress={() => {
                  setShowAddContactManually(false);
                  requestContactsPermission();
                }}
                style={styles.importContactsIconButton}
              >
                <User size={22} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddContactManually}>
                <Text style={styles.modalSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.manualContactForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Enter contact name"
                  placeholderTextColor="#8E8E93"
                  value={manualContactName}
                  onChangeText={setManualContactName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone (Optional)</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#8E8E93"
                  value={manualContactPhone}
                  onChangeText={setManualContactPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Enter email address"
                  placeholderTextColor="#8E8E93"
                  value={manualContactEmail}
                  onChangeText={setManualContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showDevLogin}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDevLogin(false)}
      >
        <KeyboardAvoidingView
          style={styles.devLoginKeyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDevLogin(false)}
          >
            <TouchableOpacity 
              style={styles.devLoginContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.lockPromptHeader}>
                <Lock size={32} color="#007AFF" />
                <Text style={styles.lockPromptTitle}>Enter PIN</Text>
              </View>
              <TextInput
                style={styles.devPinInput}
                placeholder="••••"
                placeholderTextColor="#8E8E93"
                value={devPinInput}
                onChangeText={setDevPinInput}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus
              />
              <TouchableOpacity
                style={styles.lockPromptButton}
                onPress={handleDevLogin}
              >
                <Text style={styles.lockPromptButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.lockPromptCancelButton}
                onPress={() => {
                  setDevPinInput("");
                  setShowDevLogin(false);
                }}
              >
                <Text style={styles.lockPromptCancelText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

interface CalcButtonProps {
  text: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
}

const CalcButton: React.FC<CalcButtonProps> = ({
  text,
  onPress,
  style,
  textStyle,
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.button, style, pressed && styles.buttonPressed]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.9}
    >
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

// Create dynamic styles based on responsive sizing
const createStyles = () => {
  const sizes = getResponsiveSizes();
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },
    calculatorContainer: {
      flex: 1,
      justifyContent: "flex-end",
      paddingBottom: 20,
    },
    displayContainer: {
      paddingHorizontal: sizes.paddingHorizontal,
      paddingVertical: 24,
      alignItems: "flex-end",
      minHeight: 100,
      justifyContent: "flex-end",
    },
    displayText: {
      color: "#FFFFFF",
      fontSize: sizes.displayFontSize,
      fontWeight: "300",
      letterSpacing: -2,
    },
    buttonsContainer: {
      paddingHorizontal: sizes.paddingHorizontal,
    },
    buttonRow: {
      flexDirection: "row",
      marginBottom: sizes.buttonMargin,
    },
    button: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: "#333333",
      borderRadius: 100,
      margin: sizes.buttonMargin,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.95 }],
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: sizes.buttonFontSize,
      fontWeight: "400",
    },
    zeroButton: {
      flex: 2,
    },
    functionButton: {
      backgroundColor: "#A5A5A5",
    },
    functionButtonText: {
      color: "#000000",
    },
    operatorButton: {
      backgroundColor: "#FF9F0A",
    },
    operatorButtonText: {
      color: "#FFFFFF",
      fontSize: sizes.operatorFontSize,
    },
    messagesContainer: {
      flex: 1,
      backgroundColor: "#000000",
    },
    messagesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#1C1C1E",
    },
    messagesTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "center",
      flex: 1,
    },
    cruzerTitle: {
      fontSize: 24,
      fontWeight: "900" as const,
      color: "#00FF00",
      textAlign: "center" as const,
      textShadowColor: "#FF0000",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 0,
      letterSpacing: 4,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    messagesHeaderCenter: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    phoneNumberText: {
      fontSize: 11,
      color: "#8E8E93",
      marginTop: 2,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    panicButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    panicEmoji: {
      fontSize: 24,
    },
    panicButtonSmall: {
      width: 36,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 4,
    },
    panicEmojiSmall: {
      fontSize: 20,
    },
    chatHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    messagesList: {
      flex: 1,
    },
    messageItem: {
      flexDirection: "row",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#1C1C1E",
      alignItems: "center",
    },
    avatarContainer: {
      marginRight: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#FF2D55",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: "600",
    },
    messageContent: {
      flex: 1,
    },
    messageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    messageName: {
      fontSize: 17,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    messageTime: {
      fontSize: 15,
      color: "#8E8E93",
    },
    messagePreview: {
      fontSize: 15,
      color: "#8E8E93",
      marginTop: 2,
    },
    unreadBadge: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    unreadText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    chatContainer: {
      flex: 1,
      backgroundColor: "#000000",
    },
    chatKeyboardView: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#1C1C1E",
    },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 32,
    color: "#007AFF",
    fontWeight: "400",
  },
  chatHeaderCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF2D55",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  chatHeaderName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  switcherButton: {
    marginLeft: 6,
    padding: 4,
  },
  switcherEmoji: {
    fontSize: 20,
    opacity: 0.8,
  },
  chatMessages: {
    flex: 1,
    position: "relative" as const,
  },
  chatBackgroundImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  chatMessagesScroll: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 120,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  aspenBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1C1C1E",
    borderBottomLeftRadius: 4,
  },
  messageBubbleText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userBubbleText: {
    color: "#FFFFFF",
  },
  aspenBubbleText: {
    color: "#FFFFFF",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
    backgroundColor: "#000000",
  },
  cameraButton: {
    width: 32,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
    marginBottom: 4,
  },
  settingsButton: {
    width: 32,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 100,
    justifyContent: "center",
  },
  chatInput: {
    color: "#FFFFFF",
    fontSize: 16,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    width: 88,
    justifyContent: "flex-end",
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  videoCallContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoBackButton: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(28, 28, 30, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  videoBackButtonText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  videoImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoImage: {
    width: "100%",
    height: "100%",
  },
  settingsPanel: {
    backgroundColor: "#1C1C1E",
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3A3A3C",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: "#34C759",
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  editContactText: {
    fontSize: 16,
    color: "#007AFF",
  },
  editContactContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editContactInput: {
    backgroundColor: "#2C2C2E",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 16,
    minWidth: 100,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 14,
    color: "#FFFFFF",
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#8E8E93",
    marginBottom: 8,
    marginTop: -4,
  },
  messageTimestampRight: {
    alignSelf: "flex-end" as const,
    marginRight: 12,
  },
  messageTimestampLeft: {
    alignSelf: "flex-start" as const,
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  modalCloseText: {
    fontSize: 17,
    color: "#007AFF",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  modalSaveText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600" as const,
  },
  modalHeaderRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  importContactsIconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden" as const,
    backgroundColor: "#FF2D55",
    justifyContent: "center",
    alignItems: "center",
  },
  largeAvatarImage: {
    width: "100%",
    height: "100%",
  },
  largeAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 15,
    color: "#007AFF",
  },
  contactInfoSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  contactInfoItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  contactInfoLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 4,
  },
  contactInfoValue: {
    fontSize: 17,
    color: "#FFFFFF",
  },
  contactInfoInput: {
    fontSize: 17,
    color: "#FFFFFF",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#007AFF",
  },
  contactInfoInputMultiline: {
    minHeight: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 34,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  actionButtonText: {
    fontSize: 17,
    color: "#007AFF",
    textAlign: "center" as const,
  },
  actionButtonTextDanger: {
    color: "#FF3B30",
  },
  actionButtonTextBold: {
    fontWeight: "600" as const,
  },
  actionButtonCancel: {
    marginTop: 8,
    borderBottomWidth: 0,
  },
  effectPickerHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  effectPickerTitle: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center" as const,
    fontWeight: "600" as const,
  },
  effectDescription: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center" as const,
    marginTop: 4,
  },
  editingBar: {
    backgroundColor: "#1C1C1E",
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editingBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editingBarText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  colorPickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#007AFF",
  },
  imagePicker: {
    paddingVertical: 8,
  },
  deleteText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  settingsPanelScroll: {
    maxHeight: 300,
  },
  smallAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  pinBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  messageNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  infoSafeArea: {
    flex: 1,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  infoBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
  },
  infoContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoSection: {
    marginTop: 40,
    alignItems: "center" as const,
  },
  infoCreatedBy: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 8,
  },
  infoEmail: {
    fontSize: 18,
    color: "#007AFF",
    marginBottom: 20,
  },
  infoFooter: {
    marginTop: 60,
    alignItems: "center" as const,
  },
  infoThankYou: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center" as const,
    fontWeight: "600" as const,
    paddingHorizontal: 20,
  },
  importContactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  importContactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  importAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  importAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  importContactName: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  importContactPhone: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 2,
  },
  importCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#8E8E93",
    justifyContent: "center",
    alignItems: "center",
  },
  importCheckboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  importCheckmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  addContactButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed" as const,
  },
  addContactButtonText: {
    fontSize: 28,
    color: "#007AFF",
    fontWeight: "300" as const,
    marginRight: 12,
  },
  addContactButtonLabel: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600" as const,
  },
  manualContactForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  confettiContainer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none" as const,
  },
  confettiParticle: {
    position: "absolute" as const,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dismissKeyboardButton: {
    position: "absolute" as const,
    top: 70,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: "rgba(28, 28, 30, 0.9)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(142, 142, 147, 0.3)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dismissKeyboardText: {
    fontSize: 22,
  },
  headerButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  developerButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  developerEmoji: {
    fontSize: 18,
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  authSafeArea: {
    flex: 1,
  },
  authHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  authBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
  },
  authContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#3A3A3C",
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#8E8E93",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  authInput: {
    backgroundColor: "#1C1C1E",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  switchAuthButton: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 10,
  },
  switchAuthText: {
    fontSize: 14,
    color: "#007AFF",
  },
  profileContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  profileSafeArea: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  profileBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
  },
  signOutButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContent: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden" as const,
  },
  profileAvatarImage: {
    width: 100,
    height: 100,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: "#8E8E93",
  },
  profilePhone: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 4,
  },
  profileEditSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: "#1C1C1E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#007AFF",
  },
  lockSettingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lockSettingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  lockSettingText: {
    marginLeft: 12,
    flex: 1,
  },
  lockSettingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  lockSettingDesc: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  lockCodeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
  },
  lockCodeLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  lockCodeValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  subscriptionCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  subscriptionPricing: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2C2C2E",
  },
  subscriptionPrice: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: "#FFD700",
    marginBottom: 4,
  },
  subscriptionPeriod: {
    fontSize: 14,
    color: "#8E8E93",
  },
  subscriptionFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureCheckmark: {
    fontSize: 18,
    color: "#34C759",
    marginRight: 12,
    fontWeight: "700" as const,
  },
  featureText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  subscribeButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#000000",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: 14,
    color: "#007AFF",
  },
  vipActiveCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
  },
  vipActiveHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  vipActiveTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#FFD700",
    marginTop: 12,
  },
  vipActiveDescription: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center" as const,
    marginBottom: 20,
  },
  manageSubscriptionButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  manageSubscriptionButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000000",
  },
  lockPromptContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
  },
  lockPromptHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  lockPromptTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginTop: 12,
  },
  lockPromptInput: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center" as const,
  },
  lockPromptButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  lockPromptButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  lockPromptCancelButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  lockPromptCancelText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  devLoginEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  developerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  developerSafeArea: {
    flex: 1,
  },
  developerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  developerBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  developerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  developerContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noAccountsContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noAccountsText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  accountCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  accountCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountCardAvatarVIP: {
    backgroundColor: "#FFD700",
  },
  accountCardAvatarText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  accountCardHeaderInfo: {
    flex: 1,
  },
  accountCardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  accountCardEmail: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  accountCardBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFD700",
  },
  googleBadge: {
    backgroundColor: "rgba(66, 133, 244, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  googleBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#4285F4",
  },
  expandIndicator: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 4,
  },
  accountCardDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  currentUserBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentUserBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  accountCardRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  accountCardLabel: {
    fontSize: 14,
    color: "#8E8E93",
    width: 100,
  },
  accountCardValue: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  vipStatusText: {
    color: "#FFD700",
    fontWeight: "600" as const,
  },
  whitelistButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  whitelistButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whitelistButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000000",
  },
  unwhitelistButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 12,
  },
  unwhitelistButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  devAccountTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  devAccountTabsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#8E8E93",
  },
  devLoginKeyboardView: {
    flex: 1,
  },
  devLoginContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  devLoginInput: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  devPinInput: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 12,
    fontSize: 32,
    marginBottom: 16,
    textAlign: "center" as const,
    letterSpacing: 12,
    fontWeight: "700" as const,
  },
  bottomNavBar: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
    paddingBottom: 20,
    paddingTop: 8,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  bottomNavText: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  bottomNavTextActive: {
    color: "#007AFF",
  },
  locationContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  locationSafeArea: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  locationBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButtonText: {
    fontSize: 24,
  },
  locationContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mapView: {
    flex: 1,
  },
  mapMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapMarkerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapMarkerText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  locationNoMapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  locationNoMapText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 16,
  },
  locationControlsContainer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
  },
  locationInfoCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: "center",
  },
  locationIconContainer: {
    marginBottom: 16,
  },
  locationAddressText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  locationCoordsText: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  locationTimestampText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  locationLoadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  locationNoDataText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  locationVisibilitySection: {
    marginTop: 24,
    marginBottom: 24,
  },
  locationSectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  locationVisibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  locationVisibilityOptionActive: {
    borderColor: "#007AFF",
  },
  locationVisibilityOptionContent: {
    flex: 1,
  },
  locationVisibilityOptionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  locationVisibilityOptionDesc: {
    fontSize: 13,
    color: "#8E8E93",
  },
  locationVisibilityCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  locationVisibilityCheckmarkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraView: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraTopControls: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  cameraControlsSpacer: {
    width: 60,
  },
  cameraShutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  cameraShutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
  },
  cameraFlipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraFlipButtonText: {
    fontSize: 28,
  },
  // Browser styles
  browserContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  browserSafeArea: {
    flex: 1,
  },
  browserHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  browserBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  browserTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },
  browserUrlBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  browserUrlInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 10,
  },
  browserLoadingIndicator: {
    marginLeft: 8,
  },
  browserHotLinksContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  browserHotLinksScroll: {
    paddingHorizontal: 12,
  },
  browserHotLinkButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  browserHotLinkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  browserWebViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  browserWebView: {
    flex: 1,
  },
  browserLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  browserLoadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 14,
  },
  browserNavBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
    backgroundColor: "#000000",
  },
  browserNavButton: {
    width: 50,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  browserNavButtonDisabled: {
    opacity: 0.4,
  },
  flex1: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  phoneDialerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  phoneDialerSafeArea: {
    flex: 1,
  },
  phoneDialerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  phoneDialerBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneDialerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  dialerDisplayContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  dialerDisplay: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "300" as const,
    letterSpacing: 2,
  },
  dialerDeleteButton: {
    marginLeft: 16,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  dialerDeleteText: {
    fontSize: 28,
    color: "#FFFFFF",
  },
  dialerPad: {
    paddingHorizontal: 24,
  },
  dialerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  dialerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
  },
  dialerButtonText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "300" as const,
  },
  dialerActions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  dialerCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#34C759",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  callHistorySection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
  },
  callHistoryTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  callHistoryList: {
    flex: 1,
  },
  noCallsText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center" as const,
    marginTop: 20,
  },
  callLogItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  callLogIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  callLogInfo: {
    flex: 1,
  },
  callLogNumber: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  callLogTime: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  callLogCallButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  dialerButtonsRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  dialerSMSButton: {
    paddingVertical: 20,
    backgroundColor: "#34C759",
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 64,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dialerInAppButton: {
    backgroundColor: "#007AFF",
  },
  dialerSMSButtonDisabled: {
    backgroundColor: "#1C1C1E",
    opacity: 0.5,
  },
  dialerSMSButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  activeCallContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  activeCallSafeArea: {
    flex: 1,
  },
  activeCallContent: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 60,
  },
  activeCallNumber: {
    fontSize: 36,
    fontWeight: "300" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  activeCallStatus: {
    fontSize: 18,
    color: "#8E8E93",
    marginBottom: 20,
  },
  activeCallDuration: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  activeCallControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 40,
    marginVertical: 40,
  },
  callControlButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  callControlButtonActive: {
    opacity: 0.5,
  },
  callControlButtonText: {
    fontSize: 48,
    marginBottom: 8,
  },
  callControlLabel: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  smsChatContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  smsChatKeyboardView: {
    flex: 1,
  },
  smsChatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  smsChatBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  smsChatHeaderCenter: {
    flex: 1,
    alignItems: "center",
  },
  smsChatHeaderNumber: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  smsChatHeaderName: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  smsChatCallButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  smsMessagesScroll: {
    flex: 1,
    backgroundColor: "#000000",
  },
  smsMessagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  noMessagesText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  smsMessageContainer: {
    marginBottom: 16,
  },
  smsMessageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  smsUserBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  smsOtherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1C1C1E",
    borderBottomLeftRadius: 4,
  },
  smsMessageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  smsUserText: {
    color: "#FFFFFF",
  },
  smsOtherText: {
    color: "#FFFFFF",
  },
  smsMessageTimestamp: {
    fontSize: 11,
    color: "#8E8E93",
  },
  smsTimestampRight: {
    alignSelf: "flex-end" as const,
    marginRight: 12,
  },
  smsTimestampLeft: {
    alignSelf: "flex-start" as const,
    marginLeft: 12,
  },
  smsInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
    backgroundColor: "#000000",
  },
  smsInput: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  smsSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  smsSendButtonDisabled: {
    opacity: 0.5,
  },
  typingIndicator: {
    alignSelf: "flex-start" as const,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8E8E93",
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  });
};

const styles = createStyles();
