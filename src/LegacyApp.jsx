import { useState, useCallback, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { db } from './firebase';
import { doc, setDoc, onSnapshot, collection, addDoc, deleteDoc } from 'firebase/firestore';
import Landing from './Landing';
import Login from './Login';
import Signup from './Signup';
import PrivateRoute from './PrivateRoute';
import Settings from './Settings';
import Tutorial from './Tutorial';
import WorkspaceTemplates from './WorkspaceTemplates';
import AIAssistant from './AIAssistant';
import AIChatAssistant from './AIChatAssistant';
import MobileApp from './MobileApp';
import { callGemini } from './gemini';
import { useTypingSounds } from './useTypingSounds';
import { AuthProvider, useAuth } from "./CustomAuthContext";
import NoteCard from './NoteCard';
import { ensureHtmlContent, stripHtml, escapeHtml } from './utils/richText';

function FlowEditorWrapper() {
  const { user } = useAuth();
  return <FlowEditor user={user}/>;
}

function FlowEditor({ user }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalInput, setJournalInput] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [showTasks, setShowTasks] = useState(false);
  const [showJournal, setShowJournal] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all"); // all, active, completed
  const [taskSearch, setTaskSearch] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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
      setTypingSoundType(settings.typingSoundType || "mechanical");
      setTypingSoundVolume(settings.typingSoundVolume || 0.3);
    };
    
    // Listen for custom event (same tab)
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    // Listen for storage event (other tabs)
    window.addEventListener("storage", handleSettingsUpdate);
    
    // Initial load
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
  const workspacesCol = collection(db, "users", user.id, "workspaces");
  
  const { setCenter, screenToFlowPosition } = useReactFlow();

  // Load journal entries
  useEffect(() => {
    const unsubscribe = onSnapshot(journalCol, (snapshot) => {
      const entries = snapshot.docs.map((docData) => ({
        id: docData.id,
        text: docData.data().text,
        timestamp: docData.data().timestamp || Date.now(),
      }));
      setJournalEntries(entries.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, [journalCol]);

  // Load saved workspaces
  useEffect(() => {
    const unsubscribe = onSnapshot(workspacesCol, (snapshot) => {
      const loadedWorkspaces = snapshot.docs.map((docData) => ({
        id: docData.id,
        name: docData.data().name,
        layout: docData.data().layout,
        hotkey: docData.data().hotkey,
        isCustom: true,
      }));
      setWorkspaces(loadedWorkspaces);
    });
    return () => unsubscribe();
  }, [workspacesCol]);

  // Apply workspace layout
  const applyWorkspace = (workspace) => {
    if (!workspace || !workspace.layout) return;
    const layout = workspace.layout;
    setShowJournal(layout.showJournal ?? true);
    setShowTasks(layout.showTasks ?? false);
    setSelectedNoteId(layout.selectedNoteId || null);
    setCurrentWorkspace(workspace);
  };

  // Apply template
  const applyTemplate = (template) => {
    setShowJournal(template.layout.showJournal ?? true);
    setShowTasks(template.layout.showTasks ?? false);
    // Only set selectedNoteId if showNote is explicitly true in template
    // Otherwise, let user select a note to view
    setSelectedNoteId(template.layout.selectedNoteId || null);
    setCurrentWorkspace({
      id: 'template',
      name: template.name,
      layout: template.layout,
      isTemplate: true,
    });
  };

  // Save current layout as workspace
  const saveCurrentWorkspace = async (name) => {
    const layout = {
      showJournal,
      showTasks,
      showGraph: true,
      showNote: selectedNoteId !== null,
      showPDF: false,
      journalWidth: 320,
      tasksWidth: 360,
      noteWidth: 400,
      layoutType: selectedNoteId ? "note-focused" : currentWorkspace?.layout?.layoutType || "default",
      selectedNoteId,
    };
    await addDoc(workspacesCol, { name, layout, createdAt: Date.now() });
  };

  // Hotkey support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + number to switch workspaces
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const workspace = workspaces.find((ws) => ws.hotkey === num.toString());
          if (workspace) {
            applyWorkspace(workspace);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workspaces]);

  // Close workspace menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showWorkspaceMenu && !e.target.closest('[data-workspace-menu]')) {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWorkspaceMenu]);

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

  const stripHtml = (input = '') => input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const ensureHtmlContent = (value = '') => {
    if (!value) return '<p><br/></p>';
    const trimmed = value.trim();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      return trimmed;
    }
    return marked.parse(trimmed);
  };

  const tasks = useMemo(() => {
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return [];
    const parser = new DOMParser();
    const allTasks = [];

    nodes.forEach((node) => {
      const html = node.data?.rawLabel || '';
      if (!html) return;
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const items = doc.querySelectorAll('li[data-list="checked"], li[data-list="unchecked"]');
      const notePreview = stripHtml(html);

      items.forEach((item, index) => {
        const textContent = item.textContent?.trim() || '';
        const dueDateMatch = textContent.match(/@due:(\S+)/);
        let dueDate = null;
        let cleanText = textContent;
        if (dueDateMatch) {
          const dateStr = dueDateMatch[1];
          if (dateStr === 'today') {
            dueDate = new Date();
            dueDate.setHours(23, 59, 59, 999);
          } else {
            dueDate = new Date(dateStr);
          }
          cleanText = textContent.replace(/@due:\S+\s*/, '').trim();
        }

        allTasks.push({
          id: `${node.id}-${index}`,
          nodeId: node.id,
          text: cleanText,
          completed: item.getAttribute('data-list') === 'checked',
          dueDate,
          noteLabel: notePreview.substring(0, 60) + (notePreview.length > 60 ? '...' : ''),
          listIndex: index,
        });
      });
    });

    return allTasks;
  }, [nodes]);

  // Categorize tasks by due date
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
      // Skip completed tasks in categorization (they'll be shown separately)
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

  useEffect(() => {
    const unsubscribe = onSnapshot(cardsCol, (snapshot) => {
      const firebaseNodes = snapshot.docs.map((docData) => {
        const data = docData.data();
        const htmlContent = ensureHtmlContent(data.label || data.rawLabel || '');
        const plainText = stripHtml(htmlContent);
        const nodeSize = data.size || { width: data.width || 400, height: data.height || 320 };
        const isMatch = searchTerm
          ? (data.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            plainText.toLowerCase().includes(searchTerm.toLowerCase())
          : false;

        return {
          id: docData.id,
          position: { x: data.x ?? 0, y: data.y ?? 0 },
          style: { 
            background: 'transparent', 
            border: isMatch ? '3px solid #9b72cb' : '1px solid transparent',
            borderRadius: '18px',
            padding: 0,
            width: Math.max(nodeSize.width || 400, 360),
          },
          data: { 
            rawLabel: htmlContent,
            plainText,
            label: (
              <NoteCard
                id={docData.id}
                title={data.title || ''}
                content={htmlContent}
                color={data.color || '#FFFFFF'}
                size={nodeSize}
                isCollapsed={data.isCollapsed || false}
                onChangeContent={(html) => handleContentChange(docData.id, html)}
                onChangeTitle={(value) => onUpdateField(docData.id, { title: value })}
                onColorChange={(value) => onUpdateField(docData.id, { color: value })}
                onDuplicate={() => handleDuplicateNote(data, htmlContent)}
                onDelete={() => deleteDoc(doc(cardsCol, docData.id))}
                onToggleCollapse={(collapsed) => onUpdateField(docData.id, { isCollapsed: collapsed })}
                onResize={(newSize) => onUpdateField(docData.id, { size: newSize })}
              />
            ),
          },
        };
      });
      setNodes(firebaseNodes);
    });
    return () => unsubscribe();
  }, [cardsCol, searchTerm]);

  useEffect(() => {
    const unsubscribe = onSnapshot(edgesCol, (snapshot) => {
      const firebaseEdges = snapshot.docs.map((docData) => ({ id: docData.id, source: docData.data().source, target: docData.data().target }));
      setEdges(firebaseEdges);
    });
    return () => unsubscribe();
  }, []);

  const onUpdateField = useCallback(async (id, data) => {
    await setDoc(
      doc(cardsCol, id),
      { ...data, updatedAt: Date.now() },
      { merge: true }
    );
  }, [cardsCol]);

  const handleContentChange = useCallback((id, html) => {
    const nextHtml = html && html.trim() ? html : '<p><br/></p>';
    onUpdateField(id, {
      label: nextHtml,
      rawLabel: nextHtml,
      plainText: stripHtml(nextHtml),
    });
  }, [onUpdateField]);

  const handleDuplicateNote = useCallback(async (noteData, htmlContent) => {
    const offsetPosition = {
      x: (noteData.x ?? 0) + 40,
      y: (noteData.y ?? 0) + 40,
    };
    await createNoteAtPosition(offsetPosition, {
      title: `${noteData.title || 'Untitled Note'} Copy`,
      label: htmlContent,
      color: noteData.color,
      folder: noteData.folder,
      size: noteData.size,
    });
  }, [createNoteAtPosition]);

  const createNoteAtPosition = useCallback(async (position, overrides = {}) => {
    const html = overrides.label ? ensureHtmlContent(overrides.label) : '<p><br/></p>';
    await addDoc(cardsCol, {
      title: overrides.title || 'Untitled Note',
      label: html,
      rawLabel: html,
      plainText: stripHtml(html),
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      color: overrides.color || '#FFFFFF',
      folder: overrides.folder || 'All Notes',
      size: overrides.size || { width: 400, height: 320 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, [cardsCol]);

  const onNodesDelete = useCallback(async (deletedNodes) => { for (const node of deletedNodes) { await deleteDoc(doc(cardsCol, node.id)); } }, [cardsCol]);
  const onEdgesDelete = useCallback(async (deletedEdges) => { for (const edge of deletedEdges) { await deleteDoc(doc(edgesCol, edge.id)); } }, [edgesCol]);
  const onConnect = useCallback(async (params) => {
    const edgeId = `e-${params.source}-${params.target}`;
    await setDoc(doc(edgesCol, edgeId), { source: params.source, target: params.target });
    
    // AI: Suggest why these notes are connected (background, non-blocking)
    setTimeout(async () => {
      try {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        if (sourceNode && targetNode) {
          const sourceText = sourceNode.data?.rawLabel?.substring(0, 200) || '';
          const targetText = targetNode.data?.rawLabel?.substring(0, 200) || '';
          const prompt = `These two notes were just connected:\n\nNote 1: ${sourceText}\n\nNote 2: ${targetText}\n\nSuggest why they might be related (one sentence).`;
          const suggestion = await callGemini(prompt, { maxTokens: 100 });
          console.log('💡 Connection insight:', suggestion);
        }
      } catch (e) {
        // Silently fail - this is just a nice-to-have feature
      }
    }, 500);
  }, [edgesCol, nodes]);
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onNodeDragStop = async (event, node) => { await setDoc(doc(cardsCol, node.id), { x: node.position.x, y: node.position.y }, { merge: true }); };

  // Add journal entry
  const handleAddJournalEntry = async () => {
    if (!journalInput.trim()) return;
    await addDoc(journalCol, {
      text: journalInput.trim(),
      timestamp: Date.now(),
    });
    setJournalInput("");
  };

  // Drag journal entry to create note
  const handleJournalDragStart = (e, entry) => {
    e.dataTransfer.setData('journal-entry', JSON.stringify(entry));
  };

  const handleJournalDrop = async (e) => {
    e.preventDefault();
    const entryData = e.dataTransfer.getData('journal-entry');
    if (entryData) {
      const entry = JSON.parse(entryData);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      await addDoc(cardsCol, {
        label: entry.text,
        x: position.x,
        y: position.y,
        color: '#ffffff',
      });
    }
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
      // Remove @due: part for comparison
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
    
    // Apply replacements in reverse order to maintain indices
    replacements.reverse().forEach(({ start, end, replacement }) => {
      newLabel = newLabel.substring(0, start) + replacement + newLabel.substring(end);
    });
    
    await onUpdateField(task.nodeId, { label: newLabel });
  };


  // Close menu when clicking outside or when editing starts
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNoteMenu && !e.target.closest('[data-note-menu]') && !e.target.closest('[data-note-menu-btn]')) {
        setShowNoteMenu(null);
      }
    };
    if (showNoteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNoteMenu]);
  
  // Close menu when editing starts
  useEffect(() => {
    if (editingId) {
      setShowNoteMenu(null);
    }
  }, [editingId]);

  const { logout } = useAuth();
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: 'var(--bg-color, #f5f5f7)' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 4, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            data-tutorial="new-note-btn"
            onClick={() => {
              // Create note in center of viewport
              const centerPosition = screenToFlowPosition({ 
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2 
              });
              addDoc(cardsCol, { 
                label: '', 
                x: centerPosition.x, 
                y: centerPosition.y, 
                color: '#ffffff' 
              });
            }} 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              background: 'linear-gradient(135deg, #4285f4, #9b72cb, #d96570)',
              backgroundSize: '200% 200%',
              color: 'white', 
              border: 'none',
              borderRadius: '12px', 
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(155, 114, 203, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(155, 114, 203, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(155, 114, 203, 0.3)';
            }}
          >
            + New Note
          </button>
          <button
            onClick={async () => {
              // AI-powered note suggestion
              try {
                const context = nodes.slice(0, 5).map(n => n.data?.rawLabel?.substring(0, 100)).join('\n');
                const aiPrompt = `Based on these notes:\n${context}\n\nSuggest 3 new note ideas that would be valuable. Format as:\n1. Title\n2. Title\n3. Title`;
                const suggestions = await callGemini(aiPrompt, { maxTokens: 200 });
                const titles = suggestions.match(/\d+\.\s*(.+)/g) || suggestions.split('\n').filter(l => l.trim());
                if (titles.length > 0) {
                  const cleanTitles = titles.map(t => t.replace(/^\d+\.\s*/, '').trim()).filter(t => t);
                  const selected = window.prompt(`AI suggests these notes:\n\n${cleanTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nEnter a number (1-${cleanTitles.length}) to create that note, or type a custom title:`);
                  if (selected) {
                    const num = parseInt(selected);
                    let title = selected.trim();
                    if (!isNaN(num) && num >= 1 && num <= cleanTitles.length) {
                      title = cleanTitles[num - 1];
                    }
                    if (title) {
                      const centerPosition = screenToFlowPosition({ 
                        x: window.innerWidth / 2, 
                        y: window.innerHeight / 2 
                      });
                      await addDoc(cardsCol, {
                        label: `# ${title}\n\n`,
                        rawLabel: `# ${title}\n\n`,
                        x: centerPosition.x,
                        y: centerPosition.y,
                        color: '#ffffff'
                      });
                    }
                  }
                }
              } catch (e) {
                console.error('AI suggestion error:', e);
                // Fallback to regular note
                const centerPosition = screenToFlowPosition({ 
                  x: window.innerWidth / 2, 
                  y: window.innerHeight / 2 
                });
                addDoc(cardsCol, { 
                  label: '', 
                  x: centerPosition.x, 
                  y: centerPosition.y, 
                  color: '#ffffff' 
                });
              }
            }}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              background: 'rgba(155, 114, 203, 0.1)',
              border: '1px solid rgba(155, 114, 203, 0.3)',
              color: '#9b72cb',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
            }}
            title="AI-powered note suggestions"
          >
            ✨ AI Suggest
          </button>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            placeholder="🔍 Search or ask AI..." 
            onChange={(e) => setSearchTerm(e.target.value)} 
            value={searchTerm}
            onKeyDown={async (e) => {
              // Play typing sound
              if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                if (isRegularKey) {
                  playSound();
                }
              }
              
              // AI-powered search on Ctrl/Cmd + Enter
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && searchTerm.trim()) {
                e.preventDefault();
                try {
                  const context = nodes.slice(0, 10).map(n => n.data?.rawLabel?.substring(0, 150)).join('\n');
                  const prompt = `User is searching for: "${searchTerm}"\n\nIn their notes:\n${context}\n\nProvide a smart search result that:\n1. Finds relevant notes\n2. Suggests related concepts\n3. Offers search refinements`;
                  const aiResult = await callGemini(prompt, { maxTokens: 300 });
                  alert(`AI Search Results:\n\n${aiResult}`);
                } catch (err) {
                  console.error('AI search error:', err);
                }
              }
            }}
            style={{ 
              padding: '10px 14px', 
              borderRadius: '12px', 
              border: '1px solid rgba(155, 114, 203, 0.3)', 
              width: '200px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#9b72cb';
              e.target.style.boxShadow = '0 0 0 3px rgba(155, 114, 203, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(155, 114, 203, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchTerm && (
            <button
              onClick={async () => {
                try {
                  const context = nodes.slice(0, 10).map(n => n.data?.rawLabel?.substring(0, 150)).join('\n');
                  const prompt = `User is searching for: "${searchTerm}"\n\nIn their notes:\n${context}\n\nProvide a smart search result that finds relevant notes and suggests related concepts.`;
                  const aiResult = await callGemini(prompt, { maxTokens: 300 });
                  alert(`AI Search Results:\n\n${aiResult}`);
                } catch (err) {
                  console.error('AI search error:', err);
                }
              }}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="AI-powered search (Ctrl+Enter)"
            >
              🤖
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowTasks(!showTasks)}
          style={{ 
            padding: '10px 20px', 
            background: showTasks ? 'rgba(155, 114, 203, 0.2)' : 'rgba(155, 114, 203, 0.1)', 
            border: '1px solid rgba(155, 114, 203, 0.3)', 
            color: '#9b72cb', 
            borderRadius: '12px', 
            fontWeight: 600, 
    cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          📋 Tasks ({tasks.filter(t => !t.completed).length})
        </button>
        {!showJournal && (
          <button 
            onClick={() => setShowJournal(true)}
            style={{ 
              padding: '10px 20px', 
              background: 'rgba(155, 114, 203, 0.1)', 
              border: '1px solid rgba(155, 114, 203, 0.3)', 
              color: '#9b72cb', 
              borderRadius: '12px', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📔 Journal
          </button>
        )}
        <div style={{ position: 'relative' }} data-workspace-menu>
          <button 
            data-tutorial="workspaces-btn"
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            style={{ 
              padding: '10px 20px', 
              background: currentWorkspace ? 'rgba(155, 114, 203, 0.2)' : 'rgba(155, 114, 203, 0.1)', 
              border: '1px solid rgba(155, 114, 203, 0.3)', 
              color: '#9b72cb', 
              borderRadius: '12px', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🎨 Workspaces {currentWorkspace ? `(${currentWorkspace.name})` : ''}
          </button>
          {showWorkspaceMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              width: '320px',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(155, 114, 203, 0.2)',
              zIndex: 1000,
            }}>
              <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#9b72cb' }}>
                Saved Workspaces
              </div>
              {workspaces.length > 0 ? (
                workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => {
                      applyWorkspace(ws);
                      setShowWorkspaceMenu(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '6px',
                      backgroundColor: currentWorkspace?.id === ws.id ? 'rgba(155, 114, 203, 0.1)' : 'rgba(155, 114, 203, 0.05)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: currentWorkspace?.id === ws.id ? '1px solid rgba(155, 114, 203, 0.3)' : '1px solid transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (currentWorkspace?.id !== ws.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(155, 114, 203, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentWorkspace?.id !== ws.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(155, 114, 203, 0.05)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{ws.name}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  No saved workspaces yet
                </div>
              )}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(155, 114, 203, 0.2)' }}>
                <button
                  onClick={() => {
                    setShowTemplates(true);
                    setShowWorkspaceMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '8px',
                  }}
                >
                  📚 Browse Templates
                </button>
                {currentWorkspace && (
                  <button
                    onClick={() => {
                      setCurrentWorkspace(null);
                      setShowJournal(true);
                      setShowTasks(false);
                      setSelectedNoteId(null);
                      setShowWorkspaceMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: '#6b7280',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    Reset to Default
                  </button>
                )}
                <button
                  onClick={async () => {
                    const name = prompt("Save current layout as:");
                    if (name && name.trim()) {
                      await saveCurrentWorkspace(name.trim());
                      setShowWorkspaceMenu(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(155, 114, 203, 0.1)',
                    color: '#9b72cb',
                    border: '1px solid rgba(155, 114, 203, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  + Save Current Layout
                </button>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={() => setShowAIChat(!showAIChat)}
          style={{ 
            padding: '10px 20px', 
            background: 'linear-gradient(135deg, #4285f4, #9b72cb)', 
            border: 'none', 
            color: 'white', 
            borderRadius: '12px', 
            fontWeight: 600, 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: showAIChat ? '0 4px 12px rgba(66, 133, 244, 0.4)' : 'none',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = showAIChat ? '0 4px 12px rgba(66, 133, 244, 0.4)' : 'none';
          }}
        >
          🤖 AI Chat
        </button>
        <button 
          data-tutorial="settings-btn"
          onClick={() => setShowSettings(true)}
          style={{ 
            padding: '10px 20px', 
            background: 'rgba(155, 114, 203, 0.1)', 
            border: '1px solid rgba(155, 114, 203, 0.3)', 
            color: '#9b72cb', 
            borderRadius: '12px', 
            fontWeight: 600, 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
    display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(155, 114, 203, 0.15)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(155, 114, 203, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
          Settings
        </button>
        <button 
          onClick={logout} 
          style={{ 
            padding: '10px 20px', 
            background: 'rgba(217, 101, 112, 0.1)', 
            border: '1px solid rgba(217, 101, 112, 0.3)', 
            color: '#d96570', 
            borderRadius: '12px', 
            fontWeight: 600, 
            marginLeft: 20, 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(217, 101, 112, 0.15)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(217, 101, 112, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Logout
        </button>
      </div>

      {/* Daily Journal Panel */}
      {showJournal && currentWorkspace?.layout?.layoutType !== 'graph-only' && currentWorkspace?.layout?.layoutType !== 'focus' && (
        <div 
          data-tutorial="journal-panel"
          style={{
          position: 'absolute',
          top: 80,
          left: currentWorkspace?.layout?.layoutType === 'focus' ? '-340px' : '20px',
          width: currentWorkspace?.layout?.journalWidth || '320px',
          maxHeight: 'calc(100vh - 100px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
          zIndex: 3,
    display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'left 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#9b72cb' }}>📔 Daily Journal</h3>
            <button
              onClick={() => setShowJournal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#999',
                padding: '0',
                width: '24px',
                height: '24px',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Quick capture..."
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              onKeyDown={(e) => {
                // Play typing sound
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                  const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                  if (isRegularKey) {
                    playSound();
                  }
                }
                
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddJournalEntry();
                }
              }}
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
              onClick={handleAddJournalEntry}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
    fontWeight: 600,
              }}
            >
              Add
            </button>
          </div>
          <input
            type="text"
            placeholder="🔍 Search journal..."
            value={journalSearch}
            onChange={(e) => setJournalSearch(e.target.value)}
            onKeyDown={(e) => {
              // Play typing sound
              if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                if (isRegularKey) {
                  playSound();
                }
              }
            }}
            style={{
              padding: '8px 12px',
    borderRadius: '8px',
              border: '1px solid rgba(155, 114, 203, 0.2)',
              outline: 'none',
              fontSize: '13px',
              backgroundColor: 'rgba(155, 114, 203, 0.05)',
            }}
          />
          <div style={{ overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {journalEntries
              .filter(entry => 
                !journalSearch || entry.text.toLowerCase().includes(journalSearch.toLowerCase())
              )
              .map((entry) => (
              <div
                key={entry.id}
                draggable
                onDragStart={(e) => handleJournalDragStart(e, entry)}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(155, 114, 203, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(155, 114, 203, 0.2)',
                  cursor: 'grab',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(155, 114, 203, 0.1)';
                  e.currentTarget.style.cursor = 'grabbing';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(155, 114, 203, 0.05)';
                  e.currentTarget.style.cursor = 'grab';
                }}
              >
                {entry.text}
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAIContent(entry.text);
                      setShowAIAssistant(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '4px',
                      width: '24px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                    title="AI Assistant"
                  >
                    🤖
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteDoc(doc(journalCol, entry.id));
                    }}
                    style={{
                      background: 'rgba(217, 101, 112, 0.1)',
                      border: '1px solid rgba(217, 101, 112, 0.3)',
                      color: '#d96570',
                      borderRadius: '4px',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                    title="Delete entry"
                  >
                    ×
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                  {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {journalEntries.filter(entry => 
              !journalSearch || entry.text.toLowerCase().includes(journalSearch.toLowerCase())
            ).length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: '13px' }}>
                {journalSearch ? 'No entries match your search' : 'No journal entries yet. Start capturing your thoughts!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Management Sidebar */}
      {showTasks && currentWorkspace?.layout?.layoutType !== 'graph-only' && currentWorkspace?.layout?.layoutType !== 'focus' && (
        <div 
          data-tutorial="tasks-panel"
          style={{
          position: 'absolute',
          top: 80,
          right: currentWorkspace?.layout?.layoutType === 'focus' ? '-380px' : '20px',
          width: currentWorkspace?.layout?.tasksWidth || '360px',
          maxHeight: 'calc(100vh - 100px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
          zIndex: 3,
          overflowY: 'auto',
          transition: 'right 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#9b72cb' }}>📋 Task Management</h3>
            <button
              onClick={() => setShowTasks(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#999',
                padding: '0',
                width: '24px',
                height: '24px',
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              onKeyDown={(e) => {
                // Play typing sound
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                  const isRegularKey = e.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(e.key);
                  if (isRegularKey) {
                    playSound();
                  }
                }
              }}
              style={{
    flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(155, 114, 203, 0.2)',
    outline: 'none',
                fontSize: '13px',
                backgroundColor: 'rgba(155, 114, 203, 0.05)',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTaskFilter('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(155, 114, 203, 0.3)',
                background: taskFilter === 'all' ? 'rgba(155, 114, 203, 0.2)' : 'rgba(155, 114, 203, 0.05)',
                color: '#9b72cb',
    fontSize: '12px',
                fontWeight: 600,
    cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              onClick={() => setTaskFilter('active')}
              style={{
    padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(155, 114, 203, 0.3)',
                background: taskFilter === 'active' ? 'rgba(155, 114, 203, 0.2)' : 'rgba(155, 114, 203, 0.05)',
                color: '#9b72cb',
                fontSize: '12px',
                fontWeight: 600,
    cursor: 'pointer',
              }}
            >
              Active
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(155, 114, 203, 0.3)',
                background: taskFilter === 'completed' ? 'rgba(155, 114, 203, 0.2)' : 'rgba(155, 114, 203, 0.05)',
                color: '#9b72cb',
    fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Completed
            </button>
          </div>
          
          {Object.entries(categorizedTasks).map(([category, categoryTasks]) => {
            const filteredTasks = categoryTasks.filter(task => {
              const matchesFilter = taskFilter === 'all' || 
                (taskFilter === 'active' && !task.completed) ||
                (taskFilter === 'completed' && task.completed);
              const matchesSearch = !taskSearch || task.text.toLowerCase().includes(taskSearch.toLowerCase());
              return matchesFilter && matchesSearch;
            });
            
            if (filteredTasks.length === 0) return null;
            if (categoryTasks.length === 0) return null;
            const categoryLabels = {
              overdue: '🔴 Overdue',
              today: '📅 Today',
              tomorrow: '⏰ Tomorrow',
              thisWeek: '📆 This Week',
              later: '📌 Later',
              noDate: '📝 No Date',
            };
  return (
              <div key={category} style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                  {categoryLabels[category]} ({filteredTasks.length})
                </h4>
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: 'rgba(155, 114, 203, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(155, 114, 203, 0.2)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleTask(task)}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.5' }}>
                      <div style={{ color: task.completed ? '#999' : '#333', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.text}
      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        From: {task.noteLabel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          
          {taskFilter === 'completed' && tasks.filter(t => t.completed).length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(155, 114, 203, 0.2)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                ✅ Completed ({tasks.filter(t => t.completed).length})
              </h4>
              {tasks
                .filter(t => t.completed && (!taskSearch || t.text.toLowerCase().includes(taskSearch.toLowerCase())))
                .map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: 'rgba(155, 114, 203, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(155, 114, 203, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    opacity: 0.7,
                  }}
                  onClick={() => toggleTask(task)}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.5' }}>
                    <div style={{ color: '#999', textDecoration: 'line-through' }}>
                      {task.text}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      From: {task.noteLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {tasks.filter(t => 
            (taskFilter === 'all' || (taskFilter === 'active' && !t.completed) || (taskFilter === 'completed' && t.completed)) &&
            (!taskSearch || t.text.toLowerCase().includes(taskSearch.toLowerCase()))
          ).length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: '13px' }}>
              {taskSearch ? 'No tasks match your search' : (
                <div>
                  No tasks found. Add checkboxes to your notes using:{' '}
                  <code style={{ backgroundColor: 'rgba(155, 114, 203, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    - [ ] Task name
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        onDrop={handleJournalDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ 
          width: '100%', 
          height: '100%',
          marginLeft: (() => {
            // Calculate left margin based on visible panels
            if (currentWorkspace?.layout?.layoutType === 'focus' || currentWorkspace?.layout?.layoutType === 'graph-only') {
              return 0;
            }
            if (currentWorkspace?.layout?.layoutType === 'three-pane' && currentWorkspace?.layout?.showNote && selectedNoteId) {
              // Three-pane: account for journal (if visible) + note panel
              const journalMargin = (currentWorkspace?.layout?.showJournal && showJournal) ? (currentWorkspace?.layout?.journalWidth || 320) + 20 : 0;
              return journalMargin + (currentWorkspace?.layout?.noteWidth || 400) + 20;
            }
            // Graph-focused: account for journal panel if visible
            if (showJournal && currentWorkspace?.layout?.layoutType !== 'graph-only') {
              return (currentWorkspace?.layout?.journalWidth || 320) + 20;
            }
            return 0;
          })(),
          marginRight: (() => {
            // Calculate right margin based on visible panels
            if (currentWorkspace?.layout?.layoutType === 'focus' || currentWorkspace?.layout?.layoutType === 'graph-only') {
              return 0;
            }
            if (currentWorkspace?.layout?.layoutType === 'three-pane' && currentWorkspace?.layout?.showPDF) {
              return (currentWorkspace?.layout?.pdfWidth || 400) + 20;
            }
            // Account for tasks panel if visible
            if (showTasks && currentWorkspace?.layout?.layoutType !== 'graph-only') {
              return (currentWorkspace?.layout?.tasksWidth || 360) + 20;
            }
            return 0;
          })(),
          display: currentWorkspace?.layout?.layoutType === 'focus' ? 'none' : 'block',
          transition: 'margin 0.3s ease, display 0.3s ease',
        }}
      >
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect} 
          onNodeDragStop={onNodeDragStop} 
          onNodesDelete={onNodesDelete} 
          onEdgesDelete={onEdgesDelete} 
          fitView 
        >
        <Background color="#aaa" gap={20} />
        <Controls />
      </ReactFlow>
      </div>

      {/* Focus Mode Note Editor */}
      {currentWorkspace?.layout?.layoutType === 'focus' && selectedNoteId && (
        <div style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          maxWidth: '90%',
          height: 'calc(100vh - 100px)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
          zIndex: 3,
          overflowY: 'auto',
        }}>
          {(() => {
            const selectedNode = nodes.find(n => n.id === selectedNoteId);
            if (!selectedNode) return <div>Note not found</div>;
            return (
              <div>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#9b72cb' }}>Focus Mode</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        const selectedNode = nodes.find(n => n.id === selectedNoteId);
                        if (selectedNode) {
                          setAIContent(selectedNode.data?.rawLabel || '');
                          setShowAIAssistant(true);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                      }}
                      title="AI Assistant"
                    >
                      🤖 AI Assistant
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNoteId(null);
                        setCurrentWorkspace(null);
                      }}
                      style={{
                        background: 'rgba(155, 114, 203, 0.1)',
                        border: '1px solid rgba(155, 114, 203, 0.3)',
                        fontSize: '16px',
                        cursor: 'pointer',
                        color: '#9b72cb',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                      }}
                    >
                      Exit Focus
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}>
                  <ReactMarkdown>{selectedNode.data?.rawLabel || ''}</ReactMarkdown>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Note Panel (for three-pane layout) */}
      {currentWorkspace?.layout?.layoutType === 'three-pane' && currentWorkspace?.layout?.showNote && selectedNoteId && currentWorkspace?.layout?.layoutType !== 'focus' && (
        <div style={{
          position: 'absolute',
          top: 80,
          left: (currentWorkspace?.layout?.showJournal && showJournal ? (currentWorkspace?.layout?.journalWidth || 320) + 40 : 20),
          width: currentWorkspace?.layout?.noteWidth || 400,
          height: 'calc(100vh - 100px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(155, 114, 203, 0.2)',
          zIndex: 3,
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#9b72cb' }}>📝 Note</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  const selectedNode = nodes.find(n => n.id === selectedNoteId);
                  if (selectedNode) {
                    setAIContent(selectedNode.data?.rawLabel || '');
                    setShowAIAssistant(true);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4285f4, #9b72cb)',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
                title="AI Assistant"
              >
                🤖 AI
              </button>
              <button
                onClick={() => setSelectedNoteId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                }}
              >
                ×
              </button>
            </div>
          </div>
          {(() => {
            const selectedNode = nodes.find(n => n.id === selectedNoteId);
            if (!selectedNode) return <div>Note not found</div>;
            return (
              <div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                  <ReactMarkdown>{selectedNode.data?.rawLabel || ''}</ReactMarkdown>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        user={user}
      />

      <Tutorial 
        user={user}
        onComplete={() => setShowTutorial(false)}
      />

      {showTemplates && (
        <WorkspaceTemplates
          isOpen={showTemplates}
          onSelectTemplate={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showAIAssistant && (
        <AIAssistant
          content={aiContent}
          onResult={(result, action) => {
            // Handle AI results based on action
            if (action === 'title' && selectedNoteId) {
              // Update note title (first line)
              const selectedNode = nodes.find(n => n.id === selectedNoteId);
              if (selectedNode) {
                const currentLabel = selectedNode.data?.rawLabel || '';
                const newLabel = `# ${result.trim()}\n\n${currentLabel}`;
                onUpdateField(selectedNoteId, { label: newLabel, rawLabel: newLabel });
              }
            } else if (action === 'tasks' && selectedNoteId) {
              // Append tasks to note
              const selectedNode = nodes.find(n => n.id === selectedNoteId);
              if (selectedNode) {
                const currentLabel = selectedNode.data?.rawLabel || '';
                const newLabel = `${currentLabel}\n\n## Tasks\n${result}`;
                onUpdateField(selectedNoteId, { label: newLabel, rawLabel: newLabel });
              }
            } else if (action === 'expand' && selectedNoteId) {
              // Append expansion to note
              const selectedNode = nodes.find(n => n.id === selectedNoteId);
              if (selectedNode) {
                const currentLabel = selectedNode.data?.rawLabel || '';
                const newLabel = `${currentLabel}\n\n## Expanded\n${result}`;
                onUpdateField(selectedNoteId, { label: newLabel, rawLabel: newLabel });
              }
            } else {
              // For other actions, show result in alert (or could be a modal)
              alert(`AI Result:\n\n${result}`);
            }
          }}
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
            // Create a new note from AI suggestion
            const newNote = {
              label: `# ${title}\n\n${content}`,
              rawLabel: `# ${title}\n\n${content}`,
              position: { x: Math.random() * 400, y: Math.random() * 400 },
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/notes" element={
            <PrivateRoute>
              <NotesPageWrapper />
            </PrivateRoute>
          } />
          <Route path="/notes-mobile" element={
            <PrivateRoute>
              <MobileApp />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function NotesPageWrapper() {
  return (
    <ReactFlowProvider>
      <FlowEditorWrapper />
    </ReactFlowProvider>
  );
}
