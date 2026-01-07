import { useEffect, useMemo, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Mention } from 'quill-mention';
import 'quill-mention/dist/quill.mention.css';

const CARD_COLORS = [
  '#FFFFFF',
  '#E3F2FD',
  '#E8F5E9',
  '#FFF9C4',
  '#FCE4EC',
  '#F3E5F5',
  '#FFE0B2',
  '#F5F5F5',
];

const HIGHLIGHT_COLORS = ['#FFF59D', '#C8E6C9', '#BBDEFB', '#F8BBD0', '#FFE0B2', '#E0E0E0', ''];

const STATUS_OPTIONS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const MIN_WIDTH = 360;
const MIN_HEIGHT = 240;

if (!Quill.imports['modules/mention']) {
  Quill.register('modules/mention', Mention);
}

export default function NoteCard({
  id,
  title,
  content,
  color = '#FFFFFF',
  folder = 'All Notes',
  availableFolders = [],
  status = 'todo',
  isCollapsed = false,
  size = { width: 420, height: 320 },
  isSelected = false,
  isSearchMatch = false,
  noteSuggestions = [],
  onChangeTitle,
  onChangeContent,
  onColorChange,
  onChangeFolder,
  onStatusChange,
  onDuplicate,
  onDelete,
  onToggleCollapse,
  onResize,
  onSelect,
  onContextMenu,
  onNavigateLink,
}) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const lastValue = useRef('');
  const suggestionsRef = useRef(noteSuggestions);
  const [localTitle, setLocalTitle] = useState(title || '');
  const [showPalette, setShowPalette] = useState(false);
  const [localSize, setLocalSize] = useState({
    width: Math.max(size.width || MIN_WIDTH, MIN_WIDTH),
    height: Math.max(size.height || MIN_HEIGHT, MIN_HEIGHT),
  });
  const sizeRef = useRef(localSize);

  useEffect(() => {
    suggestionsRef.current = noteSuggestions;
  }, [noteSuggestions]);

  useEffect(() => {
    setLocalTitle(title || '');
  }, [title]);

  useEffect(() => {
    setLocalSize({
      width: Math.max(size.width || MIN_WIDTH, MIN_WIDTH),
      height: Math.max(size.height || MIN_HEIGHT, MIN_HEIGHT),
    });
  }, [size.width, size.height]);

  useEffect(() => {
    sizeRef.current = localSize;
  }, [localSize]);

  const toolbarId = useMemo(() => `toolbar-${id}`, [id]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const mentionModule = {
      allowedChars: /^[A-Za-z0-9\s-_]*$/,
      mentionDenotationChars: ['@'],
      source: (searchTerm, renderList) => {
        const list = suggestionsRef.current || [];
        if (!searchTerm) {
          renderList(list, searchTerm);
        } else {
          const matches = list.filter((item) =>
            item.value.toLowerCase().includes(searchTerm.toLowerCase()),
          );
          renderList(matches, searchTerm);
        }
      },
      renderItem: (item) => {
        return `<div>${item.value}</div>`;
      },
      onSelect: (item, insertItem) => {
        insertItem(item);
      },
    };

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: `#${toolbarId}`,
        },
        mention: mentionModule,
        keyboard: {
          bindings: {
            // ... existing bindings if any
          }
        }
      },
      placeholder: 'Type something...',
    });

    quillRef.current = quill;

    quill.root.addEventListener('click', (event) => {
      if (event.target.classList.contains('mention')) {
        const mentionId = event.target.dataset.id;
        if (mentionId && onNavigateLink) {
          onNavigateLink(mentionId);
        }
      }
    });

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        const html = quill.root.innerHTML;
        if (html !== lastValue.current) {
          lastValue.current = html;
          onChangeContent?.(html);
        }
      }
    });
  }, [toolbarId, onNavigateLink, onChangeContent]);

  useEffect(() => {
    if (quillRef.current && content !== lastValue.current) {
      const selection = quillRef.current.getSelection();
      quillRef.current.root.innerHTML = content || '';
      lastValue.current = content || '';
      if (selection) {
        quillRef.current.setSelection(selection); // Attempt to restore selection
      }
    }
  }, [content]);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = sizeRef.current.width;
    const startHeight = sizeRef.current.height;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(MIN_WIDTH, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(MIN_HEIGHT, startHeight + (moveEvent.clientY - startY));
      setLocalSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onResize?.(sizeRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`whiteboard-card ${isSelected ? 'selected' : ''}`}
      style={{
        width: isCollapsed ? 280 : localSize.width,
        height: isCollapsed ? 'auto' : localSize.height,
        backgroundColor: color,
        opacity: isSearchMatch ? 1 : isSearchMatch === false ? 0.6 : 1,
      }}
      onClick={() => onSelect?.()}
      onContextMenu={(e) => onContextMenu?.(e)}
    >
      <div className="whiteboard-card-header">
        <input
          className="whiteboard-card-title"
          value={localTitle}
          placeholder="Untitled Note"
          onChange={(event) => {
            setLocalTitle(event.target.value);
            onChangeTitle?.(event.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
             type="button"
             style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.4 }}
             onClick={(e) => {
                e.stopPropagation();
                setShowPalette(!showPalette);
             }}
          >
             🎨
          </button>
          {showPalette && (
             <div 
               style={{ 
                 position: 'absolute', top: 40, right: 10, background: 'white', 
                 padding: 8, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                 display: 'grid', gridTemplateColumns: 'repeat(4, 24px)', gap: 4, zIndex: 100 
               }}
               onMouseLeave={() => setShowPalette(false)}
             >
                {CARD_COLORS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => { onColorChange(c); setShowPalette(false); }}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '1px solid #ddd', cursor: 'pointer' }} 
                  />
                ))}
             </div>
          )}
          <button
             type="button"
             style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.4 }}
             onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
             }}
          >
             ✕
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="whiteboard-card-body">
          <div className="ql-toolbar ql-snow" id={toolbarId} style={{ border: 'none', padding: '0 0 8px', borderBottom: '1px solid #f0f0f0' }}>
            <span className="ql-formats">
              <button className="ql-bold" />
              <button className="ql-italic" />
              <button className="ql-underline" />
            </span>
            <span className="ql-formats">
              <button className="ql-list" value="bullet" />
              <button className="ql-list" value="ordered" />
              <button className="ql-list" value="check" />
            </span>
            <span className="ql-formats">
              <select className="ql-header" defaultValue="">
                <option value="">Normal</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
              </select>
            </span>
          </div>
          <div className="whiteboard-editor-wrapper">
            <div ref={editorRef} style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }} />
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div 
          className="note-card__resize" 
          onMouseDown={handleResizeStart} 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0, 
            width: 20, 
            height: 20, 
            cursor: 'se-resize', 
            background: 'linear-gradient(135deg, transparent 50%, #ddd 50%)',
            borderBottomRightRadius: 12
          }} 
        />
      )}
    </div>
  );
}
