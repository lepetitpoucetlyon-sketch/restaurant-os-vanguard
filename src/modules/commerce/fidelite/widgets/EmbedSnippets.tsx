'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Copy, Check, Code2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  slug: string;
}

interface CodeBlockProps {
  label: string;
  code: string;
}

function CodeBlock({ label, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copie !');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.debug('[EmbedSnippets] Clipboard API indisponible', { error: err });
      toast.error('Echec de la copie');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition px-3 py-1.5 rounded-lg border border-border hover:bg-bg-tertiary"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copie !' : 'Copier'}
        </button>
      </div>
      <div className="relative">
        <pre className="overflow-x-auto rounded-2xl bg-bg-primary border border-border p-4 text-xs font-mono text-text-secondary leading-relaxed whitespace-pre-wrap break-all">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function EmbedSnippets({ slug }: Props) {
  const baseUrl = `https://${slug}.restaurant-os.app/reservations`;

  const iframeSnippet = `<iframe
  src="${baseUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border:none;border-radius:24px;overflow:hidden;"
  title="Reservation en ligne"
  loading="lazy"
></iframe>`;

  const jsSnippet = `<!-- Widget de reservation Restaurant OS -->
<div id="resto-widget-${slug}"></div>
<script>
(function() {
  var host = document.getElementById('resto-widget-${slug}');
  if (!host) return;
  var shadow = host.attachShadow({ mode: 'open' });
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}';
  iframe.style.cssText = 'width:100%;height:600px;border:none;border-radius:24px;';
  iframe.title = 'Reservation en ligne';
  iframe.loading = 'lazy';
  shadow.appendChild(iframe);
})();
</script>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-accent border border-border">
          <Code2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-semibold text-text-primary">Code d'integration</h3>
          <p className="text-xs text-text-muted">Collez ce code dans votre site web</p>
        </div>
      </div>

      <CodeBlock label="Option 1 — iFrame (recommande)" code={iframeSnippet} />
      <CodeBlock label="Option 2 — Shadow DOM (isolation CSS)" code={jsSnippet} />

      <div className="rounded-2xl bg-bg-secondary border border-border px-4 py-3 text-xs text-text-muted">
        <strong className="text-text-secondary">URL directe :</strong>{' '}
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-mono"
        >
          {baseUrl}
        </a>
      </div>
    </div>
  );
}
