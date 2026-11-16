/**
 * The 3D stage of the product tour (desktop).
 *
 * The real screenshots are a deck of browser windows in perspective: the active screen sits in
 * front, the next ones wait behind it, and a finished screen lifts toward the viewer and dissolves.
 * Notes and stickers float above the glass at different depths, so when the deck tilts — slowly
 * with scroll progress, and toward the pointer — they parallax against the screen.
 *
 * Motion: one rAF loop drives critically damped springs from their live values (scroll and pointer
 * only move targets), the deck itself is state-driven CSS. Reduced motion: no tilt, no travel, the
 * screens simply cross-fade.
 */

import { CSSProperties, RefObject, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { BrowserFrame, HandNote, ScribbleArrow, type ArrowKind } from "./showcase-kit";
import { STICKERS, type StickerName } from "./stickers";
import { hasFinePointer, spring, stepSpring } from "./motion3d";

export interface TourScreen {
  key: string;
  img: string;
  alt: string;
  url: string;
  accent: string;
  slip: { text: string; x: number; y: number; rotate: number; arrow: ArrowKind; arrowFirst?: boolean };
  /** Stickers that rise out of the screen for this step: position in % of the stage, width %, depth px. */
  props: { name: StickerName; x: number; y: number; w: number; z: number; rot: number }[];
  chip?: { text: string; x: number; y: number; z: number };
}

const Slip = ({ slip }: { slip: TourScreen["slip"] }) => {
  const arrow = <ScribbleArrow kind={slip.arrow} className="h-14 w-16 shrink-0 text-brand-ink" />;
  return (
    <div className="pointer-events-none absolute flex items-center gap-1" style={{ left: `${slip.x}%`, top: `${slip.y}%` }}>
      {slip.arrowFirst && arrow}
      <div className="relative rounded-[6px] bg-butter px-4 pb-2 pt-3 shadow-[0_18px_30px_-14px_rgba(0,0,0,0.7)]" style={{ transform: `rotate(${slip.rotate}deg)` }}>
        <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-[-4deg] rounded-[2px] bg-surface/70 shadow-sm" aria-hidden="true" />
        <HandNote className="!text-[1.45rem] whitespace-nowrap !text-ink">{slip.text}</HandNote>
      </div>
      {!slip.arrowFirst && arrow}
    </div>
  );
};

/** Where a card sits in the deck, by its distance from the active one. */
const cardStyle = (d: number, reduced: boolean): CSSProperties => {
  if (reduced) return { transform: "none", opacity: d === 0 ? 1 : 0 };
  if (d === 0) return { transform: "translate3d(0, 0, 0)", opacity: 1 };
  if (d < 0) return { transform: "translate3d(-3%, 8%, 220px) rotateX(-10deg)", opacity: 0 };
  return { transform: `translate3d(${d * 3.2}%, ${-d * 5.5}%, ${-d * 120}px)`, opacity: d > 3 ? 0 : 1 };
};

export const TourStage = ({
  screens,
  active,
  tutor,
  trackRef,
  progressHost,
  railInsetVh = 39,
}: {
  screens: TourScreen[];
  active: number;
  tutor: { src: string; alt: string; step: number };
  /** The scrolling list of steps; progress through it steers the deck's turn. */
  trackRef: RefObject<HTMLElement | null>;
  /** Element that receives `--tour-p` (0–1) for the progress rail. */
  progressHost: RefObject<HTMLElement | null>;
  /** Top/bottom inset of the progress rail inside the track, in vh. */
  railInsetVh?: number;
}) => {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<HTMLDivElement | null>(null);
  const reducedPref = useReducedMotion() ?? false;
  const reduced = useRef(reducedPref);
  reduced.current = reducedPref;

  useEffect(() => {
    const scene = sceneRef.current;
    const rig = rigRef.current;
    if (!scene || !rig) return;

    const rx = spring(7, 0.5, 1);
    const ry = spring(-14, 0.5, 1);
    const prog = spring(0, 0.35, 1);
    let pointerX = 0;
    let pointerY = 0;
    let raf = 0;
    let last = 0;

    const readProgress = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const r = track.getBoundingClientRect();
      // Same inset as the rail, so the rail bead sits exactly at the middle of the viewport.
      const inset = (railInsetVh / 100) * window.innerHeight;
      return Math.min(1, Math.max(0, (window.innerHeight / 2 - r.top - inset) / Math.max(1, r.height - 2 * inset)));
    };
    const retarget = () => {
      const p = readProgress();
      prog.target = p;
      if (reduced.current) {
        rx.target = 0;
        ry.target = 0;
        return;
      }
      // The deck turns from three-quarter view toward the reader as the day goes on.
      ry.target = -15 + p * 9 + pointerX * 7;
      rx.target = 7 - p * 3 - pointerY * 5;
    };
    const tick = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000 || 1 / 60);
      last = now;
      const a = stepSpring(rx, dt);
      const b = stepSpring(ry, dt);
      const c = stepSpring(prog, dt);
      rig.style.transform = `rotateX(${rx.value.toFixed(3)}deg) rotateY(${ry.value.toFixed(3)}deg)`;
      rig.style.setProperty("--sheen-x", `${(58 + ry.value * 2.2).toFixed(1)}%`);
      progressHost.current?.style.setProperty("--tour-p", prog.value.toFixed(4));
      raf = a || b || c ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      retarget();
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const fine = hasFinePointer();
    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      wake();
    };
    const onLeave = () => {
      pointerX = 0;
      pointerY = 0;
      wake();
    };
    const section = scene.closest("section") ?? scene;
    if (fine) {
      section.addEventListener("pointermove", onMove as EventListener);
      section.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    wake();
    return () => {
      section.removeEventListener("pointermove", onMove as EventListener);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      cancelAnimationFrame(raf);
    };
  }, [trackRef, progressHost, reducedPref, railInsetVh]);

  const accent = screens[active].accent;
  const reducedNow = reducedPref;

  return (
    <div ref={sceneRef} className="relative" style={{ perspective: "1700px", perspectiveOrigin: "50% 40%" }}>
      {/* Light pooling on the desk under the deck, tinted by the current screen */}
      <div
        className="pointer-events-none absolute -bottom-20 left-[8%] right-[2%] h-40 rounded-[50%] opacity-60 blur-3xl transition-[background-color] duration-700"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      <div ref={rigRef} className="relative will-change-transform" style={{ transformStyle: "preserve-3d" }}>
        {/* Invisible copy of a card: gives the deck its size. */}
        <div className="invisible" aria-hidden="true">
          <BrowserFrame url="">
            <div className="aspect-[1280/820]" />
          </BrowserFrame>
        </div>

        {screens.map((s, i) => {
          const d = i - active;
          return (
            <div
              key={s.key}
              className="absolute inset-x-0 top-0 transition-[transform,opacity] duration-[750ms] [transition-timing-function:var(--ease-fluid)]"
              style={{ ...cardStyle(d, reducedNow), zIndex: 10 - Math.abs(d) }}
              aria-hidden={d !== 0}
            >
              <div className="relative">
                <BrowserFrame url={s.url} className="!shadow-[0_2px_4px_rgba(0,0,0,0.25),0_50px_90px_-30px_rgba(0,0,0,0.85)]">
                  <img
                    src={s.img}
                    alt={d === 0 ? s.alt : ""}
                    width={1280}
                    height={820}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="block aspect-[1280/820] w-full object-cover object-top"
                  />
                </BrowserFrame>
                {/* Waiting screens recede into the dark; the front one catches a moving highlight. */}
                <span
                  className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-[#060a08] transition-opacity duration-700"
                  style={{ opacity: d > 0 ? Math.min(0.75, 0.32 + d * 0.16) : 0 }}
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-0 rounded-[1.25rem] transition-opacity duration-500"
                  style={{
                    opacity: d === 0 && !reducedNow ? 1 : 0,
                    background: "linear-gradient(112deg, transparent 35%, rgba(255,255,255,0.13) var(--sheen-x, 58%), transparent 72%)",
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}

        {/* Notes hover a few centimetres above the glass, over the screenshot area. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 aspect-[1280/820]" style={{ transform: "translateZ(70px)", transformStyle: "preserve-3d" }} aria-hidden="true">
          {screens.map((s, i) => (
            <div
              key={s.key}
              className={`transition-[opacity,transform] duration-500 [transition-timing-function:var(--ease-fluid)] ${i === active ? "opacity-100 delay-200" : "opacity-0"}`}
              style={{ transform: i === active || reducedNow ? "none" : "translateY(10px)" }}
            >
              <Slip slip={s.slip} />
            </div>
          ))}
        </div>

        {/* Stickers rise out of the screen for their step, and sink back into it when it ends. */}
        {screens.flatMap((s, i) =>
          s.props.map((p, j) => {
            const art = STICKERS[p.name];
            const on = i === active;
            return (
              <img
                key={`${s.key}-${p.name}`}
                src={art.src}
                alt=""
                width={art.w}
                height={art.h}
                loading="lazy"
                decoding="async"
                draggable={false}
                aria-hidden="true"
                className="pointer-events-none absolute h-auto max-w-none drop-shadow-[0_22px_18px_rgba(0,0,0,0.5)] transition-[transform,opacity] duration-[650ms] [transition-timing-function:var(--ease-fluid)]"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.w}%`,
                  opacity: on ? 1 : 0,
                  transitionDelay: on ? `${180 + j * 90}ms` : "0ms",
                  transform: reducedNow
                    ? `rotate(${p.rot}deg)`
                    : on
                      ? `translateZ(${p.z}px) rotate(${p.rot}deg)`
                      : `translateZ(0px) rotate(${p.rot - 8}deg) scale(0.6)`,
                }}
              />
            );
          })
        )}

        {/* Floating figure tag */}
        {screens.map((s, i) =>
          s.chip ? (
            <span
              key={`${s.key}-chip`}
              className="label-tape pointer-events-none absolute !text-[0.78rem] transition-[transform,opacity] duration-[650ms] [transition-timing-function:var(--ease-fluid)]"
              style={{
                left: `${s.chip.x}%`,
                top: `${s.chip.y}%`,
                opacity: i === active ? 1 : 0,
                transitionDelay: i === active ? "320ms" : "0ms",
                transform: reducedNow ? "none" : i === active ? `translateZ(${s.chip.z}px)` : "translateZ(0px) scale(0.8)",
              }}
              aria-hidden="true"
            >
              {s.chip.text}
            </span>
          ) : null
        )}

        {/* The tutor steps out beside the feedback screen. */}
        <img
          src={tutor.src}
          alt={active === tutor.step ? tutor.alt : ""}
          aria-hidden={active !== tutor.step}
          width={400}
          height={640}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute -bottom-10 -right-8 w-[36%] rounded-[1.4rem] shadow-[0_40px_70px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition-[opacity,transform] duration-[650ms] [transition-timing-function:var(--ease-fluid)]"
          style={{
            opacity: active === tutor.step ? 1 : 0,
            transitionDelay: active === tutor.step ? "220ms" : "0ms",
            transform: reducedNow ? "none" : active === tutor.step ? "translateZ(130px) rotate(2deg)" : "translateZ(0px) translateY(24px)",
          }}
        />
      </div>
    </div>
  );
};
