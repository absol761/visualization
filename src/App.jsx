import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './ProTheme.css';
import './App.css';
import NoteCard from './NoteCard';
import Landing from './Landing';
import Login from './Login';
import Signup from './Signup';
import PrivateRoute from './PrivateRoute';
import MobileApp from './MobileApp';
import { AuthProvider } from './CustomAuthContext';
import CommandPalette from './CommandPalette';

const STORAGE_KEYS = {
  notes: 'student-notes-v1',
  edges: 'student-edges-v1',
  folders: 'student-folders-v1',
};

const STATUS_COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const NOTE_COLORS = [
  '#FFFFFF',
  '#E3F2FD',
  '#E8F5E9',
  '#FFF9C4',
  '#FCE4EC',
  '#F3E5F5',
  '#FFE0B2',
  '#F5F5F5',
];

const DEFAULT_FOLDERS = ['All Notes', 'Biology', 'History', 'Math'];

const NOTE_TEMPLATES = [
  {
    id: 'cornell',
    name: 'Cornell Notes',
    description: 'Cue • Notes • Summary',
    content: `
      <h1>Topic</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <table class="cornell-table">
        <tr>
          <td style="width:30%">
            <strong>Cues & Questions</strong>
            <p>- Key ideas</p>
            <p>- Vocabulary</p>
            <p>- Essential questions</p>
          </td>
          <td>
            <strong>Notes</strong>
            <p>- Main concepts</p>
            <p>- Supporting details</p>
            <p>- Diagrams/examples</p>
          </td>
        </tr>
      </table>
      <h3>Summary</h3>
      <p>Summarize the big idea in 2-3 sentences.</p>
    `,
  },
  {
    id: 'study-guide',
    name: 'Study Guide',
    description: 'Terms • Definitions • Examples',
    content: `
      <h1>Study Guide</h1>
      <h2>Key Terms</h2>
      <ul>
        <li><strong>Term 1</strong> - Definition + quick example</li>
        <li><strong>Term 2</strong> - Definition + quick example</li>
        <li><strong>Term 3</strong> - Definition + quick example</li>
      </ul>
      <h2>Concepts to Know</h2>
      <ul>
        <li>Main idea #1</li>
        <li>Main idea #2</li>
        <li>Main idea #3</li>
      </ul>
      <h2>Practice Questions</h2>
      <ol>
        <li>Question 1</li>
        <li>Question 2</li>
        <li>Question 3</li>
      </ol>
    `,
  },
  {
    id: 'class-notes',
    name: 'Class Notes',
    description: 'Date • Topic • Key points',
    content: `
      <h1>Class Notes</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Topic:</strong> </p>
      <h2>Key Points</h2>
      <ul>
        <li>Point 1</li>
        <li>Point 2</li>
        <li>Point 3</li>
      </ul>
      <h2>Examples</h2>
      <p></p>
      <h2>Questions</h2>
      <ul>
        <li>Still wondering about...</li>
      </ul>
    `,
  },
  {
    id: 'blank',
    name: 'Blank Note',
    description: 'Start fresh with a clean page',
    content: '<p><br/></p>',
  },
];

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const sanitizeContent = (value = '') => {
  if (!value || !value.trim()) {
    return '<p><br/></p>';
  }
  return value;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createNoteData = (overrides = {}) => {
  const content = sanitizeContent(overrides.content ?? '<p><br/></p>');
  const size = overrides.size
    ? { width: overrides.size.width || 420, height: overrides.size.height || 320 }
    : { width: 420, height: 320 };
  const position = overrides.position ?? { x: 120, y: 120 };

  return {
    id: overrides.id || generateId(),
    title: overrides.title ?? 'Untitled Note',
    content,
    plainText: stripHtml(content),
    folder: overrides.folder ?? 'All Notes',
    status: overrides.status ?? 'todo',
    color: overrides.color ?? '#FFFFFF',
    isCollapsed: overrides.isCollapsed ?? false,
    size,
    position,
    created: overrides.created ?? Date.now(),
    modified: overrides.modified ?? Date.now(),
  };
};

const loadNotesFromStorage = () => {
  if (typeof window === 'undefined') {
    return [createNoteData()];
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || '[]');
    if (!Array.isArray(stored) || stored.length === 0) {
      return [createNoteData()];
    }
    return stored.map((note) => createNoteData(note));
  } catch (error) {
    console.warn('Unable to load notes from storage', error);
    return [createNoteData()];
  }
};

