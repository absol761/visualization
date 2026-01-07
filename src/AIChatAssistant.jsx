import { useState, useRef, useEffect } from 'react';
import { callGemini, geminiPrompts } from './gemini';

export default function AIChatAssistant({ nodes, journalEntries, onNewNote, onUpdateNote, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your AI assistant. I can help you:\n\n• Generate new notes and ideas\n• Summarize and expand content\n• Find connections between your notes\n• Extract tasks and insights\n• Answer questions about your knowledge base\n\nWhat would you like to do?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: Math.max(0, window.innerWidth - 460),
    y: Math.max(0, window.innerHeight - 640)
  }));
  const [size, setSize] = useState({ width: 420, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const resizeHandleRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle window resize to keep chat in viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(window.innerWidth - size.width, prev.x)),
        y: Math.max(0, Math.min(window.innerHeight - (isCollapsed ? 60 : size.height), prev.y))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size.width, size.height, isCollapsed]);

  // Drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - (isMinimized ? 50 : size.height), e.clientY - dragOffset.y));
      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, size.width, size.height, isMinimized]);

  // Resize handlers
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(320, Math.min(1000, e.clientX - position.x));
      const newHeight = Math.max(400, Math.min(window.innerHeight - position.y - 20, e.clientY - position.y));
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position]);

  // Get context about user's notes and journal (enhanced)
  const getContext = () => {
    const recentNotes = nodes.slice(0, 8).map((n, idx) => {
      const text = n.data?.rawLabel?.substring(0, 150) || '';
      return `Note ${idx + 1}: ${text}`;
    }).join('\n\n');
    const recentJournal = journalEntries.slice(0, 5).map((e, idx) => `Entry ${idx + 1}: ${e.text}`).join('\n');
    const noteCount = nodes.length;
    const journalCount = journalEntries.length;
    const connectionCount = nodes.length > 0 ? Math.floor(nodes.length * 0.3) : 0; // Estimate
    
    return `User's Knowledge Base Context:
- Total Notes: ${noteCount}
- Total Journal Entries: ${journalCount}
- Estimated Connections: ${connectionCount}

Recent Notes:
${recentNotes}

Recent Journal Entries:
${recentJournal}`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Determine intent and create appropriate prompt
      const userQuery = input.trim().toLowerCase();
      let prompt = '';
      let systemInstruction = 'You are a helpful AI assistant for a knowledge management app. Be concise, actionable, and friendly.';

      if (userQuery.includes('summarize') || userQuery.includes('summary')) {
        const context = getContext();
        prompt = `Summarize the user's recent work:\n\n${context}`;
      } else if (userQuery.includes('connect') || userQuery.includes('link') || userQuery.includes('relationship')) {
        const context = getContext();
        prompt = `Analyze these notes and suggest connections or relationships between them:\n\n${context}\n\nProvide 3-5 specific connection suggestions.`;
      } else if (userQuery.includes('generate') || userQuery.includes('create') || userQuery.includes('new note')) {
        const context = getContext();
        prompt = `Based on the user's recent work, suggest 3-5 new note ideas that would be valuable:\n\n${context}\n\nFormat each as a title with a brief description.`;
      } else if (userQuery.includes('task') || userQuery.includes('todo') || userQuery.includes('action')) {
        const context = getContext();
        prompt = `Extract actionable tasks from this content:\n\n${context}\n\nFormat as markdown checkboxes: - [ ] Task description`;
      } else if (userQuery.includes('insight') || userQuery.includes('pattern') || userQuery.includes('theme')) {
        const context = getContext();
        prompt = `Analyze this content and identify key insights, patterns, or themes:\n\n${context}`;
      } else if (userQuery.includes('question') || userQuery.includes('explore') || userQuery.includes('what')) {
        const context = getContext();
        prompt = `Based on this content, generate 5 thought-provoking questions to explore further:\n\n${context}`;
      } else if (userQuery.includes('help') || userQuery.includes('what can') || userQuery.includes('how')) {
        // Help requests
        prompt = `The user is asking: "${input.trim()}"\n\nProvide helpful guidance about using this knowledge management app. Be specific and actionable.`;
        systemInstruction = 'You are an expert knowledge management assistant. Provide clear, actionable advice.';
      } else {
        // General conversation with enhanced context
        const context = getContext();
        prompt = `User's Knowledge Base Context:\n${context}\n\nUser Question: "${input.trim()}"\n\nProvide a thoughtful, context-aware response that considers their notes and journal entries. Be helpful, specific, and suggest actionable next steps when relevant.`;
        systemInstruction = 'You are an intelligent AI assistant for a knowledge management app. You understand the user\'s work context and provide insightful, actionable responses.';
      }

      const response = await callGemini(prompt, {
        systemInstruction,
        maxTokens: 1000, // Increased for more detailed responses
        temperature: 0.8, // Slightly more creative
      });

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-actions based on response
      if ((userQuery.includes('generate') || userQuery.includes('create') || userQuery.includes('new note')) && onNewNote) {
        // Extract note titles from response
        const noteTitles = response.match(/^\d+\.\s*(.+)$/gm) || response.match(/^[-*]\s*(.+)$/gm);
        if (noteTitles && noteTitles.length > 0) {
          // Offer to create notes
          const titles = noteTitles.slice(0, 3).map(t => t.replace(/^\d+\.\s*|^[-*]\s*/, '').trim());
          if (titles.length > 0) {
            const createNote = confirm(`Would you like me to create these notes?\n\n${titles.join('\n')}`);
            if (createNote) {
              titles.forEach((title, idx) => {
                setTimeout(() => {
                  onNewNote(title, `Generated from AI suggestion based on your recent work.`);
                }, idx * 100);
              });
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const quickActions = [
    { label: '💡 Generate Ideas', prompt: 'Generate 5 new note ideas based on my recent work' },
    { label: '🔗 Find Connections', prompt: 'Analyze my notes and suggest connections between them' },
    { label: '📝 Summarize', prompt: 'Summarize my recent notes and journal entries' },
    { label: '✅ Extract Tasks', prompt: 'Extract actionable tasks from my content' },
    { label: '💭 Key Insights', prompt: 'What are the key insights and patterns in my work?' },
    { label: '❓ Explore Questions', prompt: 'Generate thought-provoking questions to explore' },
  ];

  const handleQuickAction = (prompt) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  const handleDragStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          left: `${Math.max(0, Math.min(window.innerWidth - 300, position.x))}px`,
          bottom: '20px',
          width: '300px',
          height: '50px',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'move',
        }}
        onMouseDown={handleDragStart}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px' }}>🤖</div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#9b72cb' }}>AI Assistant</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(false)}
            style={{
              background: 'rgba(155, 114, 203, 0.1)',
              border: '1px solid rgba(155, 114, 203, 0.3)',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#9b72cb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Restore"
          >
            ⬆
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(217, 101, 112, 0.1)',
              border: '1px solid rgba(217, 101, 112, 0.3)',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#d96570',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
        style={{
          position: 'fixed',
          left: `${Math.max(0, Math.min(window.innerWidth - size.width, position.x))}px`,
          top: `${Math.max(0, Math.min(window.innerHeight - (isCollapsed ? 60 : size.height), position.y))}px`,
          width: `${size.width}px`,
          height: isCollapsed ? '60px' : `${size.height}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
          transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
        }}
      >
      {/* Header - Draggable */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(155, 114, 203, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
          color: 'white',
          cursor: isDragging ? 'grabbing' : 'move',
          userSelect: 'none',
          opacity: isDragging ? 0.9 : 1,
        }}
        onMouseDown={handleDragStart}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>AI Assistant</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Always here to help</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '⬇' : '⬆'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Minimize"
          >
            ➖
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Actions */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid rgba(155, 114, 203, 0.1)',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              backgroundColor: 'rgba(155, 114, 203, 0.03)',
            }}
          >
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={loading}
            style={{
              padding: '6px 10px',
              background: 'rgba(155, 114, 203, 0.1)',
              border: '1px solid rgba(155, 114, 203, 0.3)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#9b72cb',
              cursor: loading ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </button>
        ))}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '200px',
            }}
          >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user'
                ? 'linear-gradient(135deg, #4285f4, #9b72cb)'
                : 'rgba(155, 114, 203, 0.1)',
              color: msg.role === 'user' ? 'white' : '#333',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(155, 114, 203, 0.1)',
              color: '#666',
              fontSize: '14px',
            }}
          >
            Thinking...
          </div>
        )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid rgba(155, 114, 203, 0.2)',
              display: 'flex',
              gap: '8px',
            }}
          >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask me anything..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(155, 114, 203, 0.3)',
            outline: 'none',
            fontSize: '14px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            background: loading || !input.trim()
              ? 'rgba(155, 114, 203, 0.3)'
              : 'linear-gradient(135deg, #4285f4, #9b72cb)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 600,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
          >
            Send
          </button>
          </div>
        </>
      )}

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          ref={resizeHandleRef}
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '24px',
            height: '24px',
            cursor: 'nwse-resize',
            background: 'rgba(155, 114, 203, 0.1)',
            borderTop: '2px solid rgba(155, 114, 203, 0.3)',
            borderLeft: '2px solid rgba(155, 114, 203, 0.3)',
            borderBottomRightRadius: '20px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            padding: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(155, 114, 203, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(155, 114, 203, 0.1)';
          }}
          title="Drag to resize"
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRight: '2px solid rgba(155, 114, 203, 0.5)',
            borderBottom: '2px solid rgba(155, 114, 203, 0.5)',
          }} />
        </div>
      )}
    </div>
  );
}

