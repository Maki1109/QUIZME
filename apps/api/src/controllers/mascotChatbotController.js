// @ts-nocheck
/**
 * Mascot Chatbot Controller
 * AI-powered tutor chatbot using the QuizMe mascot persona
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// AI API call function (supports Groq - free, no credits required)
const callAIAPI = async (messages, systemPrompt) => {
  // Try Groq first (completely free, no credits)
  const groqApiKey = process.env.GROQ_API_KEY;
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  
  // Use Groq if available (free tier)
  if (groqApiKey) {
    console.log('[DEBUG] Using Groq API (FREE - no credits required)');
    return callGroqAPI(groqApiKey, messages, systemPrompt);
  }
  
  // Fall back to DeepSeek if Groq not available
  if (deepseekApiKey) {
    console.log('[DEBUG] Using DeepSeek API');
    return callDeepSeekAPI(deepseekApiKey, messages, systemPrompt);
  }
  
  throw new Error('No AI API key configured. Please add GROQ_API_KEY (recommended - free) or DEEPSEEK_API_KEY to your .env file.');
};

// Groq API - Completely FREE, no credits required
const callGroqAPI = async (apiKey, messages, systemPrompt) => {
  try {
    console.log('[DEBUG] Calling Groq API (FREE tier)...');
    console.log('[DEBUG] System prompt length:', systemPrompt.length);
    console.log('[DEBUG] Messages count:', messages.length);
    
    const requestBody = {
      model: 'llama-3.3-70b-versatile', // Free model with great performance
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1500,
      stream: false
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[DEBUG] Groq response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('[DEBUG] Groq API error:', response.status, errorData);
      throw new Error(`Groq API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Groq API response received');
    console.log('[DEBUG] Response content length:', data.choices[0].message.content.length);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[DEBUG] Groq API call failed:', error.message);
    throw error;
  }
};

// DeepSeek API - Requires credits
const callDeepSeekAPI = async (apiKey, messages, systemPrompt) => {
  try {
    console.log('[DEBUG] Calling DeepSeek API...');
    console.log('[DEBUG] System prompt length:', systemPrompt.length);
    console.log('[DEBUG] Messages count:', messages.length);
    
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1500,
      stream: false
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[DEBUG] DeepSeek response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('[DEBUG] DeepSeek API error:', response.status, errorData);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('[DEBUG] DeepSeek API response received');
    console.log('[DEBUG] Response content length:', data.choices[0].message.content.length);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[DEBUG] DeepSeek API call failed:', error.message);
    throw error;
  }
};

// Load system instructions from XML file
const loadSystemInstructions = () => {
  try {
    const xmlPath = path.join(__dirname, '../../system_instruction.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
    
    // Parse the XML to extract system context
    const extractContent = (xml, tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1].trim() : '';
    };
    
    return {
      systemContext: extractContent(xmlContent, 'system_context'),
      persona: extractContent(xmlContent, 'persona'),
      coreDirectives: extractContent(xmlContent, 'core_directives'),
      responseFormatting: extractContent(xmlContent, 'response_formatting'),
      operationalRules: extractContent(xmlContent, 'operational_rules')
    };
  } catch (error) {
    console.error('Error loading system instructions:', error);
    return null;
  }
};

// Load user context from database
const loadUserContext = async (req) => {
  try {
    if (!req.user) return null;
    
    const User = require('../models/User');
    const ExamAttempt = require('../models/ExamAttempt');
    const Competency = require('../models/Competency');
    const Mission = require('../models/Mission');
    const UserAchievement = require('../models/UserAchievement');
    
    const userId = req.user.id;
    
    // Fetch user data
    const user = await User.findById(userId).select('fullName level xp streakDays accuracy selectedSubjects');
    const recentAttempts = await ExamAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const competencies = await Competency.find({ user: userId })
      .sort({ value: 1 })
      .limit(5)
      .populate('topic', 'name');
    
    const achievements = await UserAchievement.find({ user: userId })
      .populate('achievement', 'name description');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyMissions = await Mission.find({ 
      user: userId, 
      date: { $gte: today, $lt: tomorrow },
      completed: false 
    }).limit(3);
    
    return {
      user: {
        name: user?.fullName,
        level: user?.level,
        xp: user?.xp,
        streakDays: user?.streakDays,
        accuracy: user?.accuracy
      },
      recentAttempts: recentAttempts.map(a => ({
        mode: a.mode,
        score: a.score,
        date: a.createdAt
      })),
      weakTopics: competencies.map(c => c.topic?.name).filter(Boolean),
      achievementsCount: achievements.length,
      dailyMissions: dailyMissions.map(m => m.title)
    };
  } catch (error) {
    console.error('Error loading user context:', error);
    return null;
  }
};

// Build the complete prompt for the AI
const buildPrompt = (systemInstructions, userContext, conversationHistory, userMessage) => {
  let prompt = `${systemInstructions.systemContext}\n\n`;
  prompt += `PERSONA:\n${systemInstructions.persona}\n\n`;
  prompt += `CORE DIRECTIVES:\n${systemInstructions.coreDirectives}\n\n`;
  prompt += `RESPONSE FORMATTING:\n${systemInstructions.responseFormatting}\n\n`;
  prompt += `OPERATIONAL RULES:\n${systemInstructions.operationalRules}\n\n`;
  
  if (userContext) {
    prompt += `--- CURRENT USER CONTEXT (from QuizMe database) ---\n`;
    prompt += `**User:** ${userContext.user?.name || 'Student'}\n`;
    prompt += `**Level:** ${userContext.user?.level || 1}\n`;
    prompt += `**XP:** ${userContext.user?.xp || 0}\n`;
    prompt += `**Study Streak:** ${userContext.user?.streakDays || 0} days\n`;
    prompt += `**Accuracy:** ${userContext.user?.accuracy || 0}%\n\n`;
    
    if (userContext.weakTopics?.length > 0) {
      prompt += `**Areas needing improvement:** ${userContext.weakTopics.join(', ')}\n`;
    }
    
    if (userContext.dailyMissions?.length > 0) {
      prompt += `**Today's Missions:** ${userContext.dailyMissions.join(', ')}\n`;
    }
    
    prompt += `--------------------------------------------------\n\n`;
  }
  
  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `--- CONVERSATION HISTORY ---\n`;
    conversationHistory.slice(-6).forEach(msg => {
      const role = msg.role === 'user' ? 'Student' : 'QuizMe Mascot';
      prompt += `${role}: ${msg.content}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `--- NEW MESSAGE ---\n`;
  prompt += `Student: ${userMessage}\n\n`;
  prompt += `QuizMe Mascot:`;
  
  return prompt;
};

// Mock AI response generator (simulates AI response based on rules)
// In production, this would call an actual AI API (OpenAI, Anthropic, etc.)
const generateAIResponse = (prompt, userMessage) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Expanded math and science keywords
  const mathKeywords = [
    // Basic math
    'calculate', 'solve', 'equation', 'compute', 'find', 'what is', 'how much', 
    'add', 'subtract', 'multiply', 'divide', 'sum', 'difference', 'product', 'quotient',
    'plus', 'minus', 'times', 'divided by', 'equals',
    // Advanced math
    'logarithm', 'derivative', 'integral', 'function', 'limit', 'algebra', 'geometry', 
    'probability', 'statistics', 'calculus', 'trigonometry', 'vector', 'matrix',
    // Specific concepts
    'sin', 'cos', 'tan', 'sine', 'cosine', 'tangent', 'angle', 'triangle', 'circle',
    'area', 'volume', 'perimeter', 'radius', 'diameter', 'hypotenuse', 'pythagorean',
    'quadratic', 'linear', 'polynomial', 'exponent', 'power', 'root', 'square root',
    'fraction', 'decimal', 'percentage', 'ratio', 'proportion',
    // Vietnamese math terms
    'phương trình', 'tính', 'giải', 'hàm số', 'đạo hàm', 'tích phân', 'logarit',
    'tam giác', 'hình tròn', 'diện tích', 'thể tích', 'cộng', 'trừ', 'nhân', 'chia',
    'bình phương', 'căn bậc', 'góc', 'độ', 'rad'
  ];
  
  const isMathQuestion = mathKeywords.some(kw => lowerMessage.includes(kw));
  
  // Check for off-topic questions
  const offTopicKeywords = ['weather', 'news', 'politics', 'stock', 'crypto', 'bitcoin', 
                             'weather', 'thời tiết', 'tin tức', 'chính trị'];
  const isOffTopic = offTopicKeywords.some(kw => lowerMessage.includes(kw)) && 
                     !lowerMessage.includes('quiz') && !lowerMessage.includes('math');
  
  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|xin chào|chào|alo|hái)\b/)) {
    return `Hey there! 👋 Welcome back! I'm your QuizMe mascot and AI tutor. Ready to tackle some questions today?\n\nWhat subject would you like to practice? I'm great with **Math**, **Physics**, and can help you review past mistakes!`;
  }
  
  // Off-topic redirect
  if (isOffTopic) {
    return `I'm your dedicated **QuizMe study buddy**, and I'm here to help you ace your exams! 📚\n\nLet's steer our conversation back to learning. What math concept or quiz question would you like to explore together?\n\n*Remember: Every "aha!" moment starts with a single question!* 💡`;
  }
  
  // Math help with Socratic method
  if (isMathQuestion) {
    // Check for specific topics
    if (lowerMessage.includes('logarithm') || lowerMessage.includes('log')) {
      return `Great question about **Logarithms**! 🔢\n\nLet me guide you through the thinking process:\n\n**Key Concept:** A logarithm answers: "What exponent do we need to get this number?"\n\nFor example, log₂(8) = ? asks: "2 to what power equals 8?"\n\n**Socratic Questions:**\n- Do you remember what 2³ equals?\n- If 2³ = 8, then what should log₂(8) be?\n\n**Hint:** 📌 The answer is **3** because 2³ = 8.\n\n*Does that click? Want to try a slightly harder one?* 🎯`;
    }
    
    if (lowerMessage.includes('derivative') || lowerMessage.includes('đạo hàm')) {
      return `Derivatives are one of the coolest tools in calculus! 🚀\n\n**The Big Idea:** A derivative tells us the *instant rate of change* at any point.\n\n**Simple Rule (Power Rule):**\nFor f(x) = xⁿ, the derivative is f'(x) = n·xⁿ⁻¹\n\n**Socratic Check:**\n- What's the power (exponent) in your function?\n- Does it follow the pattern xⁿ?\n\n**Example:** If f(x) = x³, then f'(x) = 3x²\n\n*Can you identify the power in your function? Give it a try!* ✨`;
    }
    
    if (lowerMessage.includes('quadratic') || lowerMessage.includes('phương trình bậc 2')) {
      return `Quadratic equations are like puzzles - let's solve them together! 🧩\n\n**Standard Form:** ax² + bx + c = 0\n\n**Key Tool - Quadratic Formula:**\nx = (-b ± √(b² - 4ac)) / 2a\n\n**Socratic Questions:**\n- Have you identified a, b, and c from your equation?\n- What's the value of b² - 4ac (the discriminant)?\n\n**Remember:** \n- If discriminant > 0: 2 real roots\n- If discriminant = 0: 1 repeated root  \n- If discriminant < 0: No real roots\n\n*Give it a shot! Show me your equation and let's work through it.* 📝`;
    }
    
    // Generic math help
    return `Love that you're diving into this! 🎯\n\nLet me ask you a few guiding questions to help you arrive at the answer:\n\n1. **What information is given?** (List out the known values)\n2. **What's the target?** (What do we need to find?)\n3. **Which formula or concept might apply here?**\n\n**Hint:** 🤔 Think about the key principles we've covered in this topic. Sometimes breaking it into smaller steps helps!\n\n*Share the problem with me, and let's solve it together! What's the first step you see?* 💪`;
  }
  
  // Questions about the app/platform
  if (lowerMessage.includes('streak') || lowerMessage.includes('chuỗi')) {
    return `Study streaks are amazing motivators! 🔥\n\n**How it works:**\n- Answer questions daily to maintain your streak\n- Miss a day? Don't worry, start fresh!\n- Streaks boost your XP multiplier! 🚀\n\n**Pro Tip:** Even 3-5 questions a day keeps your streak alive!\n\n*You're currently on a great path. Keep that momentum going! What's your streak goal?* ⭐`;
  }
  
  if (lowerMessage.includes('achievement') || lowerMessage.includes('thành tích')) {
    return `Achievements are badges of honor in QuizMe! 🏆\n\n**How to unlock:**\n- Complete daily missions\n- Achieve high accuracy\n- Maintain study streaks\n- Master difficult topics\n\n**Examples:**\n- 🎯 "First Perfect Score"\n- 📚 "Week Warrior" (7-day streak)\n- 🧠 "Math Master" (100% accuracy in a topic)\n\n*Keep practicing and achievements will naturally follow! Which ones are you working toward?* 🌟`;
  }
  
  if (lowerMessage.includes('xp') || lowerMessage.includes('level')) {
    return `XP and levels are your progress indicators! 📈\n\n**Earning XP:**\n- Correct answers: +10-50 XP\n- Daily missions: +20-100 XP\n- Achievements: +50-200 XP\n- Perfect scores: Bonus XP! 🎉\n\n**Leveling Up:**\nEach level requires more XP, but unlocks:\n- New topics & challenges\n- Achievement opportunities\n- Fun badges to show off!\n\n*Every quiz you take gets you closer to the next level! Ready to climb?* ⬆️`;
  }
  
  // Encouragement
  if (lowerMessage.includes('difficult') || lowerMessage.includes('khó') || lowerMessage.includes('hard')) {
    return `Challenges are where the magic happens! ✨\n\n**Remember:**\n- Difficulty means growth is coming!\n- Mistakes are the best teachers 💡\n- Even small progress is progress!\n\n**Suggestion:**\nLet's tackle this together. Break it into smaller parts:\n1. What part feels doable?\n2. What specific part is confusing?\n\n*Share your struggle with me - I'm here to help you through it!* You've got this! 💪🌟`;
  }
  
  if (lowerMessage.includes('wrong') || lowerMessage.includes('sai') || lowerMessage.includes('mistake')) {
    return `Guess what? Wrong answers are actually GOLD! 🌟\n\n**Here's why:**\n- Each mistake reveals exactly what to learn\n- The brain remembers errors better than successes\n- You're building stronger neural connections!\n\n**Next step:**\nReview the explanation, understand *why* the wrong answer doesn't work, and try a similar problem.\n\n*Want me to help you review a specific mistake? I'm great at turning errors into learning moments!* 📚💪`;
  }
  
  // Default helpful response
  return `I'm here to help you learn! 🌟\n\n**I can assist with:**\n- 📐 Math (Algebra, Calculus, Geometry, Logarithms...)\n- ⚡ Physics concepts\n- 📊 Statistics & Probability\n- 📝 Reviewing past quiz mistakes\n- 🎯 Exam preparation tips\n\n**Just tell me what you're stuck on!**\n\n*Remember: I'm using the Socratic method - I'll guide you to the answer, not give it away. That's how real learning happens! Ready to explore?* 🚀`;
};

// @desc    Send message to mascot chatbot
// @route   POST /api/mascot-chat/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    console.log('[DEBUG] Chat endpoint called');
    console.log('[DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[DEBUG] User from token:', req.user ? `ID: ${req.user.id}` : 'No user');
    
    const { message, conversationHistory } = req.body;
    
    if (!message || message.trim() === '') {
      console.log('[DEBUG] Empty message received');
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }
    
    // Load system instructions
    console.log('[DEBUG] Loading system instructions...');
    const systemInstructions = loadSystemInstructions();
    console.log('[DEBUG] System instructions loaded:', systemInstructions ? 'YES' : 'NO');
    
    if (!systemInstructions) {
      console.log('[DEBUG] ERROR: Failed to load system instructions');
    } else {
      console.log('[DEBUG] System instructions keys:', Object.keys(systemInstructions));
    }
    
    if (!systemInstructions) {
      console.log('[DEBUG] Returning 500: Failed to load chatbot configuration');
      return res.status(500).json({
        success: false,
        message: 'Failed to load chatbot configuration'
      });
    }
    
    // Load user context if authenticated
    console.log('[DEBUG] Loading user context...');
    const userContext = await loadUserContext(req);
    console.log('[DEBUG] User context loaded:', userContext ? 'YES' : 'NO');
    if (userContext) {
      console.log('[DEBUG] User context:', JSON.stringify(userContext.user, null, 2));
    }
    
    // Build prompt
    const prompt = buildPrompt(systemInstructions, userContext, conversationHistory, message);
    
    // Call AI API (Groq preferred - free, then DeepSeek)
    let response;
    
    if (conversationHistory && conversationHistory.length > 0) {
      // Convert conversation history to messages array for AI
      const messages = conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      response = await callAIAPI(messages, prompt);
      console.log('[DEBUG] AI response received successfully');
    } else {
      // First message
      response = await callAIAPI([], prompt);
      console.log('[DEBUG] AI response received successfully');
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString(),
        userContext: userContext ? {
          level: userContext.user?.level,
          streakDays: userContext.user?.streakDays
        } : null
      }
    });
  } catch (error) {
    console.error('[DEBUG] Chatbot error:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    console.error('[DEBUG] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Chatbot encountered an error. Please try again.'
    });
  }
};

// @desc    Get mascot introduction
// @route   GET /api/mascot-chat/intro
// @access  Public
exports.getIntro = async (req, res) => {
  const intro = `👋 Hi there! I'm the QuizMe Mascot, your AI study buddy!

**What I can do:**
- Guide you through tough problems using the Socratic method
- Help you understand mistakes from past quizzes
- Explain math, physics, and science concepts
- Keep you motivated on your learning journey!

**My approach:**
I won't just give you answers - I'll help you *discover* them yourself. That's the best way to truly learn! 🎯

*Ready to learn something new? Just ask!*`;

  res.status(200).json({
    success: true,
    data: {
      message: intro,
      persona: {
        name: 'QuizMe Mascot',
        avatar: 'owl'
      }
    }
  });
};
