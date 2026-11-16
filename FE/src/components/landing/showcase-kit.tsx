/**
 * Small presentation pieces for real product screenshots: a browser window, a phone,
 * and hand-written margin notes with hand-drawn arrows (the way a teacher annotates a page).
 */

import { CSSProperties, ReactNode } from "react";

/** Browser window chrome around a screenshot. */
export const BrowserFrame = ({ url, children, className = "" }: { url: string; children: ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-[1.25rem] border border-ink/15 bg-surface shadow-[0_2px_4px_rgba(85,45,36,0.06),0_40px_80px_-32px_rgba(85,45,36,0.45)] ${className}`}>
    <div className="flex items-center gap-2 border-b border-ink/8 bg-paper-2/70 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[#FF8B7B]" />
      <span className="h-2.5 w-2.5 rounded-full bg-butter" />
      <span className="h-2.5 w-2.5 rounded-full bg-lime" />
      <span className="mx-auto w-[min(60%,22rem)] truncate rounded-full bg-surface px-3 py-1 text-center text-[11px] font-semibold text-ink-3">{url}</span>
      <span className="w-[42px]" aria-hidden="true" />
    </div>
    {children}
  </div>
);

/** A simple phone body (no brand-specific hardware) around a portrait screenshot. */
export const PhoneFrame = ({ src, alt, className = "", style }: { src: string; alt: string; className?: string; style?: CSSProperties }) => (
  <div
    className={`rounded-[2.6rem] bg-[#1B1512] p-[9px] ring-1 ring-white/10 shadow-[0_2px_4px_rgba(85,45,36,0.12),0_40px_70px_-28px_rgba(30,12,8,0.65)] ${className}`}
    style={style}
  >
    <div className="relative overflow-hidden rounded-[2.05rem] bg-[#F9F1DD]">
      <img src={src} alt={alt} width={390} height={844} loading="lazy" decoding="async" className="block h-auto w-full" />
      <span className="absolute left-1/2 top-2 h-[18px] w-[34%] -translate-x-1/2 rounded-full bg-[#1B1512]" aria-hidden="true" />
    </div>
  </div>
);

/** Hand-drawn arrows. Each path was drawn with a slight wobble so it does not look machine-made. */
const ARROWS = {
  // from the note (top-left) curving down-right to the target
  downRight: { d: "M6 8 C 30 6, 58 18, 70 44 C 76 58, 78 66, 80 74", head: "M70 64 L 80 75 L 86 62", box: "0 0 92 82" },
  // from the note (right) curving down-left
  downLeft: { d: "M86 8 C 62 6, 34 18, 22 44 C 16 58, 14 66, 12 74", head: "M22 64 L 12 75 L 6 62", box: "0 0 92 82" },
  // from the note curving up-left
  upLeft: { d: "M86 74 C 64 76, 36 64, 24 38 C 18 24, 16 16, 14 8", head: "M6 18 L 14 7 L 24 16", box: "0 0 92 82" },
  // from the note curving up-right
  upRight: { d: "M6 74 C 28 76, 56 64, 68 38 C 74 24, 76 16, 78 8", head: "M68 16 L 78 7 L 86 18", box: "0 0 92 82" },
} as const;
export type ArrowKind = keyof typeof ARROWS;

export const ScribbleArrow = ({ kind, className = "" }: { kind: ArrowKind; className?: string }) => {
  const a = ARROWS[kind];
  return (
    <svg viewBox={a.box} className={className} fill="none" aria-hidden="true">
      <path d={a.d} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d={a.head} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** A margin note in handwriting. */
export const HandNote = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <p className={`font-hand text-[1.55rem] font-bold leading-[1.05] text-brand-ink ${className}`} style={style}>
    {children}
  </p>
);

/** Hand-drawn underline / circle marks. */
export const ScribbleUnderline = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 14" preserveAspectRatio="none" className={className} fill="none" aria-hidden="true">
    <path d="M3 9 C 40 4, 80 3, 120 6 S 180 10, 197 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