const loadEdgesFromStorage = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.edges) || '[]');
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored;
  } catch {
    return [];
  }
};

const loadFoldersFromStorage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_FOLDERS;
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.folders) || '[]');
    if (!Array.isArray(stored) || stored.length === 0) {
      return DEFAULT_FOLDERS;
    }
    return Array.from(new Set(['All Notes', ...stored]));
  } catch {
    return DEFAULT_FOLDERS;
  }
};

const INITIAL_NOTES = loadNotesFromStorage();
const INITIAL_EDGES = loadEdgesFromStorage();
const INITIAL_FOLDERS = loadFoldersFromStorage();

function TemplatesModal({ isOpen, templates, onUseTemplate, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="templates-modal__backdrop" onClick={onClose}>
      <div className="templates-modal" onClick={(event) => event.stopPropagation()}>
        <header className="templates-modal__header">
          <div>
            <h3>Templates</h3>
            <p>Start faster with a ready-made structure</p>
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="templates-modal__grid">
          {templates.map((template) => (
            <button
              type="button"
              key={template.id}
              className="templates-modal__card"
              onClick={() => onUseTemplate(template)}
            >
              <h4>{template.name}</h4>
              <p>{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListView({ notes, onOpenNote, onDuplicate }) {
  if (!notes.length) {
    return <div className="list-view__empty">No notes yet. Switch back to canvas to create one.</div>;
  }

  return (
    <div className="list-view">
      {notes.map((note) => (
        <div className="list-view__card" key={note.id}>
          <div>
            <h4>{note.title || 'Untitled Note'}</h4>
            <p className="list-view__meta">
              {note.folder} • Updated {new Date(note.modified).toLocaleString()}
            </p>
            <p className="list-view__snippet">
              {note.plainText ? `${note.plainText.substring(0, 140)}${note.plainText.length > 140 ? '…' : ''}` : 'No content yet.'}
            </p>
          </div>
          <div className="list-view__actions">
            <button type="button" onClick={() => onOpenNote(note.id)}>
              Open
            </button>
            <button type="button" onClick={() => onDuplicate(note.id)}>
              Duplicate
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardView({ columns, onOpenNote, onStatusChange }) {
  return (
    <div className="board-view">
      {columns.map((column) => (
        <div className="board-view__column" key={column.id}>
          <header className="board-view__header">
            <span>{column.label}</span>
            <span className="board-view__count">{column.notes.length}</span>
          </header>
          <div className="board-view__list">
            {column.notes.map((note) => (
              <div className="board-view__card" key={note.id}>
                <h4>{note.title || 'Untitled Note'}</h4>
                <p className="board-view__snippet">
                  {note.plainText ? `${note.plainText.substring(0, 120)}${note.plainText.length > 120 ? '…' : ''}` : 'No content yet.'}
                </p>
                <div className="board-view__card-footer">
                  <select
                    value={note.status}
                    onChange={(event) => onStatusChange(note.id, event.target.value)}
                  >
                    {STATUS_COLUMNS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => onOpenNote(note.id)}>
                    Open
                  </button>
                </div>
              </div>
            ))}
            {!column.notes.length && (
              <div className="board-view__empty">No notes in this column yet.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentWorkspace() {
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [activeFolder, setActiveFolder] = useState('All Notes');
  const [viewMode, setViewMode] = useState('canvas');
  const [searchTerm, setSearchTerm] = useState('');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(() => INITIAL_NOTES[0]?.id || null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [inspiration, setInspiration] = useState({
    content: 'Loading inspiration…',
    author: '',
  });
  const searchInputRef = useRef(null);

  const todayKey = useMemo(() => {
    const today = new Date();
    return `daily-note-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`;
  }, []);

  const [dailyNote, setDailyNote] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(todayKey) || '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(todayKey, dailyNote);
  }, [todayKey, dailyNote]);

  const refreshInspiration = useCallback(async () => {
    try {
      const response = await fetch('https://api.quotable.io/random');
      const data = await response.json();
      setInspiration({ content: data.content, author: data.author });
    } catch (error) {
      console.error('Unable to fetch inspiration quote', error);
    }
  }, []);

  useEffect(() => {
    refreshInspiration();
  }, [refreshInspiration]);

  useEffect(() => {
    const handleCommandShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleCommandShortcut);
    return () => window.removeEventListener('keydown', handleCommandShortcut);
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
        localStorage.setItem(STORAGE_KEYS.edges, JSON.stringify(edges));
        localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(folders));
      }
      setIsSaving(false);
    }, 2000);
    return () => clearTimeout(handle);
  }, [notes, edges, folders]);

  const folderOptions = useMemo(() => {
    const set = new Set(['All Notes', ...folders]);
    notes.forEach((note) => set.add(note.folder));
    return Array.from(set);
  }, [folders, notes]);

  const folderCounts = useMemo(() => {
    const counts = { 'All Notes': notes.length };
    notes.forEach((note) => {
      counts[note.folder] = (counts[note.folder] || 0) + 1;
    });
    return counts;
  }, [notes]);

  const doesNoteMatchSearch = useCallback(
    (note) => {
      if (!normalizedSearch) return false;
      return (
        (note.title || '').toLowerCase().includes(normalizedSearch) ||
        (note.plainText || '').toLowerCase().includes(normalizedSearch)
      );
    },
    [normalizedSearch],
  );

  const filteredNotes = useMemo(() => {
    if (activeFolder === 'All Notes') return notes;
    return notes.filter((note) => note.folder === activeFolder);
  }, [notes, activeFolder]);

  const searchMatches = useMemo(() => {
    if (!normalizedSearch) return [];
    return notes
      .filter(doesNoteMatchSearch)
      .map((note) => ({
        id: note.id,
        title: note.title || 'Untitled Note',
        snippet: note.plainText
          ? `${note.plainText.substring(0, 80)}${note.plainText.length > 80 ? '…' : ''}`
          : 'No content yet.',
      }));
  }, [notes, normalizedSearch, doesNoteMatchSearch]);

  const listViewNotes = useMemo(
    () => [...filteredNotes].sort((a, b) => b.modified - a.modified),
    [filteredNotes],
  );

  const boardColumns = useMemo(
    () =>
      STATUS_COLUMNS.map((column) => ({
        ...column,
        notes: filteredNotes.filter((note) => note.status === column.id),
      })),
    [filteredNotes],
  );

  const noteSuggestions = useMemo(
    () => notes.map((note) => ({ id: note.id, value: note.title || 'Untitled Note' })),
    [notes],
  );

  const flowNodes = useMemo(
    () =>
      notes.map((note) => ({
        id: note.id,
        type: 'noteCard',
        position: note.position,
        data: { note },
        hidden: activeFolder !== 'All Notes' && note.folder !== activeFolder,
        selected: selectedNoteId === note.id,
      })),
    [notes, activeFolder, selectedNoteId],
  );

  const backlinksMap = useMemo(() => {
    const map = {};
    notes.forEach((note) => {
      const regex = /data-id="([^"]+)"/g;
      let match;
      while ((match = regex.exec(note.content)) !== null) {
        const targetId = match[1];
        if (!map[targetId]) {
          map[targetId] = [];
        }
        map[targetId].push({
          id: note.id,
          title: note.title || 'Untitled Note',
          snippet: note.plainText
            ? `${note.plainText.substring(0, 70)}${note.plainText.length > 70 ? '…' : ''}`
            : '',
        });
      }
    });
    return map;
  }, [notes]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  );

  const selectedBacklinks = selectedNoteId ? backlinksMap[selectedNoteId] || [] : [];

  const connectedNotes = useMemo(() => {
    if (!selectedNoteId) return [];
    const connectedIds = new Set();
    edges.forEach((edge) => {
      if (edge.source === selectedNoteId) connectedIds.add(edge.target);
      if (edge.target === selectedNoteId) connectedIds.add(edge.source);
    });
    return notes.filter((note) => connectedIds.has(note.id));
  }, [edges, notes, selectedNoteId]);

  const handleNoteChange = useCallback(
    (noteId, updates) => {
      setNotes((current) =>
        current.map((note) => {
          if (note.id !== noteId) return note;
          const next = { ...note, ...updates };
          if (updates.content !== undefined) {
            next.content = sanitizeContent(updates.content);
            next.plainText = stripHtml(next.content);
          }
          if (updates.size) {
            next.size = { ...note.size, ...updates.size };
          }
          if (updates.position) {
            next.position = updates.position;
          }
          next.modified = Date.now();
          return next;
        }),
      );

      if (updates.folder && updates.folder !== 'All Notes' && !folderOptions.includes(updates.folder)) {
        setFolders((prev) => (prev.includes(updates.folder) ? prev : [...prev, updates.folder]));
      }
      setIsSaving(true);
    },
    [folderOptions],
  );

  const handleCreateNote = useCallback(
    (overrides = {}) => {
      const basePosition =
        overrides.position || {
          x: 120 + Math.random() * 200,
          y: 120 + Math.random() * 160,
        };
      const newNote = createNoteData({
        ...overrides,
        folder: overrides.folder || (activeFolder === 'All Notes' ? 'All Notes' : activeFolder),
        position: basePosition,
      });
      setNotes((current) => [...current, newNote]);
      setSelectedNoteId(newNote.id);
      if (newNote.folder !== 'All Notes' && !folderOptions.includes(newNote.folder)) {
        setFolders((prev) => (prev.includes(newNote.folder) ? prev : [...prev, newNote.folder]));
      }
      setViewMode('canvas');
      setIsSaving(true);
    },
    [activeFolder, folderOptions],
  );

  const focusSearchInput = useCallback(() => {
    setViewMode('canvas');
    requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    });
  }, []);

  const appendDailyNoteToCanvas = useCallback(() => {
    if (!dailyNote.trim()) return;
    handleCreateNote({
      title: `Daily Note - ${new Date().toLocaleDateString()}`,
      content: `<p>${dailyNote}</p>`,
    });
  }, [dailyNote, handleCreateNote]);

  const handleDuplicateNote = useCallback(
    (noteId) => {
      const source = notes.find((note) => note.id === noteId);
      if (!source) return;
      const duplicate = createNoteData({
        ...source,
        id: undefined,
        title: `${source.title || 'Untitled Note'} Copy`,
        position: { x: source.position.x + 40, y: source.position.y + 40 },
      });
      setNotes((current) => [...current, duplicate]);
      setSelectedNoteId(duplicate.id);
      setIsSaving(true);
    },
    [notes],
  );

  const handleDeleteNote = useCallback(
    (noteId) => {
      setNotes((current) => {
        const next = current.filter((note) => note.id !== noteId);
        if (noteId === selectedNoteId) {
          setSelectedNoteId(next[0]?.id || null);
        }
        return next;
      });
      setEdges((current) => current.filter((edge) => edge.source !== noteId && edge.target !== noteId));
      setIsSaving(true);
    },
    [selectedNoteId],
  );

  const handleNodeDragStop = useCallback(
    (_, node) => {
      handleNoteChange(node.id, { position: node.position });
    },
    [handleNoteChange],
  );

  const handleConnect = useCallback((connection) => {
    setEdges((current) => {
      const exists = current.some(
        (edge) => edge.source === connection.source && edge.target === connection.target,
      );
      if (exists) return current;
      const newEdge = addEdge(
        {
          ...connection,
          id: `edge-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        },
        current,
      );
      return newEdge;
    });
    setIsSaving(true);
  }, []);

  const handleEdgesDelete = useCallback((deletedEdges) => {
    setEdges((current) => current.filter((edge) => !deletedEdges.some((del) => del.id === edge.id)));
    setIsSaving(true);
  }, []);

  const handleNodesDelete = useCallback(
    (deletedNodes) => {
      const ids = new Set(deletedNodes.map((node) => node.id));
      setNotes((current) => {
        const next = current.filter((note) => !ids.has(note.id));
        if (!next.some((note) => note.id === selectedNoteId)) {
          setSelectedNoteId(next[0]?.id || null);
        }
        return next;
      });
      setEdges((current) => current.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)));
      setIsSaving(true);
    },
    [selectedNoteId],
  );

  const handlePaneDoubleClick = useCallback(
    (event) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      handleCreateNote({ position });
    },
    [handleCreateNote, screenToFlowPosition],
  );

  const focusNote = useCallback(
    (noteId) => {
      const note = notes.find((item) => item.id === noteId);
      if (!note) return;
      setViewMode('canvas');
      setSelectedNoteId(note.id);
      requestAnimationFrame(() => {
        setCenter(
          note.position.x + note.size.width / 2,
          note.position.y + note.size.height / 2,
          { zoom: 1.1, duration: 400 },
        );
      });
    },
    [notes, setCenter],
  );

  const handleNavigateLink = useCallback(
    (noteId) => {
      focusNote(noteId);
    },
    [focusNote],
  );

  const openContextMenu = useCallback((event, noteId) => {
    event.preventDefault();
    setContextMenu({
      noteId,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const handleExportNote = useCallback(
    (noteId) => {
      const note = notes.find((item) => item.id === noteId);
      if (!note) return;
      const printable = window.open('', '_blank');
      printable.document.write(`
        <html>
          <head>
            <title>${note.title || 'Note export'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { margin-bottom: 12px; }
            </style>
          </head>
          <body>
            <h1>${note.title || 'Untitled Note'}</h1>
            ${note.content}
          </body>
        </html>
      `);
      printable.document.close();
      printable.focus();
      printable.print();
    },
    [notes],
  );

  const handleAddFolder = useCallback(() => {
    const name = window.prompt('New folder name');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (folders.includes(trimmed)) return;
    setFolders((current) => [...current, trimmed]);
    setIsSaving(true);
  }, [folders]);

  const handleUseTemplate = useCallback(
    (template) => {
      handleCreateNote({
        title: template.name,
        content: template.content,
        folder: activeFolder === 'All Notes' ? 'All Notes' : activeFolder,
      });
      setShowTemplates(false);
    },
    [activeFolder, handleCreateNote],
  );

  const nodeTypes = useMemo(
    () => ({
      noteCard: ({ id, data }) => {
        const note = data.note;
        return (
          <NoteCard
            id={id}
            title={note.title}
            content={note.content}
            color={note.color}
            folder={note.folder}
            status={note.status}
            isCollapsed={note.isCollapsed}
            size={note.size}
            availableFolders={folderOptions}
            noteSuggestions={noteSuggestions}
            isSelected={selectedNoteId === id}
            isSearchMatch={!!normalizedSearch && doesNoteMatchSearch(note)}
            onChangeTitle={(value) => handleNoteChange(id, { title: value })}
            onChangeContent={(value) => handleNoteChange(id, { content: value })}
            onColorChange={(value) => handleNoteChange(id, { color: value })}
            onChangeFolder={(value) => handleNoteChange(id, { folder: value })}
            onStatusChange={(value) => handleNoteChange(id, { status: value })}
            onToggleCollapse={(value) => handleNoteChange(id, { isCollapsed: value })}
            onResize={(value) => handleNoteChange(id, { size: value })}
            onDuplicate={() => handleDuplicateNote(id)}
            onDelete={() => handleDeleteNote(id)}
            onSelect={() => setSelectedNoteId(id)}
            onContextMenu={(event) => openContextMenu(event, id)}
            onNavigateLink={handleNavigateLink}
          />
        );
      },
    }),
    [
      folderOptions,
      noteSuggestions,
      selectedNoteId,
      normalizedSearch,
      doesNoteMatchSearch,
      handleNoteChange,
      handleDuplicateNote,
      handleDeleteNote,
      openContextMenu,
      handleNavigateLink,
    ],
  );

  const commandPaletteCommands = useMemo(
    () => [
      {
        id: 'cmd-new-note',
        label: 'Create note at canvas center',
        shortcut: 'N',
        action: () => handleCreateNote(),
      },
      {
        id: 'cmd-canvas-view',
        label: viewMode === 'canvas' ? 'Canvas view (active)' : 'Switch to canvas view',
        shortcut: '1',
        action: () => setViewMode('canvas'),
      },
      {
        id: 'cmd-list-view',
        label: viewMode === 'list' ? 'List view (active)' : 'Switch to list view',
        shortcut: '2',
        action: () => setViewMode('list'),
      },
      {
        id: 'cmd-board-view',
        label: viewMode === 'board' ? 'Board view (active)' : 'Switch to board view',
        shortcut: '3',
        action: () => setViewMode('board'),
      },
      {
        id: 'cmd-toggle-snap',
        label: snapToGrid ? 'Disable snap to grid' : 'Enable snap to grid',
        shortcut: 'G',
        action: () => setSnapToGrid((prev) => !prev),
      },
      {
        id: 'cmd-focus-search',
        label: 'Focus global search',
        shortcut: '/',
        action: focusSearchInput,
      },
      {
        id: 'cmd-open-templates',
        label: 'Open templates gallery',
        shortcut: 'T',
        action: () => setShowTemplates(true),
      },
      {
        id: 'cmd-daily-note',
        label: 'Send today’s note to canvas',
        shortcut: 'D',
        disabled: !dailyNote.trim(),
        action: appendDailyNoteToCanvas,
      },
      {
        id: 'cmd-refresh-inspiration',
        label: 'Refresh inspiration quote',
        shortcut: 'R',
        action: refreshInspiration,
      },
      {
        id: 'cmd-study-template',
        label: 'Spawn Study Guide template',
        shortcut: 'S',
        action: () =>
          handleCreateNote({
            title: NOTE_TEMPLATES[1].name,
            content: NOTE_TEMPLATES[1].content,
          }),
      },
    ],
    [
      appendDailyNoteToCanvas,
      dailyNote,
      focusSearchInput,
      handleCreateNote,
      refreshInspiration,
      snapToGrid,
      viewMode,
    ],
  );

  return (
    <div className="pro-layout">
      {/* Floating Sidebar Dock */}
      <nav className={`floating-sidebar ${!isCommandPaletteOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', borderRadius: 6 }}></div>
          Infinite Notes
        </div>

        <div className="sidebar-nav">
          <button className="nav-item active">
            <span>⊞</span> All Notes
          </button>
          <button className="nav-item">
            <span>☆</span> Favorites
          </button>
          <button className="nav-item" onClick={() => setShowTemplates(true)}>
            <span>⊕</span> Templates
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }}></div>

        <div className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '0 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            FOLDERS
          </div>
          {folderOptions.map((folder) => (
            <button
              key={folder}
              className={`nav-item ${activeFolder === folder ? 'active' : ''}`}
              onClick={() => setActiveFolder(folder)}
            >
              <span style={{ opacity: 0.6 }}>📁</span>
              {folder}
              <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 12 }}>{folderCounts[folder] || 0}</span>
            </button>
          ))}
          <button className="nav-item" style={{ color: 'var(--accent-blue)' }} onClick={handleAddFolder}>
            + New Folder
          </button>
        </div>
      </nav>

      {/* Top Right Status & Search */}
      <div className="status-bar">
        <div className="status-pill" style={{ cursor: 'text' }} onClick={focusSearchInput}>
          <span style={{ opacity: 0.5 }}>🔍</span>
          <input 
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: 120, fontSize: 13 }}
          />
          <kbd style={{ opacity: 0.4, fontSize: 10 }}>/</kbd>
        </div>
        <div className="status-pill">
          {isSaving ? 'Saving...' : 'Saved'}
        </div>
        <button className="status-pill" onClick={() => setCommandPaletteOpen(true)} style={{ cursor: 'pointer' }}>
          ⌘K
        </button>
      </div>

      {/* Main Canvas Area */}
      {viewMode === 'canvas' ? (
        <div className="full-canvas">
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            onNodesChange={(changes) => {
               // Standard ReactFlow change handler
            }}
            onEdgesChange={(changes) => {
               // Standard ReactFlow change handler
            }}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.1}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            onPaneClick={() => setSelectedNoteId(null)}
            onPaneContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({
                x: event.clientX,
                y: event.clientY,
                type: 'canvas',
              });
            }}
            onPaneDoubleClick={handlePaneDoubleClick}
            onNodeDragStop={handleNodeDragStop}
            onNodesDelete={handleNodesDelete}
            onEdgesDelete={handleEdgesDelete}
            panOnScroll
            selectionOnDrag
            panOnDrag={[1, 2]}
            selectionMode="partial"
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
          >
            <Background color="#D1D5DB" gap={24} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                return node.data.note.color || '#fff';
              }}
              maskColor="rgba(240, 240, 240, 0.6)"
            />
          </ReactFlow>
        </div>
      ) : (
        <div className="workspace" style={{ padding: '80px 40px 40px', maxWidth: 1200, margin: '0 auto', overflowY: 'auto' }}>
           {viewMode === 'list' && <ListView notes={listViewNotes} onOpenNote={focusNote} onDuplicate={handleDuplicateNote} />}
           {viewMode === 'board' && (
              <BoardView
                columns={boardColumns}
                onOpenNote={focusNote}
                onStatusChange={(id, status) => handleNoteChange(id, { status })}
              />
            )}
        </div>
      )}

      {/* Floating Bottom Dock */}
      <div className="floating-dock">
        <button className="dock-btn primary" onClick={() => handleCreateNote()} title="New Note">
          +
        </button>
        <div style={{ width: 1, background: 'var(--border-subtle)', margin: '0 4px' }}></div>
        <button className={`dock-btn ${viewMode === 'canvas' ? 'active' : ''}`} onClick={() => setViewMode('canvas')} title="Canvas View">
          ∷
        </button>
        <button className={`dock-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List View">
          ≣
        </button>
        <button className={`dock-btn ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')} title="Board View">
          ☷
        </button>
      </div>

      {/* Context Menu & Modals */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'absolute',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'canvas' ? (
            <button onClick={() => {
              handleCreateNote({ position: { x: contextMenu.x, y: contextMenu.y } });
              setContextMenu(null);
            }}>
              Create Note Here
            </button>
          ) : (
            <>
              <button onClick={() => {
                handleDuplicateNote(contextMenu.noteId);
                setContextMenu(null);
              }}>Duplicate</button>
              <button onClick={() => {
                handleDeleteNote(contextMenu.noteId);
                setContextMenu(null);
              }} className="danger">Delete</button>
            </>
          )}
        </div>
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commandPaletteCommands}
      />

      <TemplatesModal
        isOpen={showTemplates}
        templates={NOTE_TEMPLATES}
        onUseTemplate={handleUseTemplate}
        onClose={() => setShowTemplates(false)}
      />
    </div>
  );
}

function WorkspaceRoute() {
  return (
    <ReactFlowProvider>
      <StudentWorkspace />
    </ReactFlowProvider>
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
          <Route
            path="/notes"
            element={
              <PrivateRoute>
                <WorkspaceRoute />
              </PrivateRoute>
            }
          />
          <Route
            path="/notes-mobile"
            element={
              <PrivateRoute>
                <MobileApp />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
