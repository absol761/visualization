import { useEffect, useMemo, useState } from 'react';

export default function CommandPalette({ isOpen, onClose, commands = [] }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const visibleCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = commands.filter((command) =>
      command.label.toLowerCase().includes(normalized),
    );
    if (list.length === 0) {
      return [
        {
          id: 'empty-state',
          label: normalized ? 'No commands match that search' : 'No commands available',
          disabled: true,
        },
      ];
    }
    return list;
  }, [commands, query]);

  if (!isOpen) return null;

  return (
    <div className="command-palette__backdrop" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          className="command-palette__input"
          placeholder="Type a command or search…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="command-palette__list">
          {visibleCommands.map((command) => (
            <li key={command.id}>
              <button
                type="button"
                className="command-palette__item"
                onClick={() => {
                  if (command.disabled) return;
                  command.action?.();
                  onClose();
                }}
                disabled={command.disabled}
              >
                <div>
                  <span>{command.label}</span>
                </div>
                {command.shortcut && (
                  <kbd className="command-palette__shortcut">{command.shortcut}</kbd>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

