const EMPTY_BLOCK = '<p><br/></p>';

export const stripHtml = (input = '') =>
  input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export const escapeHtml = (text = '') =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const plainTextToHtml = (text = '') => {
  if (!text || !text.trim()) {
    return EMPTY_BLOCK;
  }

  return text
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, '<br/>');
      return `<p>${withBreaks}</p>`;
    })
    .join('');
};

const buildList = (items, type, { isTaskList = false } = {}) => {
  if (!items.length) return '';
  const listClass = isTaskList ? ' class="ql-task-list ql-indent-0"' : ' class="ql-indent-0"';
  return `<${type}${listClass}>${items.join('')}</${type}>`;
};

const flushLists = (buffers, keep) => {
  let html = '';
  const types = ['tasks', 'bullets', 'ordered'];
  types.forEach((type) => {
    if (type === keep) return;
    if (type === 'tasks' && buffers.tasks.length) {
      html += buildList(buffers.tasks, 'ul', { isTaskList: true });
      buffers.tasks = [];
    }
    if (type === 'bullets' && buffers.bullets.length) {
      html += buildList(buffers.bullets, 'ul');
      buffers.bullets = [];
    }
    if (type === 'ordered' && buffers.ordered.length) {
      html += buildList(buffers.ordered, 'ol');
      buffers.ordered = [];
    }
  });
  return html;
};

const flushAllLists = (buffers) => flushLists(buffers);

const flushBlockquote = (buffer) => {
  if (!buffer.length) return '';
  const html = `<blockquote>${plainTextToHtml(buffer.join('\n'))}</blockquote>`;
  buffer.length = 0;
  return html;
};

const convertLegacyMarkdown = (value = '') => {
  const lines = value.split(/\r?\n/);
  const buffers = {
    tasks: [],
    bullets: [],
    ordered: [],
  };
  const blockquoteBuffer = [];
  let html = '';

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      html += flushBlockquote(blockquoteBuffer);
      html += flushAllLists(buffers);
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      html += flushBlockquote(blockquoteBuffer);
      html += flushAllLists(buffers);
      const level = headingMatch[1].length;
      html += `<h${level}>${escapeHtml(headingMatch[2].trim())}</h${level}>`;
      return;
    }

    const dividerMatch = line.match(/^(-{3,}|\*{3,}|_{3,})$/);
    if (dividerMatch) {
      html += flushBlockquote(blockquoteBuffer);
      html += flushAllLists(buffers);
      html += '<hr/>';
      return;
    }

    const checkboxMatch = line.match(/^[-*]\s*\[( |x)\]\s+(.+)$/i);
    if (checkboxMatch) {
      html += flushBlockquote(blockquoteBuffer);
      html += flushLists(buffers, 'tasks');
      const isChecked = checkboxMatch[1].toLowerCase() === 'x';
      buffers.tasks.push(
        `<li data-list="${isChecked ? 'checked' : 'unchecked'}">${escapeHtml(checkboxMatch[2].trim())}</li>`
      );
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      html += flushBlockquote(blockquoteBuffer);
      html += flushLists(buffers, 'bullets');
      buffers.bullets.push(`<li>${escapeHtml(bulletMatch[1].trim())}</li>`);
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      html += flushBlockquote(blockquoteBuffer);
      html += flushLists(buffers, 'ordered');
      buffers.ordered.push(`<li>${escapeHtml(orderedMatch[1].trim())}</li>`);
      return;
    }

    if (line.startsWith('>')) {
      const withoutMarker = line.replace(/^>\s?/, '');
      blockquoteBuffer.push(withoutMarker);
      return;
    }

    html += flushBlockquote(blockquoteBuffer);
    html += flushAllLists(buffers);
    html += plainTextToHtml(line);
  });

  html += flushBlockquote(blockquoteBuffer);
  html += flushAllLists(buffers);

  return html || EMPTY_BLOCK;
};

export const ensureHtmlContent = (value = '') => {
  if (!value || !value.trim()) {
    return EMPTY_BLOCK;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    return trimmed;
  }

  return convertLegacyMarkdown(value);
};

