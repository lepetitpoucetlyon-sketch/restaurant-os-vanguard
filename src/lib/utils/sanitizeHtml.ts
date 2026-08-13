const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'hr',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'style',
  'width', 'height', 'target', 'rel',
]);

const DANGEROUS_PROTOCOLS = /^\s*(javascript|data|vbscript)\s*:/i;

function cleanAttributes(el: Element): void {
  for (const attr of Array.from(el.attributes)) {
    if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
      el.removeAttribute(attr.name);
      continue;
    }
    if ((attr.name === 'href' || attr.name === 'src') && DANGEROUS_PROTOCOLS.test(attr.value)) {
      el.removeAttribute(attr.name);
    }
  }
  if (el.tagName.toLowerCase() === 'a') {
    el.setAttribute('rel', 'noopener noreferrer');
    el.setAttribute('target', '_blank');
  }
}

export function sanitizeHtml(dirty: string): string {
  if (typeof document === 'undefined') return '';
  const doc = new DOMParser().parseFromString(dirty, 'text/html');
  const walk = (parent: Element): void => {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'iframe' || tag === 'object'
          || tag === 'embed' || tag === 'form' || tag === 'input'
          || tag === 'textarea' || tag === 'select' || tag === 'button') {
          el.remove();
          continue;
        }
        if (!ALLOWED_TAGS.has(tag)) {
          while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
          el.remove();
          continue;
        }
        cleanAttributes(el);
        if (el.parentNode) walk(el);
      }
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
