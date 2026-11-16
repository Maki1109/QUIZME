import { ReactNode, useEffect, useId, useRef, useState, CSSProperties, ElementType } from "react";
import { Kinetic } from "./kinetic";

/** Fades/rises children into view once they enter the viewport. */
export const Reveal = ({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
};

export const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1320px] px-4 sm:px-8 ${className}`}>{children}</div>
);

/** Scalloped label that sits above section titles ("OUR MENU" in the reference). */
export const Sticker = ({
  children,
  color = "var(--sky)",
  className = "",
  style,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <span className={`sticker ${className}`} style={{ background: color, ...style }}>
    {children}
  </span>
);

/** Section heading: sticker label, huge condensed title, optional aside. */
export const SectionHeader = ({
  eyebrow,
  title,
  aside,
  align = "left",
  stickerColor,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  align?: "left" | "center";
  stickerColor?: string;
  className?: string;
}) => {
  const centered = align === "center";
  return (
    <div className={`${centered ? "text-center flex flex-col items-center" : ""} mb-12 md:mb-16 ${className}`}>
      <Reveal>
        <Sticker color={stickerColor}>{eyebrow}</Sticker>
      </Reveal>
      <Reveal delay={60}>
        <h2 className={`display mt-5 text-[2.9rem] sm:text-6xl lg:text-[5.25rem] ${centered ? "mx-auto max-w-5xl" : "max-w-4xl"}`}>
          <Kinetic>{title}</Kinetic>
        </h2>
      </Reveal>
      {aside && (
        <Reveal delay={120} className={`mt-5 text-lg leading-relaxed text-ink-2 ${centered ? "mx-auto max-w-xl" : "max-w-xl"}`}>
          {aside}
        </Reveal>
      )}
    </div>
  );
};

/** Four-point sparkle used as logo mark and ribbon separator. */
export const Sparkle = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
    <path d="M12 0C12.6 6.4 17.6 11.4 24 12C17.6 12.6 12.6 17.6 12 24C11.4 17.6 6.4 12.6 0 12C6.4 11.4 11.4 6.4 12 0Z" />
  </svg>
);

/**
 * Logo mark: a pencil bent into a "Q" (eraser on the right, a short nib poking straight out
 * of the bottom stroke as the Q's tail) wearing a graduation cap, on its own dark tile like
 * an app icon. The tile carries its own contrast, so the mark reads the same on the night
 * landing, the pink auth panel and the cream app. Colours come from `--logo-tile`, `--logo-q`
 * (pencil body), `--logo-nib` (nib + eraser) and `--logo-cap` (see globals.css).
 * Pieces are split by real gaps.
 */
export const LogoMark = ({ className = "" }: { className?: string }) => {
  const sheen = `logo-sheen-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="107 -60 1200 1200" className={`logo-mark ${className}`} aria-hidden="true">
      <defs>
        {/* Bright top edge: light catching the tile, fading out toward the bottom. */}
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="107" y="-60" width="1200" height="1200" rx="282" fill="var(--logo-tile)" />
      <rect x="119" y="-48" width="1176" height="1176" rx="270" fill="none" stroke={`url(#${sheen})`} strokeWidth="24" />
      <path fill="var(--logo-q)" d="M548 262H813A236 236 0 0 1 1049 498V588H884V498A71 71 0 0 0 813 427H605A71 71 0 0 0 534 498V706A71 71 0 0 0 605 777H1052V942H605A237 237 0 0 1 368 705V500C368 476 371 455 377 436C455 424 520 380 563 296Z" />
      <path fill="var(--logo-eraser)" d="M884 632H1049V677A45 45 0 0 1 1004 722H929A45 45 0 0 1 884 677Z" />
      <g fill="var(--logo-cap)">
        <path d="M309 353L424 332L500 243L534 296C486 372 418 402 344 407Z" />
        <path d="M338 178L556 137L412 308L212 355L364.5 261.4A22 22 0 1 0 353 242.6L200 336.6Z" />
      </g>
      <path className="logo-nib" fill="var(--logo-nib)" d="M1084 777L1194 847Q1216 859.5 1194 872L1084 942Z" />
    </svg>
  );
};

/** Wordmark: pencil-Q mark + condensed uppercase "QUIZME". */
export const Wordmark = ({ className = "", inverted = false }: { className?: string; inverted?: boolean }) => (
  <span
    className={`wordmark inline-flex items-center gap-[0.3em] ${inverted ? "text-paper" : "text-ink"} ${className}`}
    style={{ fontFamily: "var(--font-display)", fontStretch: "75%", fontWeight: 800, letterSpacing: "0.005em" }}
  >
    <LogoMark className="h-[1.3em] w-[1.3em] shrink-0" />
    <span className="leading-none">QUIZME</span>
  </span>
);

