/**
 * Hand-drawn study-desk scene for the sign-in / sign-up panel, in the same flat, outlined style as
 * the landing-page stickers: an open error notebook where a wrong answer (✗) gets corrected (✓),
 * the star mascot asking "Vì sao lại sai?", the 5-minute challenge on a phone, a formula flashcard,
 * a sticky note and the golden-time alarm clock.
 *
 * Pure SVG (scales with the panel, no image request). On mount the pieces settle onto the desk one
 * by one and the ✗ → ✓ strokes draw; the mascot blinks now and then. All of it is skipped with
 * reduced motion. Decorative: the panel's text carries the meaning.
 */

import type { CSSProperties } from "react";

const INK = "#552D24";
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const Sparkle = ({ x, y, s = 1, fill = "#FFFDF7", delay = 0 }: { x: number; y: number; s?: number; fill?: string; delay?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path
    className="ill-pop"
    style={d(delay)}
    d="M0 -14C1.2 -5 5 -1.2 14 0C5 1.2 1.2 5 0 14C-1.2 5 -5 1.2 -14 0C-5 -1.2 -1.2 -5 0 -14Z"
    fill={fill}
    stroke={INK}
    strokeWidth={2.5 / s}
    strokeLinejoin="round"
  />
  </g>
);

export const AuthIllustration = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 560 420" className={className} role="presentation" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Warm halo behind the desk */}
    <path
      className="ill-pop"
      style={d(0)}
      d="M280 22C352 22 405 47 445 92C489 141 512 196 498 256C484 318 430 352 361 360C306 366 256 368 199 360C126 350 70 318 58 254C46 190 70 132 116 88C158 48 212 22 280 22Z"
      fill="#F9E47C"
      opacity="0.85"
    />

    {/* Desk */}
    <rect x="12" y="356" width="536" height="30" rx="15" fill="#F2B985" stroke={INK} strokeWidth="4" />
    <path d="M40 371H520" stroke={INK} strokeWidth="2" opacity="0.25" />

    {/* Flashcards (back card, front card) */}
    <g className="ill-pop" style={d(140)}>
      <rect x="74" y="44" width="164" height="92" rx="10" fill="#FF95C3" stroke={INK} strokeWidth="3.5" transform="rotate(-9 156 90)" />
      <g transform="rotate(4 166 92)">
        <rect x="84" y="48" width="168" height="92" rx="10" fill="#FFFDF7" stroke={INK} strokeWidth="3.5" />
        <path d="M86 72H250" stroke="#E86A5B" strokeWidth="2" />
        <path d="M86 96H250M86 118H250" stroke="#B9DBFD" strokeWidth="2" />
        <text x="96" y="66" fill={INK} fontSize="9" fontWeight="700" letterSpacing="1.6" style={{ fontFamily: "var(--font-mono)" }}>
          THẺ SỐ 07
        </text>
        <text x="168" y="112" textAnchor="middle" fill={INK} fontSize="21" fontStyle="italic" fontWeight="700" style={{ fontFamily: "var(--font-poster)" }}>
          sin²x + cos²x = 1
        </text>
      </g>
    </g>

    {/* Sticky note */}
    <g className="ill-pop" style={d(220)}>
      <g transform="rotate(6 318 112)">
      <path d="M272 70H362V140C362 146 357 151 351 151H272Z" fill="#D6DE67" stroke={INK} strokeWidth="3.5" />
      <rect x="296" y="60" width="44" height="16" rx="2" fill="#FFFDF7" opacity="0.75" stroke={INK} strokeWidth="1.5" transform="rotate(-5 318 68)" />
      <text x="317" y="106" textAnchor="middle" fill={INK} fontSize="21" className="font-hand">
        20 lỗi
      </text>
      <text x="317" y="130" textAnchor="middle" fill={INK} fontSize="17" className="font-hand">
        tuần này
      </text>
      </g>
    </g>

    {/* Open error notebook on the desk */}
    <g className="ill-pop" style={d(60)}>
      <path d="M98 184V360Q188 368 280 378Q372 368 462 360V184Z" fill="#C9CAF8" stroke={INK} strokeWidth="4" />
      <path d="M110 176Q194 162 280 184V362Q194 344 110 352Z" fill="#FFFDF7" stroke={INK} strokeWidth="3.5" />
      <path d="M280 184Q366 162 450 176V352Q366 344 280 362Z" fill="#FFFDF7" stroke={INK} strokeWidth="3.5" />
      {[214, 240, 266, 292, 318].map((y) => (
        <g key={y} stroke="#E9DAB9" strokeWidth="2">
          <path d={`M124 ${y - 6}Q200 ${y - 12} 268 ${y + 4}`} />
          <path d={`M292 ${y + 4}Q360 ${y - 12} 436 ${y - 6}`} />
        </g>
      ))}

      {/* Left page: the question and the wrong attempt */}
      <text x="146" y="200" fill={INK} fontSize="9" fontWeight="700" letterSpacing="1.4" style={{ fontFamily: "var(--font-mono)" }}>
        CÂU 7 · NGUYÊN HÀM
      </text>
      <text x="146" y="232" fill={INK} fontSize="21" className="font-hand">
        ∫ x·eˣ dx = ?
      </text>
      <text x="146" y="266" fill={INK} fontSize="18" opacity="0.7" className="font-hand">
        = x·eˣ + C
      </text>
      <path d="M142 258Q186 254 230 260" stroke="#D93A2B" strokeWidth="3" />
      <rect x="146" y="292" width="64" height="20" rx="10" fill="#FF95C3" stroke={INK} strokeWidth="2" />
      <text x="178" y="306" textAnchor="middle" fill={INK} fontSize="10" fontWeight="800" style={{ fontFamily: "var(--font-body)" }}>
        Bất cẩn
      </text>
      <path className="ill-draw" style={d(700)} pathLength={1} d="M232 280L258 306M258 280L232 306" stroke="#D93A2B" strokeWidth="6" />

      {/* Right page: corrected */}
      <text x="296" y="200" fill="#5E681D" fontSize="9" fontWeight="700" letterSpacing="1.4" style={{ fontFamily: "var(--font-mono)" }}>
        SỬA LẠI · ĐÃ VỮNG
      </text>
      <text x="296" y="232" fill={INK} fontSize="16" className="font-hand">
        u = x, dv = eˣdx
      </text>
      <path d="M294 270Q352 262 420 268" stroke="#D6DE67" strokeWidth="11" opacity="0.9" />
      <text x="296" y="266" fill={INK} fontSize="20" className="font-hand">
        = x·eˣ − eˣ + C
      </text>
      <path className="ill-draw" style={d(1150)} pathLength={1} d="M388 296L402 312L430 278" stroke="#5E681D" strokeWidth="6" />
      <path d="M280 184V362" stroke={INK} strokeWidth="3" />
    </g>

    {/* Phone with the 5-minute challenge, leaning on the notebook */}
    <g className="ill-pop" style={d(300)}>
      <g transform="translate(-22 0) rotate(-8 92 260)">
      <rect x="38" y="152" width="108" height="200" rx="18" fill={INK} stroke={INK} strokeWidth="3.5" />
      <rect x="45" y="161" width="94" height="182" rx="12" fill="#F9F1DD" />
      <rect x="78" y="164" width="28" height="6" rx="3" fill={INK} />
      <text x="52" y="186" fill={INK} fontSize="8" fontWeight="800" letterSpacing="0.6" style={{ fontFamily: "var(--font-display)" }}>
        5 PHÚT
      </text>
      <rect x="104" y="177" width="30" height="13" rx="6.5" fill="#F9E47C" stroke={INK} strokeWidth="1.5" />
      <text x="119" y="186.5" textAnchor="middle" fill={INK} fontSize="7" fontWeight="800" style={{ fontFamily: "var(--font-mono)" }}>
        04:10
      </text>
      <rect x="52" y="196" width="80" height="4" rx="2" fill="#EADBB6" />
      <rect x="52" y="196" width="38" height="4" rx="2" fill="#F6700F" />
      <rect x="52" y="210" width="74" height="5" rx="2.5" fill={INK} opacity="0.55" />
      <rect x="52" y="220" width="54" height="5" rx="2.5" fill={INK} opacity="0.55" />
      {[236, 258, 280, 302].map((y, i) => (
        <g key={y}>
          <rect x="52" y={y} width="80" height="16" rx="8" fill={i === 1 ? "#D6DE67" : "#FFFDF7"} stroke={INK} strokeWidth="1.5" />
          <text x="62" y={y + 11} fill={INK} fontSize="7.5" fontWeight="800" style={{ fontFamily: "var(--font-body)" }}>
            {"ABCD"[i]}
          </text>
          <rect x="74" y={y + 6} width={i === 1 ? 30 : 40 - i * 4} height="4" rx="2" fill={INK} opacity="0.35" />
        </g>
      ))}
      <path d="M114 265L118 269L125 261" stroke={INK} strokeWidth="2" />
      </g>
    </g>

    {/* Star mascot on the notebook's corner, asking the Socratic question */}
    <g className="ill-pop" style={d(480)}>
      <path d="M432 96C439 131 454 146 490 153C454 160 439 175 432 210C425 175 410 160 374 153C410 146 425 131 432 96Z" fill="#FFA62B" stroke={INK} strokeWidth="4" />
      <path d="M432 112C436 132 446 142 466 148" stroke="#FFD27A" strokeWidth="5" opacity="0.9" />
      <g className="ill-blink">
        <ellipse cx="420" cy="152" rx="4.5" ry="6.5" fill={INK} />
        <ellipse cx="444" cy="152" rx="4.5" ry="6.5" fill={INK} />
      </g>
      <circle cx="410" cy="164" r="5" fill="#FF95C3" />
      <circle cx="454" cy="164" r="5" fill="#FF95C3" />
      <path d="M423 165Q432 174 441 165" stroke={INK} strokeWidth="3" />
    </g>
    <g className="ill-pop" style={d(640)}>
      <path d="M448 36H544Q556 36 556 48V78Q556 90 544 90H480L464 108L468 90H448Q436 90 436 78V48Q436 36 448 36Z" fill="#B9DBFD" stroke={INK} strokeWidth="3.5" />
      <text x="496" y="70" textAnchor="middle" fill={INK} fontSize="18" className="font-hand">
        Vì sao lại sai?
      </text>
    </g>

    {/* Golden-time alarm clock */}
    <g className="ill-pop" style={d(380)}>
      <circle cx="486" cy="298" r="11" fill="#F9E47C" stroke={INK} strokeWidth="3" />
      <circle cx="530" cy="298" r="11" fill="#F9E47C" stroke={INK} strokeWidth="3" />
      <path d="M492 352L486 360M524 352L530 360" stroke={INK} strokeWidth="4" />
      <circle cx="508" cy="324" r="31" fill="#FFFDF7" stroke={INK} strokeWidth="4" />
      <path d="M508 304V324L522 332" stroke={INK} strokeWidth="3.5" />
      <circle cx="508" cy="324" r="3" fill="#F6700F" />
      <path d="M508 296V299M508 349V352M480 324H483M533 324H536" stroke={INK} strokeWidth="2.5" />
    </g>

    {/* Pencil lying on the desk */}
    <g className="ill-pop" style={d(420)}>
      <g transform="rotate(-3 300 372)">
      <path d="M196 364H178Q170 364 170 372Q170 380 178 380H196Z" fill="#FF95C3" stroke={INK} strokeWidth="3" />
      <rect x="196" y="364" width="16" height="16" fill="#D2B69B" stroke={INK} strokeWidth="3" />
      <rect x="212" y="364" width="138" height="16" fill="#F9E47C" stroke={INK} strokeWidth="3" />
      <path d="M350 364L380 372L350 380Z" fill="#F2D3A4" stroke={INK} strokeWidth="3" />
      <path d="M371 369.5L380 372L371 374.5Z" fill={INK} />
      </g>
    </g>

    <Sparkle x={262} y={34} s={0.9} fill="#FFFDF7" delay={760} />
    <Sparkle x={36} y={118} s={0.7} fill="#B9DBFD" delay={820} />
    <Sparkle x={530} y={168} s={0.8} fill="#FF95C3" delay={880} />
    <Sparkle x={372} y={42} s={0.55} fill="#D6DE67" delay={940} />
  </svg>
);
