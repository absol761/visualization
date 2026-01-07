import { useState } from 'react';
import { callGemini, geminiPrompts } from './gemini';

export default function AIAssistant({ content, onResult, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null);

  const handleAction = async (promptFn, actionName) => {
    if (!content || content.trim().length === 0) {
      setError('No content to process');
      return;
    }

    setLoading(true);
    setError(null);
    setAction(actionName);

    try {
      const prompt = promptFn(content);
      const result = await callGemini(prompt, {
        maxTokens: actionName === 'summarize' ? 200 : actionName === 'title' ? 50 : 300,
        temperature: actionName === 'title' ? 0.3 : 0.7,
      });
      
      if (onResult) {
        onResult(result, actionName);
      }
    } catch (err) {
      setError(err.message || 'Failed to process with AI');
      console.error('AI error:', err);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const actions = [
    { id: 'summarize', label: '📝 Summarize', fn: geminiPrompts.summarize },
    { id: 'title', label: '🏷️ Generate Title', fn: geminiPrompts.generateTitle },
    { id: 'ideas', label: '💡 Related Ideas', fn: geminiPrompts.relatedIdeas },
    { id: 'tasks', label: '✅ Extract Tasks', fn: geminiPrompts.extractTasks },
    { id: 'expand', label: '📖 Expand', fn: geminiPrompts.expand },
    { id: 'suggest', label: '💭 Suggest', fn: geminiPrompts.suggest },
    { id: 'questions', label: '❓ Generate Questions', fn: geminiPrompts.generateQuestions },
    { id: 'insights', label: '💎 Extract Insights', fn: geminiPrompts.extractInsights },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1002,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#9b72cb' }}>
            🤖 AI Assistant
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '28px',
              height: '28px',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(217, 101, 112, 0.1)',
              border: '1px solid rgba(217, 101, 112, 0.3)',
              borderRadius: '8px',
              color: '#d96570',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {actions.map(({ id, label, fn }) => (
            <button
              key={id}
              onClick={() => handleAction(fn, id)}
              disabled={loading}
              style={{
                padding: '14px 16px',
                background: loading && action === id
                  ? 'linear-gradient(135deg, #4285f4, #9b72cb)'
                  : 'rgba(155, 114, 203, 0.1)',
                border: '1px solid rgba(155, 114, 203, 0.3)',
                borderRadius: '12px',
                color: loading && action === id ? 'white' : '#9b72cb',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(155, 114, 203, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(155, 114, 203, 0.1)';
                }
              }}
            >
              {loading && action === id ? '⏳' : label.split(' ')[0]}
              <span style={{ fontSize: '13px' }}>{label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
            Processing with AI...
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(155, 114, 203, 0.05)', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
          💡 Tip: AI responses are cached to minimize token usage
        </div>
      </div>
    </div>
  );
}

