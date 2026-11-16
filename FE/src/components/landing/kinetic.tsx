/**
 * Kinetic headline: under the pointer, the letters of a big display heading lift and lean away
 * like a ripple following the cursor, and the emphasised serif word gets a chalk underline.
 *
 * - Transform-only (no reflow), one rAF loop, a critically damped spring per letter, so the ripple
 *   follows the pointer smoothly and settles back from wherever it is when the pointer leaves.
 * - Letters are grouped per word so line breaking is unchanged; Vietnamese graphemes stay whole.
 * - Screen readers get the original text once; the split copy is hidden from them.
 * - Fine pointers only; with reduced motion or on touch the heading renders untouched.
 */

import { Children, ReactNode, cloneElement, isValidElement, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { hasFinePointer, prefersReducedMotion, spring, stepSpring, type Spring } from "./motion3d";

// Intl.Segmenter is not in this project's TS lib yet; describe the bit we use.
type GraphemeSegmenter = { segment: (s: string) => Iterable<{ segment: string }> };
const SegmenterCtor = (Intl as unknown as { Segmenter?: new (locale: string, o: { granularity: "grapheme" }) => GraphemeSegmenter }).Segmenter;
const segmenter = SegmenterCtor ? new SegmenterCtor("vi", { granularity: "grapheme" }) : null;
const graphemes = (s: string) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));

const splitText = (text: string): ReactNode[] =>
  text.split(/(\s+)/).map((part, i) =>
    part === "" || /^\s+$/.test(part) ? (
      part
    ) : (
      <span key={i} className="k-word">
        {graphemes(part).map((g, j) => (
          <span key={j} className="k-ch">
            {g}
          </span>
        ))}
      </span>
    )
  );

/** Splits every text node into letters; Children.map keeps keys unique at every level. */
const splitNode = (node: ReactNode): ReactNode => {
  if (typeof node === "string" || typeof node === "number") return splitText(String(node));
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (el.type === "br" || el.props.children == null) return el;
    return cloneElement(el, undefined, Children.map(el.props.children, splitNode));
  }
  return node;
};

const LIFT = 0.15; // × font size
const GROW = 0.09;
const LEAN = 6; // deg

type Letter = { el: HTMLElement; lift: Spring; grow: Spring; lean: Spring; x: number; y: number };

export const Kinetic = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(hasFinePointer() && !prefersReducedMotion());
  }, []);

  const split = useMemo(() => (on ? Children.map(children, splitNode) : null), [on, children]);

  // Re-renders never reset the effect: letters are looked up again whenever the pointer comes in.
  useEffect(() => {
    const wrap = ref.current;
    const host = wrap?.parentElement;
    if (!on || !wrap || !host) return;
    let letters: Letter[] = [];
    let fontSize = 16;
    let px = 0;
    let py = 0;
    let inside = false;
    let raf = 0;
    let last = 0;

    const atRest = () => letters.every((l) => l.lift.value === 0 && l.lift.velocity === 0 && l.grow.value === 1 && l.lean.value === 0);
    // Page coordinates, so scrolling while hovering doesn't invalidate them.
    const measure = () => {
      fontSize = parseFloat(getComputedStyle(host).fontSize) || 16;
      const els = Array.from(wrap.querySelectorAll<HTMLElement>(".k-ch"));
      const old = new Map(letters.map((l) => [l.el, l]));
      letters = els.map((el) => {
        const r = el.getBoundingClientRect();
        const prev = old.get(el);
        return {
          el,
          lift: prev?.lift ?? spring(0, 0.32, 1),
          grow: prev?.grow ?? spring(1, 0.32, 1),
          lean: prev?.lean ?? spring(0, 0.32, 1),
          x: r.left + r.width / 2 + window.scrollX,
          y: r.top + r.height / 2 + window.scrollY,
        };
      });
    };
    const retarget = () => {
      const radius = fontSize * 1.15;
      for (const l of letters) {
        if (!inside) {
          l.lift.target = 0;
          l.grow.target = 1;
          l.lean.target = 0;
          continue;
        }
        const dx = l.x - px;
        const dy = l.y - py;
        const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
        l.lift.target = -LIFT * fontSize * influence;
        l.grow.target = 1 + GROW * influence;
        l.lean.target = Math.max(-1, Math.min(1, dx / radius)) * LEAN * influence;
      }
    };
    const tick = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000 || 1 / 60);
      last = now;
      let moving = false;
      for (const l of letters) {
        const a = stepSpring(l.lift, dt);
        const b = stepSpring(l.grow, dt);
        const c = stepSpring(l.lean, dt);
        if (a || b || c) moving = true;
        l.el.style.transform =
          l.lift.value === 0 && l.grow.value === 1 && l.lean.value === 0
            ? ""
            : `translate3d(0, ${l.lift.value.toFixed(2)}px, 0) rotate(${l.lean.value.toFixed(2)}deg) scale(${l.grow.value.toFixed(4)})`;
      }
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      retarget();
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const point = (e: PointerEvent) => {
      px = e.clientX + window.scrollX;
      py = e.clientY + window.scrollY;
    };
    const onEnter = (e: PointerEvent) => {
      // Measure at rest so a letter's current lift isn't baked into its home position.
      if (!letters.length || atRest()) measure();
      inside = true;
      point(e);
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!inside) return onEnter(e);
      point(e);
      wake();
    };
    const onLeave = () => {
      inside = false;
      wake();
    };
    const onResize = () => {
      if (atRest()) letters = [];
    };
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      letters.forEach((l) => (l.el.style.transform = ""));
    };
  }, [on]);

  if (!on) return <span ref={ref}>{children}</span>;
  return (
    <>
      <span className="sr-only">{children}</span>
      <span ref={ref} className="kinetic" aria-hidden="true">
        {split}
      </span>
    </>
  );
};
