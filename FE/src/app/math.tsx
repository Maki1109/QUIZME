/**
 * Safe rendering of maths ($…$ via KaTeX) and a tiny Markdown subset. Kept in its own module so
 * KaTeX is only downloaded by pages that show formulas.
 */

import { ReactNode, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function renderTex(tex: string, display: boolean) {
  // trust:false + strict: KaTeX escapes everything; \href, \url and HTML extensions are disabled.
  return katex.renderToString(tex, { throwOnError: false, displayMode: display, trust: false, strict: 'ignore', maxSize: 20, maxExpand: 200, output: 'html' });
}

/** Text with inline $…$ / $$…$$ maths. Everything outside maths is rendered as plain text. */
export function MathText({ text, className = '' }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { tex?: string; display?: boolean; text?: string }[] = [];
    const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      out.push({ tex: m[1] ?? m[2], display: Boolean(m[1]) });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  }, [text]);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.tex !== undefined ? <span key={i} dangerouslySetInnerHTML={{ __html: renderTex(p.tex, Boolean(p.display)) }} /> : <span key={i}>{p.text}</span>
      )}
    </span>
  );
}

/** Tiny, safe Markdown subset for tutor replies: paragraphs, lists, **bold**, *italic*, `code` and maths. */
export function RichText({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.replace(/\r/g, '').split('\n');
    const out: { type: 'p' | 'ul' | 'ol' | 'h'; items: string[] }[] = [];
    for (const raw of lines) {
      const line = raw.trimEnd();
      const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
      const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      const heading = /^#{1,4}\s+(.*)$/.exec(line);
      const prev = out[out.length - 1];
      if (bullet) {
        if (prev && prev.type === 'ul') prev.items.push(bullet[1]);
        else out.push({ type: 'ul', items: [bullet[1]] });
      } else if (numbered) {
        if (prev && prev.type === 'ol') prev.items.push(numbered[1]);
        else out.push({ type: 'ol', items: [numbered[1]] });
      } else if (heading) out.push({ type: 'h', items: [heading[1]] });
      else if (!line.trim()) out.push({ type: 'p', items: [] });
      else if (prev && prev.type === 'p' && prev.items.length) prev.items.push(line);
      else out.push({ type: 'p', items: [line] });
    }
    return out.filter((b) => b.items.length);
  }, [text]);

  const inline = (s: string, key: number) => {
    const nodes: ReactNode[] = [];
    const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) nodes.push(<MathText key={`${key}-${i++}`} text={s.slice(last, m.index)} />);
      if (m[1]) nodes.push(<strong key={`${key}-${i++}`}><MathText text={m[1]} /></strong>);
      else if (m[2]) nodes.push(<em key={`${key}-${i++}`} className="not-italic font-semibold"><MathText text={m[2]} /></em>);
      else nodes.push(<code key={`${key}-${i++}`} className="rounded bg-paper-2 px-1 text-[0.9em]">{m[3]}</code>);
      last = m.index + m[0].length;
    }
    if (last < s.length) nodes.push(<MathText key={`${key}-${i++}`} text={s.slice(last)} />);
    return nodes;
  };

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === 'ul') return <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{inline(it, j)}</li>)}</ul>;
        if (b.type === 'ol') return <ol key={i} className="list-decimal space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{inline(it, j)}</li>)}</ol>;
        if (b.type === 'h') return <p key={i} className="font-extrabold">{inline(b.items[0], 0)}</p>;
        return <p key={i}>{b.items.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l, j)}</span>)}</p>;
      })}
    </div>
  );
}
