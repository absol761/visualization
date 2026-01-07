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
          renderList(list.slice(0, 5), searchTerm);
          return;
        }
        const matches = list
          .filter((item) => item.value.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5);
        renderList(matches, searchTerm);
      },
    };

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: `#${toolbarId}`,
        mention: mentionModule,
        history: { delay: 300, userOnly: true },
      },
      placeholder: 'Start typing…',
    });

    quillRef.current = quill;

    if (content) {
      quill.clipboard.dangerouslyPasteHTML(content);
      lastValue.current = content;
    }

    const handleChange = () => {
      const html = quill.root.innerHTML;
      lastValue.current = html;
      onChangeContent?.(html);
    };

    quill.on('text-change', handleChange);

    return () => {
      quill.off('text-change', handleChange);
      quillRef.current = null;
    };
  }, [content, onChangeContent, toolbarId]);

  useEffect(() => {
    if (!quillRef.current) return;
    const nextValue = content || '<p><br/></p>';
    if (nextValue === lastValue.current) return;
    const selection = quillRef.current.getSelection();
    quillRef.current.setContents([]);
    quillRef.current.clipboard.dangerouslyPasteHTML(nextValue);
    lastValue.current = nextValue;
    if (selection) {
      quillRef.current.setSelection(selection.index, selection.length, Quill.sources.SILENT);
    }
  }, [content]);

  useEffect(() => {
    if (!editorRef.current || !onNavigateLink) return;
    const root = editorRef.current.querySelector('.ql-editor');
    if (!root) return;
    const handleClick = (event) => {
      const mention = event.target.closest('.ql-mention');
      if (mention) {
        event.preventDefault();
        const noteId = mention.dataset.id;
        if (noteId) {
          onNavigateLink(noteId);
        }
      }
    };
    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, [onNavigateLink]);

  const handleResizeStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const { width, height } = sizeRef.current;

    const handleMove = (moveEvent) => {
      const nextWidth = Math.max(MIN_WIDTH, width + (moveEvent.clientX - startX));
      const nextHeight = Math.max(MIN_HEIGHT, height + (moveEvent.clientY - startY));
      const updated = { width: nextWidth, height: nextHeight };
      sizeRef.current = updated;
      setLocalSize(updated);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      onResize?.(sizeRef.current);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp, { once: true });
  };

  const classes = [
    'note-card',
    isCollapsed ? 'note-card--collapsed' : '',
    isSelected ? 'note-card--selected' : '',
    isSearchMatch ? 'note-card--match' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ backgroundColor: color, width: localSize.width, minHeight: localSize.height }}
      onMouseDown={() => onSelect?.(id)}
      onContextMenu={(event) => onContextMenu?.(event, id)}
    >
      <div className="note-card__header">
        <input
          className="note-card__title"
          value={localTitle}
          placeholder="Untitled Note"
          onChange={(event) => {
            setLocalTitle(event.target.value);
            onChangeTitle?.(event.target.value);
          }}
        />
        <div className="note-card__meta-row">
          <select
            className="note-card__select"
            value={folder}
            onChange={(event) => onChangeFolder?.(event.target.value)}
          >
            {availableFolders.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="note-card__select"
            value={status}
            onChange={(event) => onStatusChange?.(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="note-card__actions">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowPalette((prev) => !prev);
            }}
          >
            🎨
          </button>
          {showPalette && (
            <div className="note-card__palette" onMouseLeave={() => setShowPalette(false)}>
              {CARD_COLORS.map((swatch) => (
                <button
                  type="button"
                  key={swatch}
                  className={color === swatch ? 'is-selected' : ''}
                  style={{ backgroundColor: swatch }}
                  onClick={() => {
                    onColorChange?.(swatch);
                    setShowPalette(false);
                  }}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapse?.(!isCollapsed);
            }}
          >
            {isCollapsed ? 'Expand' : 'Minimize'}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate?.();
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="danger"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="ql-toolbar ql-snow note-card__toolbar" id={toolbarId}>
            <span className="ql-formats">
              <button className="ql-bold" />
              <button className="ql-italic" />
              <button className="ql-underline" />
              <button className="ql-strike" />
            </span>
            <span className="ql-formats">
              <select className="ql-header" defaultValue="">
                <option value="">Normal text</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
              </select>
            </span>
            <span className="ql-formats">
              <button className="ql-list" value="bullet" />
              <button className="ql-list" value="ordered" />
              <button className="ql-list" value="check" />
            </span>
            <span className="ql-formats">
              <button className="ql-blockquote" />
            </span>
            <span className="ql-formats">
              <button className="ql-link" />
              <button className="ql-image" />
            </span>
            <span className="ql-formats">
              <select className="ql-background" defaultValue="">
                {HIGHLIGHT_COLORS.map((swatch) => (
                  <option key={swatch || 'none'} value={swatch} />
                ))}
              </select>
            </span>
            <span className="ql-formats">
              <button className="ql-clean" />
            </span>
          </div>

          <div className="note-card__editor-wrapper" style={{ minHeight: localSize.height - 140 }}>
            <div ref={editorRef} className="note-card__editor ql-snow" />
          </div>
        </>
      )}

      <div className="note-card__footer">
        <span>Ctrl/Cmd + B / I / U for quick formatting</span>
        <button type="button" className="note-card__resize" onMouseDown={handleResizeStart} />
      </div>
    </div>
  );
}

