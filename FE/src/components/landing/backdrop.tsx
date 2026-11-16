/**
 * Background set dressing for the dark landing page: chalk left on a board, stage light,
 * faint grid paper, stickers peeking in from the edges, sticky notes and washi tape.
 *
 * Everything here is decorative: hidden from assistive tech, never takes pointer events,
 * and sits in a clipped layer behind the section content (the section needs `relative isolate`).
 * Stickers drift a little against the scroll where the browser supports scroll-driven
 * animations; with reduced motion they stay still.
 */

import { CSSProperties, ReactNode } from "react";
import { STICKERS, type StickerName } from "./stickers";

/** Shared SVG filter that roughens strokes into chalk. Render once per page. */
export const ChalkDefs = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="8" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="holes" />
        <feComposite in="rough" in2="holes" operator="in" />
      </filter>
    </defs>
  </svg>
);

/** The clipped layer every decoration lives in. */
export const Decor = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden ${className}`} aria-hidden="true">
    {children}
  </div>
);

/** A pool of stage light. */
export const Spot = ({ className = "", color = "rgba(255, 201, 60, 0.11)" }: { className?: string; color?: string }) => (
  <div className={`absolute rounded-full ${className}`} style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }} />
);

/** A patch of board grid that fades out at its edges. */
export const GridFade = ({ className = "" }: { className?: string }) => <div className={`grid-fade absolute ${className}`} />;

/* ---------- Chalk doodles ---------- */

type DoodleDef = { box: string; strokes: string[]; dots?: [number, number][]; dashed?: string[]; labels?: [number, number, string][] };

const DOODLES = {
  // y = x³ − 3x with its two turning points marked
  graph: {
    box: "0 0 220 180",
    strokes: [
      "M20 149 C 80 147, 150 149, 205 147", "M197 141 L206 147 L197 154",
      "M41 170 C 40 120, 42 60, 42 13", "M35 22 L42 11 L49 22",
      "M26 155 C 44 80, 56 46, 70 46 C 86 46, 96 70, 110 90 C 124 110, 134 134, 150 134 C 166 134, 178 100, 194 25",
    ],
    dashed: ["M70 50 V147", "M150 138 V147"],
    dots: [[70, 46], [150, 134]],
    labels: [[203, 168, "x"], [52, 16, "y"], [58, 36, "CĐ"], [142, 124, "CT"]],
  },
  // right triangle with an angle mark
  triangle: {
    box: "0 0 200 170",
    strokes: ["M30 141 C 80 139, 130 141, 171 139 C 130 108, 70 60, 31 29 C 29 70, 31 110, 30 141", "M30 124 H46 V140", "M146 140 C 147 133, 149 128, 152 124"],
    labels: [[96, 162, "a"], [10, 92, "b"], [106, 76, "c"], [128, 132, "α"]],
  },
  // Oxyz axes with a vector
  axes: {
    box: "0 0 200 180",
    strokes: [
      "M90 110 C 89 80, 91 50, 90 18", "M84 28 L90 17 L96 28",
      "M90 110 C 120 111, 160 109, 188 110", "M178 104 L189 110 L178 116",
      "M90 110 C 70 130, 50 150, 30 168", "M32 155 L29 169 L43 166",
      "M90 110 L150 52", "M138 56 L151 51 L146 64",
    ],
    dashed: ["M150 52 V122", "M150 122 L90 110"],
    labels: [[16, 172, "x"], [190, 128, "y"], [100, 20, "z"], [74, 124, "O"], [156, 46, "u"]],
  },
  star: {
    box: "0 0 120 120",
    strokes: ["M60 10 L72 44 L108 46 L80 68 L90 104 L60 84 L30 104 L40 68 L12 46 L48 44 Z", "M100 14 l8 -8", "M106 28 l11 -2", "M16 18 l-7 -7"],
  },
  loop: {
    box: "0 0 220 120",
    strokes: ["M10 90 C 40 30, 100 20, 120 60 C 135 90, 95 110, 85 80 C 75 50, 130 30, 200 40", "M188 30 L202 40 L190 52"],
  },
  clock: {
    box: "0 0 140 140",
    strokes: [
      "M70 12 C 104 12, 128 38, 128 70 C 128 104, 102 128, 70 128 C 36 128, 12 102, 12 70 C 12 40, 34 14, 64 13",
      "M70 70 L70 36", "M70 70 L94 82", "M70 18 v8", "M70 114 v8", "M18 70 h8", "M114 70 h8", "M120 20 l10 -10", "M130 36 l12 -4",
    ],
  },
  question: {
    box: "0 0 100 160",
    strokes: ["M24 46 C 24 18, 50 8, 66 16 C 86 26, 84 52, 66 64 C 54 72, 50 80, 50 100"],
    dots: [[50, 130]],
  },
  zigzag: {
    box: "0 0 210 40",
    strokes: ["M5 20 Q 30 5, 55 20 T 105 20 T 155 20 T 205 20"],
  },
} satisfies Record<string, DoodleDef>;

export type DoodleKind = keyof typeof DOODLES;

export const Doodle = ({ kind, className = "", style }: { kind: DoodleKind; className?: string; style?: CSSProperties }) => {
  const d: DoodleDef = DOODLES[kind];
  return (
    <svg viewBox={d.box} className={`absolute overflow-visible ${className}`} style={style} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <g filter="url(#chalk)">
        {d.strokes.map((p) => (
          <path key={p} d={p} strokeWidth="3" />
        ))}
        {d.dashed?.map((p) => (
          <path key={p} d={p} strokeWidth="2" strokeDasharray="5 6" />
        ))}
        {d.dots?.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="currentColor" stroke="none" />
        ))}
        {d.labels?.map(([x, y, t]) => (
          <text key={t} x={x} y={y} fill="currentColor" stroke="none" fontFamily="var(--font-hand)" fontSize="17">
            {t}
          </text>
        ))}
      </g>
    </svg>
  );
};

/** A formula written in chalk. */
export const ChalkText = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <p className={`font-hand absolute whitespace-nowrap leading-none ${className}`} style={style}>
    {children}
  </p>
);

/* ---------- Paper things ---------- */

/** A sticker tucked half off the edge of the section. `rot` is degrees, `drift` the parallax travel in px. */
export const Peek = ({
  name,
  className = "",
  rot = 0,
  drift = 40,
}: {
  name: StickerName;
  className?: string;
  rot?: number;
  drift?: number;
}) => {
  const s = STICKERS[name];
  return (
    <div className={`drift absolute ${className}`} style={{ "--drift": `${drift}px` } as CSSProperties}>
      <img
        src={s.src}
        alt=""
        width={s.w}
        height={s.h}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-auto w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.45)]"
        style={{ transform: `rotate(${rot}deg)` }}
      />
    </div>
  );
};

/** Strip of semi-transparent washi tape with torn ends. */
export const Tape = ({ className = "", color = "var(--pink)", rot = -6 }: { className?: string; color?: string; rot?: number }) => (
  <span className={`washi absolute block ${className}`} style={{ background: color, transform: `rotate(${rot}deg)` }} />
);

/** A sticky note with a marker message, taped to the board. */
export const PostIt = ({
  children,
  className = "",
  color = "var(--butter)",
  rot = -4,
  drift = 24,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  rot?: number;
  drift?: number;
}) => (
  <div className={`drift absolute ${className}`} style={{ "--drift": `${drift}px` } as CSSProperties}>
    <div className="on-light postit relative" style={{ background: color, transform: `rotate(${rot}deg)` }}>
      <Tape className="-top-3 left-1/2 h-6 w-16 -translate-x-1/2" color="rgba(244, 239, 224, 0.55)" rot={rot > 0 ? -3 : 3} />
      <p className="font-hand text-[1.3rem] leading-[1.15] text-ink">{children}</p>
    </div>
  </div>
);

/* ---------- Formula credits ---------- */

const FORMULAS = [
  "sin²x + cos²x = 1",
  "(eˣ)′ = eˣ",
  "∫ xⁿ dx = xⁿ⁺¹⁄(n+1) + C",
  "logₐ(bc) = logₐb + logₐc",
  "P(A|B) = P(A∩B) ⁄ P(B)",
  "y′ = 0 ⇒ cực trị?",
  "V = ⅓ · B · h",
  "|a + b| ≤ |a| + |b|",
];

/** Slow, dim line of formulas rolling past like end credits; used as a section divider. */
export const FormulaTicker = ({ reverse = false, className = "" }: { reverse?: boolean; className?: string }) => {
  const run = (
    <span className="flex shrink-0 items-center">
      {FORMULAS.map((f) => (
        <span key={f} className="flex items-center">
          <span className="px-8 md:px-12">{f}</span>
          <span className="text-[0.5em] text-[var(--pop)] opacity-70">✦</span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      className={`pointer-events-none select-none overflow-hidden whitespace-nowrap py-6 text-[1.6rem] text-ink/25 md:text-[2.2rem] ${className}`}
      style={{ fontFamily: "var(--font-poster)", fontStyle: "italic", fontWeight: 700, maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}
      aria-hidden="true"
    >
      <div className={`marquee marquee-slow ${reverse ? "marquee-reverse" : ""}`}>
        {run}
        {run}
      </div>
    </div>
  );
};
