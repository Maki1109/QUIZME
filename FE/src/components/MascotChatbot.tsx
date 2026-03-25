import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Minimize2, Maximize2, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { Mascot } from './Mascot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MascotChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MascotChatbot({ isOpen, onClose, className = '' }: MascotChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [emotion, setEmotion] = useState<'happy' | 'thinking' | 'excited'>('happy');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: '1',
        role: 'assistant',
        content: `👋 Hi there! I'm the QuizMe Mascot, your AI study buddy!

**What I can do:**
- Guide you through tough problems using the Socratic method
- Help you understand mistakes from past quizzes
- Explain math, physics, and science concepts
- Keep you motivated on your learning journey!

**My approach:**
I won't just give you answers - I'll help you *discover* them yourself. That's the best way to truly learn! 🎯

*Ready to learn something new? Just ask!*`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Capture current messages BEFORE updating state (for API call)
    const currentMessages = messages;
    const newMessages = [...currentMessages, userMessage];

    // Update state
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);
    setEmotion('thinking');

    try {
      const token = localStorage.getItem('token');
      console.log('[DEBUG FE] API_URL:', API_URL);
      console.log('[DEBUG FE] Token exists:', !!token);
      console.log('[DEBUG FE] Token value:', token ? `${token.substring(0, 20)}...` : 'null');
      
      // Check if token is malformed or from different environment
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[DEBUG FE] Token payload:', payload);
          console.log('[DEBUG FE] Token expiration:', new Date(payload.exp * 1000).toISOString());
          console.log('[DEBUG FE] Current time:', new Date().toISOString());
          if (payload.exp * 1000 < Date.now()) {
            console.log('[DEBUG FE] WARNING: Token has expired!');
          }
        } catch (e) {
          console.log('[DEBUG FE] Could not decode token payload');
        }
      }
      
      const requestBody = {
        message: userMessage.content,
        conversationHistory: currentMessages.slice(-6).map(m => ({
          role: m.role,
          content: m.content
        }))
      };
      console.log('[DEBUG FE] Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_URL}/mascot-chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[DEBUG FE] Response status:', response.status);
      console.log('[DEBUG FE] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('[DEBUG FE] Response data:', JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date()
        };
        // Add assistant response to existing messages
        setMessages([...newMessages, assistantMessage]);
        setEmotion('happy');
      } else if (response.status === 401) {
        // Authentication error - token invalid or expired
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🔒 Please log in to chat with me! I'd love to help you with your studies once you're signed in.`,
          timestamp: new Date()
        };
        setMessages([...newMessages, errorMessage]);
        setEmotion('happy');
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('[DEBUG FE] Error in chat:', error);
      console.error('[DEBUG FE] Error message:', error instanceof Error ? error.message : 'Unknown error');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Oops! Something went wrong! 😅\n\n*Possible reasons:*\n- AI API not configured (need Groq or DeepSeek key)\n- API key might be invalid\n- Server might need a restart\n\n*Check backend console for details.*`,
        timestamp: new Date()
      };
      setMessages([...newMessages, errorMessage]);
      setEmotion('happy');
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Parse markdown-like content to React elements
  const parseContent = (content: string) => {
    // Simple markdown parsing for bold, code blocks, and line breaks
    const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n\n|\n)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-cyan-700">{part.slice(1, -1)}</code>;
      }
      if (part === '\n\n') {
        return <br key={index} />;
      }
      if (part === '\n') {
        return <br key={index} />;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] ${className}`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Mascot emotion={emotion} size="small" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white">
                  <Sparkles className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">QuizMe Mascot</h3>
                <p className="text-cyan-100 text-xs">AI Study Buddy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5 text-white" />
                ) : (
                  <Minimize2 className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-br-md'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {parseContent(message.content)}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-cyan-100' : 'text-slate-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your studies..."
                    className="flex-1 bg-slate-100 text-slate-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
                    disabled={isTyping}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className={`p-2.5 rounded-full transition-colors ${
                      inputValue.trim() && !isTyping
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isTyping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
                  <MessageCircle className="w-3 h-3" />
                  <span>Powered by QuizMe AI</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating mascot button that triggers the chatbot
interface MascotButtonProps {
  className?: string;
}

export function MascotChatbotButton({ className = '' }: MascotButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    // Hide pulse animation after first click
    const handleClick = () => {
      setShowPulse(false);
    };
    if (showPulse) {
      window.addEventListener('click', handleClick, { once: true });
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showPulse]);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        aria-label="Open QuizMe Mascot Chat"
      >
        {/* Pulse animation */}
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-30" />
        )}
        
        {/* Main button */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
          <Mascot emotion="excited" size="medium" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
      </motion.button>

      <MascotChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
