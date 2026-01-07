// Lightweight Gemini API integration with minimal token usage
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// Use gemini-2.5-flash (stable model according to official docs)
// Using v1beta API for better compatibility with systemInstruction
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Cache for responses to avoid duplicate API calls
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple hash function for cache keys
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Check cache
const getCachedResponse = (cacheKey) => {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  responseCache.delete(cacheKey);
  return null;
};

// Set cache
const setCachedResponse = (cacheKey, response) => {
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  });
  // Limit cache size to 50 entries
  if (responseCache.size > 50) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
};

// Main function to call Gemini API
export async function callGemini(prompt, options = {}) {
  // Debug: log if key is missing (remove in production)
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key missing. Set VITE_GEMINI_API_KEY in your .env file.');
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file and restart the dev server');
  }

  const {
    systemInstruction = 'You are a helpful assistant. Be concise and efficient.',
    maxTokens = 500, // Limit tokens for efficiency
    temperature = 0.7,
    useCache = true,
  } = options;

  // Create cache key
  const cacheKey = useCache ? hashString(`${prompt}-${systemInstruction}-${maxTokens}`) : null;
  
  // Check cache
  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // v1beta API supports systemInstruction field
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      }
    };

    // Add systemInstruction if provided (v1beta supports it)
    if (systemInstruction && systemInstruction !== 'You are a helpful assistant. Be concise and efficient.') {
      requestBody.systemInstruction = {
        parts: [{
          text: systemInstruction
        }]
      };
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    // Cache the response
    if (cacheKey) {
      setCachedResponse(cacheKey, text);
    }

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Pre-built efficient prompts for common tasks - Enhanced with better context
export const geminiPrompts = {
  // Summarize note content (token-efficient, enhanced)
  summarize: (content) => {
    const truncated = content.substring(0, 2000);
    return `Provide a concise, insightful summary (2-3 sentences) that captures the key points and main ideas:\n\n${truncated}`;
  },

  // Generate related ideas (enhanced with context awareness)
  relatedIdeas: (content) => {
    const truncated = content.substring(0, 1000);
    return `Analyze this content and suggest 5-7 related ideas, connections, or follow-up topics. Format as a numbered list with brief descriptions:\n\n${truncated}`;
  },

  // Extract tasks (enhanced with due date detection)
  extractTasks: (content) => {
    const truncated = content.substring(0, 1500);
    return `Extract all actionable tasks from this content. Format as markdown checkboxes with "- [ ]" and include any deadlines or priorities mentioned:\n\n${truncated}`;
  },

  // Generate title (enhanced for better titles)
  generateTitle: (content) => {
    const truncated = content.substring(0, 500);
    return `Generate a compelling, descriptive title (4-8 words) that accurately represents this content:\n\n${truncated}`;
  },

  // Expand on idea (enhanced with structure)
  expand: (content) => {
    const truncated = content.substring(0, 1000);
    return `Expand on this idea with detailed explanations, examples, and actionable insights. Structure with clear paragraphs:\n\n${truncated}`;
  },

  // Quick suggestion (enhanced with context)
  suggest: (context) => {
    const truncated = context.substring(0, 800);
    return `Based on this content, suggest the most valuable next step or action. Be specific and actionable:\n\n${truncated}`;
  },

  // New: Find connections between notes
  findConnections: (notes) => {
    const truncated = notes.substring(0, 2000);
    return `Analyze these notes and identify connections, relationships, or themes between them. Suggest how they could be linked or organized:\n\n${truncated}`;
  },

  // New: Generate questions for exploration
  generateQuestions: (content) => {
    const truncated = content.substring(0, 1000);
    return `Generate 5-7 thought-provoking questions that would help explore and deepen understanding of this topic:\n\n${truncated}`;
  },

  // New: Extract key insights
  extractInsights: (content) => {
    const truncated = content.substring(0, 2000);
    return `Identify the key insights, patterns, or important takeaways from this content. Format as a bulleted list:\n\n${truncated}`;
  }
};

// Helper to get token count estimate (rough)
export function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

