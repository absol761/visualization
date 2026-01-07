import { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot, collection, addDoc, deleteDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import Settings from './Settings';
import AIAssistant from './AIAssistant';
import AIChatAssistant from './AIChatAssistant';
import { callGemini } from './gemini';
import { useTypingSounds } from './useTypingSounds';
import { useAuth } from "./CustomAuthContext";
import './MobileApp.css';

function MobileFlowEditor({ user }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalInput, setJournalInput] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("notes"); // notes, journal, tasks
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiContent, setAIContent] = useState('');
  const [typingSoundsEnabled, setTypingSoundsEnabled] = useState(false);
  const [typingSoundType, setTypingSoundType] = useState("gateron-ks-3-milky-yellow-pro");
  const [typingSoundVolume, setTypingSoundVolume] = useState(0.3);
  
  // Load typing sounds settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTypingSoundsEnabled(settings.typingSounds || false);
        setTypingSoundType(settings.typingSoundType || "gateron-ks-3-milky-yellow-pro");
        setTypingSoundVolume(settings.typingSoundVolume || 0.3);
      } catch (e) {
        console.error("Error loading typing sounds settings:", e);
      }
    }
  }, []);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      const settings = e?.detail || JSON.parse(localStorage.getItem("appSettings") || "{}");
      setTypingSoundsEnabled(settings.typingSounds || false);
      setTypingSoundType(settings.typingSoundType || "gateron-ks-3-milky-yellow-pro");
      setTypingSoundVolume(settings.typingSoundVolume || 0.3);
    };
    
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    window.addEventListener("storage", handleSettingsUpdate);
    handleSettingsUpdate();
    
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
    };
  }, []);

  const { playSound } = useTypingSounds(typingSoundsEnabled, typingSoundType, typingSoundVolume);
  
  if (!user) return null;
  const cardsCol = collection(db, "users", user.id, "cards");
  const edgesCol = collection(db, "users", user.id, "edges");
  const journalCol = collection(db, "users", user.id, "journal");

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const root = document.documentElement;
        const themes = {
          gemini: { primary: "#4285f4", secondary: "#9b72cb", accent: "#d96570", bg: "#f5f5f7", cardBg: "rgba(255, 255, 255, 0.7)", text: "#1d1d1f", border: "rgba(155, 114, 203, 0.2)" },
          midnight: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#ec4899", bg: "#0a0a0f", cardBg: "rgba(20, 20, 30, 0.8)", text: "#e5e7eb", border: "rgba(99, 102, 241, 0.3)" },
          forest: { primary: "#10b981", secondary: "#059669", accent: "#34d399", bg: "#f0fdf4", cardBg: "rgba(255, 255, 255, 0.9)", text: "#064e3b", border: "rgba(16, 185, 129, 0.2)" },
          sunset: { primary: "#f59e0b", secondary: "#ef4444", accent: "#f97316", bg: "#fff7ed", cardBg: "rgba(255, 255, 255, 0.9)", text: "#7c2d12", border: "rgba(245, 158, 11, 0.3)" },
          ocean: { primary: "#06b6d4", secondary: "#3b82f6", accent: "#8b5cf6", bg: "#f0f9ff", cardBg: "rgba(255, 255, 255, 0.9)", text: "#0c4a6e", border: "rgba(6, 182, 212, 0.3)" },
          lavender: { primary: "#a78bfa", secondary: "#c084fc", accent: "#e879f9", bg: "#faf5ff", cardBg: "rgba(255, 255, 255, 0.9)", text: "#581c87", border: "rgba(167, 139, 250, 0.3)" },
          charcoal: { primary: "#6b7280", secondary: "#9ca3af", accent: "#d1d5db", bg: "#1f2937", cardBg: "rgba(31, 41, 55, 0.9)", text: "#f9fafb", border: "rgba(107, 114, 128, 0.3)" },
          rose: { primary: "#f43f5e", secondary: "#ec4899", accent: "#f472b6", bg: "#fff1f2", cardBg: "rgba(255, 255, 255, 0.9)", text: "#881337", border: "rgba(244, 63, 94, 0.3)" },
        };
        const theme = themes[settings.theme] || themes.gemini;
        document.body.className = document.body.className.replace(/theme-\w+/g, "");
        document.body.classList.add(`theme-${settings.theme}`);
        root.style.setProperty("--primary-color", theme.primary);
        root.style.setProperty("--secondary-color", theme.secondary);
        root.style.setProperty("--accent-color", theme.accent);
        root.style.setProperty("--bg-color", theme.bg);
        root.style.setProperty("--card-bg", theme.cardBg);
        root.style.setProperty("--text-color", theme.text);
        root.style.setProperty("--border-color", theme.border);
        root.style.setProperty("--font-family", settings.fontFamily);
        root.style.setProperty("--font-size", `${settings.fontSize}px`);
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
  }, []);

  // Load nodes
  useEffect(() => {
    const unsubscribe = onSnapshot(cardsCol, (snapshot) => {
      const firebaseNodes = snapshot.docs.map((docData) => {
        const data = docData.data();
        const isEditing = editingId === docData.id;
        const isMatch = searchTerm && data.label.toLowerCase().includes(searchTerm.toLowerCase());
        const rawLabel = data.label || '';

        return {
          id: docData.id,
          position: { x: data.x || 0, y: data.y || 0 },
          data: { 
            rawLabel: rawLabel,
            label: rawLabel,
            color: data.color || '#ffffff',
          },
        };
      });
      setNodes(firebaseNodes);
    });
    return () => unsubscribe();
  }, [editingId, searchTerm]);

  // Load journal entries
  useEffect(() => {
    const unsubscribe = onSnapshot(journalCol, (snapshot) => {
      const entries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setJournalEntries(entries);
    });
    return () => unsubscribe();
  }, []);

  // Parse tasks from notes
  useEffect(() => {
    const allTasks = [];
    nodes.forEach((node) => {
      const rawLabel = node.data?.rawLabel || '';
      if (rawLabel) {
        const checkboxRegex = /- \[([ x])\]\s*(.+)/g;
        let match;
        while ((match = checkboxRegex.exec(rawLabel)) !== null) {
          const isCompleted = match[1] === 'x';
          const taskText = match[2].trim();
          const dueDateMatch = taskText.match(/@due:(\S+)/);
          let dueDate = null;
          let cleanText = taskText;
          if (dueDateMatch) {
            const dateStr = dueDateMatch[1];
            if (dateStr === 'today') {
              dueDate = new Date();
              dueDate.setHours(23, 59, 59, 999);
            } else {
              dueDate = new Date(dateStr);
            }
            cleanText = taskText.replace(/@due:\S+\s*/, '').trim();
          }
          allTasks.push({
            id: `${node.id}-${allTasks.length}`,
            nodeId: node.id,
            text: cleanText,
            completed: isCompleted,
            dueDate: dueDate,
            noteLabel: rawLabel.substring(0, 50) + (rawLabel.length > 50 ? '...' : ''),
          });
        }
      }
    });
    setTasks(allTasks);
  }, [nodes]);

  const onUpdateField = async (id, data) => { 
    await setDoc(doc(cardsCol, id), data, { merge: true }); 
  };


  // Add journal entry
  const handleAddJournalEntry = async () => {
    if (!journalInput.trim()) return;
    await addDoc(journalCol, {
      text: journalInput.trim(),
      timestamp: Date.now(),
    });
    setJournalInput("");
  };

  // Toggle task checkbox
  const toggleTask = async (task) => {
    const node = nodes.find(n => n.id === task.nodeId);
    if (!node) return;
    const currentLabel = node.data?.rawLabel || '';
    const checkboxRegex = /- \[([ x])\]\s*(.+)/g;
    let match;
    let newLabel = currentLabel;
    const replacements = [];
    
    while ((match = checkboxRegex.exec(currentLabel)) !== null) {
      const taskText = match[2].trim();
      const cleanTaskText = taskText.replace(/@due:\S+\s*/, '').trim();
      if (cleanTaskText === task.text || taskText.includes(task.text)) {
        const isCompleted = match[1] === 'x';
        const replacement = isCompleted ? `- [ ] ${match[2]}` : `- [x] ${match[2]}`;
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          replacement: replacement
        });
      }
    }
    
    replacements.reverse().forEach(({ start, end, replacement }) => {
      newLabel = newLabel.substring(0, start) + replacement + newLabel.substring(end);
    });
    
    await onUpdateField(task.nodeId, { label: newLabel });
  };

  // Categorize tasks
  const categorizedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const overdue = [];
    const todayTasks = [];
    const tomorrowTasks = [];
    const thisWeek = [];
    const later = [];
    const noDate = [];

    tasks.forEach((task) => {
      if (task.completed) return;
      
      if (!task.dueDate) {
        noDate.push(task);
      } else {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < today) {
          overdue.push(task);
        } else if (due.getTime() === today.getTime()) {
          todayTasks.push(task);
        } else if (due.getTime() === tomorrow.getTime()) {
          tomorrowTasks.push(task);
        } else if (due <= nextWeek) {
          thisWeek.push(task);
        } else {
          later.push(task);
        }
      }
    });

    return { overdue, today: todayTasks, tomorrow: tomorrowTasks, thisWeek, later, noDate };
  }, [tasks]);

  const { logout } = useAuth();

  const filteredJournalEntries = useMemo(() => {
    if (!journalSearch) return journalEntries;
    return journalEntries.filter(entry => 
      entry.text.toLowerCase().includes(journalSearch.toLowerCase())
    );
  }, [journalEntries, journalSearch]);

  const filteredNotes = useMemo(() => {
    if (!searchTerm) return nodes;
    return nodes.filter(node => 
      (node.data?.rawLabel || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nodes, searchTerm]);

  return (
    <div className="mobile-app">
      {/* Header */}
      <div className="mobile-header">
        <h1 className="mobile-title">Infinite Notes</h1>
        <div className="mobile-header-actions">
          <button 
            onClick={() => setShowAIChat(!showAIChat)}
            className="mobile-icon-btn"
            aria-label="AI Chat"
          >
            🤖
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="mobile-icon-btn"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-content">
        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="mobile-notes-view">
            <div className="mobile-search-bar">
              <input
                type="text"
                placeholder="🔍 Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                    if (isRegularKey) {
                      playSound();
                    }
                  }
                }}
                className="mobile-search-input"
              />
              <button
                onClick={() => addDoc(cardsCol, { label: '', x: 0, y: 0, color: '#ffffff' })}
                className="mobile-add-btn"
              >
                + New Note
              </button>
            </div>

            <div className="mobile-notes-list">
              {filteredNotes.map((node) => {
                const isEditing = editingId === node.id;
                const isSelected = selectedNoteId === node.id;
                
                return (
                  <div
                    key={node.id}
                    className={`mobile-note-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedNoteId(isSelected ? null : node.id);
                      }
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        defaultValue={node.data?.rawLabel || ''}
                        onChange={(e) => {
                          onUpdateField(node.id, { label: e.target.value });
                        }}
                        onBlur={(e) => {
                          onUpdateField(node.id, { label: e.target.value });
                          setTimeout(() => setEditingId(null), 300);
                        }}
                        onKeyDown={(e) => {
                          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                            const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                            if (isRegularKey) {
                              playSound();
                            }
                          }
                        }}
                        className="mobile-note-textarea"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="mobile-note-content">
                        <div className="mobile-note-text">
                          <ReactMarkdown>{node.data?.rawLabel || "_Tap to edit_"}</ReactMarkdown>
                        </div>
                        <div className="mobile-note-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(node.id);
                            }}
                            className="mobile-note-action-btn"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAIAssistant(true);
                              setAIContent(node.data?.rawLabel || '');
                            }}
                            className="mobile-note-action-btn"
                          >
                            🤖
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteDoc(doc(cardsCol, node.id));
                            }}
                            className="mobile-note-action-btn"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredNotes.length === 0 && (
                <div className="mobile-empty-state">
                  <p>No notes yet. Create your first note!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === "journal" && (
          <div className="mobile-journal-view">
            <div className="mobile-search-bar">
              <input
                type="text"
                placeholder="🔍 Search journal..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                    if (isRegularKey) {
                      playSound();
                    }
                  }
                }}
                className="mobile-search-input"
              />
            </div>
            <div className="mobile-journal-input">
              <textarea
                placeholder="Quick capture your thoughts..."
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                    if (isRegularKey) {
                      playSound();
                    }
                  }
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleAddJournalEntry();
                  }
                }}
                className="mobile-journal-textarea"
                rows={3}
              />
              <button
                onClick={handleAddJournalEntry}
                className="mobile-add-btn"
              >
                Add Entry
              </button>
            </div>
            <div className="mobile-journal-entries">
              {filteredJournalEntries.map((entry) => (
                <div key={entry.id} className="mobile-journal-entry">
                  <div className="mobile-journal-text">
                    <ReactMarkdown>{entry.text}</ReactMarkdown>
                  </div>
                  <div className="mobile-journal-meta">
                    <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setShowAIAssistant(true);
                        setAIContent(entry.text);
                      }}
                      className="mobile-journal-ai-btn"
                    >
                      🤖 AI
                    </button>
                  </div>
                </div>
              ))}
              {filteredJournalEntries.length === 0 && (
                <div className="mobile-empty-state">
                  <p>No journal entries yet. Start writing!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="mobile-tasks-view">
            <div className="mobile-tasks-list">
              {categorizedTasks.overdue.length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title overdue">⚠️ Overdue</h3>
                  {categorizedTasks.overdue.map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {categorizedTasks.today.length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title">📅 Today</h3>
                  {categorizedTasks.today.map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {categorizedTasks.tomorrow.length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title">📆 Tomorrow</h3>
                  {categorizedTasks.tomorrow.map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {categorizedTasks.thisWeek.length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title">📋 This Week</h3>
                  {categorizedTasks.thisWeek.map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {categorizedTasks.later.length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title">🔮 Later</h3>
                  {categorizedTasks.later.map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {categorizedTasks.noDate.length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title">📝 No Date</h3>
                  {categorizedTasks.noDate.map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {tasks.filter(t => t.completed).length > 0 && (
                <div className="mobile-task-section">
                  <h3 className="mobile-task-section-title">✅ Completed</h3>
                  {tasks.filter(t => t.completed).map((task) => (
                    <div key={task.id} className="mobile-task-item">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="mobile-task-checkbox"
                      />
                      <span className="completed">{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {tasks.length === 0 && (
                <div className="mobile-empty-state">
                  <p>No tasks yet. Add checkboxes to your notes!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <span className="mobile-nav-icon">📝</span>
          <span className="mobile-nav-label">Notes</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === "journal" ? "active" : ""}`}
          onClick={() => setActiveTab("journal")}
        >
          <span className="mobile-nav-icon">📔</span>
          <span className="mobile-nav-label">Journal</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <span className="mobile-nav-icon">✅</span>
          <span className="mobile-nav-label">Tasks</span>
        </button>
        <button
          className="mobile-nav-btn"
          onClick={logout}
        >
          <span className="mobile-nav-icon">🚪</span>
          <span className="mobile-nav-label">Logout</span>
        </button>
      </div>

      {/* Modals */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAIAssistant && (
        <AIAssistant
          content={aiContent}
          onClose={() => {
            setShowAIAssistant(false);
            setAIContent('');
          }}
        />
      )}

      {showAIChat && (
        <AIChatAssistant
          nodes={nodes}
          journalEntries={journalEntries}
          onNewNote={(title, content) => {
            const newNote = {
              label: `# ${title}\n\n${content}`,
              rawLabel: `# ${title}\n\n${content}`,
              position: { x: 0, y: 0 },
            };
            addDoc(cardsCol, newNote);
          }}
          onUpdateNote={(noteId, updates) => {
            onUpdateField(noteId, updates);
          }}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </div>
  );
}

export default function MobileApp() {
  const { user } = useAuth();
  return <MobileFlowEditor user={user} />;
}