/* ---------- Organic shapes ---------- */

/** Smooth flower/blob path: r(θ) = R·(1 + amp·cos(lobes·θ)). */
const flowerPath = (lobes: number, amp: number, rotation = 0, size = 200) => {
  const c = size / 2;
  const R = c / (1 + amp);
  const steps = 180;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = R * (1 + amp * Math.cos(lobes * (t + rotation)));
    const x = c + r * Math.cos(t);
    const y = c + r * Math.sin(t);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
};

const SHAPES = {
  flower: flowerPath(4, 0.16, Math.PI / 4),
  scallop: flowerPath(12, 0.05),
  cloud: flowerPath(6, 0.09),
  blob: flowerPath(3, 0.08, 0.3),
} as const;

export type BlobShape = keyof typeof SHAPES;

export const Blob = ({
  shape = "flower",
  color,
  className = "",
  style,
}: {
  shape?: BlobShape;
  color: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true" preserveAspectRatio="none">
    <path d={SHAPES[shape]} fill={color} />
  </svg>
);

/* ---------- Ribbon marquee ---------- */

/**
 * Diagonal tape with an endlessly scrolling phrase, like the reference's
 * "FRESH JOY ✦" ribbons. Decorative, so hidden from assistive tech.
 */
export const Ribbon = ({
  items,
  color = "var(--pink)",
  rotate = -4,
  reverse = false,
  className = "",
  size = "text-3xl sm:text-4xl md:text-5xl",
}: {
  items: string[];
  color?: string;
  rotate?: number;
  reverse?: boolean;
  className?: string;
  size?: string;
}) => {
  const run = (
    <span className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 md:px-8">{t}</span>
          <Sparkle className="h-[0.7em] w-[0.7em]" />
        </span>
      ))}
    </span>
  );
  return (
    <div
      className={`ribbon pointer-events-none select-none ${size} ${className}`}
      style={{ background: color, transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <div className={`marquee py-3 md:py-4 ${reverse ? "marquee-reverse" : ""}`}>
        {run}
        {run}
        {run}
        {run}
      </div>
    </div>
  );
};

/**
 * Wavy edge that blends one section's colour into the next. The swell rolls slowly sideways:
 * the shape repeats every 1440 units and slides by exactly one period, so the loop is seamless.
 * A fainter swell behind it moves the other way for depth. Static with reduced motion.
 */
const WAVE_FRONT =
  "M0 40C180 40 330 22 480 46C580 62 630 128 720 128C810 128 860 62 960 46C1110 22 1260 40 1440 40" +
  "C1620 40 1770 22 1920 46C2020 62 2070 128 2160 128C2250 128 2300 62 2400 46C2550 22 2700 40 2880 40V140H0Z";
const WAVE_BACK =
  "M0 64C240 64 420 30 720 30C1020 30 1200 64 1440 64C1680 64 1860 30 2160 30C2460 30 2640 64 2880 64V140H0Z";

export const WaveEdge = ({ color, flip = false, className = "" }: { color: string; flip?: boolean; className?: string }) => (
  <div
    className={`relative block h-[60px] w-full overflow-hidden sm:h-[90px] md:h-[140px] ${flip ? "rotate-180" : ""} ${className}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 2880 140" preserveAspectRatio="none" className="wave-roll wave-roll-back absolute inset-y-0 left-0 h-full w-[200%]">
      <path d={WAVE_BACK} fill={color} opacity="0.45" />
    </svg>
    <svg viewBox="0 0 2880 140" preserveAspectRatio="none" className="wave-roll absolute inset-y-0 left-0 h-full w-[200%]">
      <path d={WAVE_FRONT} fill={color} />
    </svg>
  </div>
);

/** Circular text badge that slowly turns ("START WITH SOMETHING GOOD"). */
export const CircleBadge = ({
  text,
  color = "var(--butter)",
  children,
  className = "",
}: {
  text: string;
  color?: string;
  children?: ReactNode;
  className?: string;
}) => {
  const pathId = `circle-badge-${useId().replace(/:/g, "")}`;
  return (
  // on-light: the disc is a pastel surface, so on the night landing it takes the daytime ink back.
  <div className={`on-light relative h-28 w-28 ${className}`} aria-hidden="true">
    <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
      <circle cx="60" cy="60" r="60" fill={color} />
    </svg>
    <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0 h-full w-full">
      <defs>
        <path id={pathId} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
      </defs>
      <text
        fill="var(--ink)"
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize="12.5"
        letterSpacing="1.4"
        style={{ fontStretch: "80%", textTransform: "uppercase" }}
      >
        <textPath href={`#${pathId}`}>{text}</textPath>
      </text>
    </svg>
    <div className="absolute inset-0 flex items-center justify-center text-ink">{children}</div>
  </div>
  );
};
