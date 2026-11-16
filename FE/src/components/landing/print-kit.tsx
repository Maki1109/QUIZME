/**
 * Print-shop details that make a panel read as a physical sheet:
 * crop marks at the corners, a colour-registration bar, and oversized outlined watermark type.
 */

import { CSSProperties } from "react";

/** Crop marks just outside the four corners of the nearest positioned parent. */
export const CropMarks = ({ className = "" }: { className?: string }) => (
  <div className={`pointer-events-none absolute -inset-4 hidden sm:block ${className}`} aria-hidden="true">
    {(["left-0 top-0", "right-0 top-0 rotate-90", "right-0 bottom-0 rotate-180", "left-0 bottom-0 -rotate-90"] as const).map((pos) => (
      <svg key={pos} viewBox="0 0 24 24" className={`absolute h-6 w-6 ${pos}`} fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 16H11M16 0V11" />
      </svg>
    ))}
  </div>
);

/** Registration target + process-colour patches, as printed in the margin of a press sheet. */
export const RegistrationBar = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="10" cy="10" r="6" />
      <path d="M10 0V20M0 10H20" />
    </svg>
    <span className="flex overflow-hidden rounded-[3px]">
      {["#22B8E6", "#F0379A", "#FFD21F", "#1B1512"].map((c) => (
        <span key={c} className="h-3.5 w-5" style={{ background: c }} />
      ))}
    </span>
  </div>
);

/** Huge outlined type lying behind a section. Decorative only. */
export const Watermark = ({ text, className = "", style }: { text: string; className?: string; style?: CSSProperties }) => (
  <p
    className={`display pointer-events-none absolute select-none whitespace-nowrap !leading-none ${className}`}
    style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(244, 239, 224, 0.07)", ...style }}
    aria-hidden="true"
  >
    {text}
  </p>
);
