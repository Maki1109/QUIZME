/**
 * A board of die-cut stickers you can pick up and throw around.
 *
 * Motion rules (after Apple's fluid-interface guidance):
 *  - the sticker answers on pointer-down, not on release: it lifts (scale + a longer shadow) at once;
 *  - while held it tracks the finger 1:1 and keeps the point where it was grabbed;
 *  - past the edge of the board it rubber-bands instead of stopping dead;
 *  - on release the fling velocity is handed to a spring whose target is where that momentum
 *    would have carried it, so there is no seam between dragging and gliding;
 *  - a moving sticker can be caught mid-flight: every gesture starts from the live value;
 *  - a hard throw may overshoot a little, a gentle drop settles without bounce;
 *  - with reduced motion a sticker simply stays where it is dropped.
 */

import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

export type StickerSpec = {
  id: string;
  src: string;
  /** Intrinsic size of the artwork (CSS px), used to reserve the right aspect ratio. */
  w: number;
  h: number;
  /** Desktop placement: left %, top %, width % of the board. */
  d: [number, number, number];
  /** Phone placement; omit to hide the sticker on small screens. */
  m?: [number, number, number];
  /** Extra resting rotation in degrees (the artwork already carries its own tilt). */
  rot?: number;
};

type Body = {
  el: HTMLImageElement;
  rot: number;
  x: number; y: number; vx: number; vy: number; tx: number; ty: number; zeta: number;
  tilt: number; vtilt: number; tiltTarget: number;
  s: number; vs: number; sTarget: number; sZeta: number;
  dragging: boolean; pointerId: number; grabX: number; grabY: number;
  samples: { t: number; x: number; y: number }[];
  minX: number; maxX: number; minY: number; maxY: number;
};

const STIFFNESS = 150;          // position spring
const DECELERATION = 0.992;     // per-millisecond decay used to project a fling
const TILT_PER_SPEED = 0.011;   // degrees per px/s of sideways speed
const MAX_TILT = 9;

/** Distance a fling at `v` px/s would still travel. */
const project = (v: number) => (v / 1000) * (DECELERATION / (1 - DECELERATION));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Progressive resistance: the further past the limit, the less the sticker follows. */
const band = (over: number, dim: number) => (1 - 1 / ((over * 0.55) / dim + 1)) * dim;
const rubber = (v: number, lo: number, hi: number, dim = 140) =>
  v < lo ? lo - band(lo - v, dim) : v > hi ? hi + band(v - hi, dim) : v;

const springStep = (pos: number, vel: number, target: number, k: number, zeta: number, h: number): [number, number] => {
  const a = -k * (pos - target) - 2 * zeta * Math.sqrt(k) * vel;
  const v = vel + a * h;
  return [pos + v * h, v];
};

export const StickerField = ({
  items,
  className = "",
  style,
  onFirstGrab,
  introDelay = 250,
}: {
  items: StickerSpec[];
  className?: string;
  style?: CSSProperties;
  onFirstGrab?: () => void;
  introDelay?: number;
}) => {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const bodies = useRef(new Map<string, Body>());
  const raf = useRef(0);
  const last = useRef(0);
  const zTop = useRef(10);
  const reduced = useRef(false);
  const grabbed = useRef(false);

  const measure = useCallback((b: Body) => {
    const field = fieldRef.current;
    if (!field) return;
    const pad = 4;
    const minX = pad - b.el.offsetLeft;
    const maxX = field.clientWidth - b.el.offsetLeft - b.el.offsetWidth - pad;
    const minY = pad - b.el.offsetTop;
    const maxY = field.clientHeight - b.el.offsetTop - b.el.offsetHeight - pad;
    b.minX = Math.min(minX, maxX); b.maxX = Math.max(minX, maxX);
    b.minY = Math.min(minY, maxY); b.maxY = Math.max(minY, maxY);
  }, []);

  const render = (b: Body) => {
    b.el.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) rotate(${(b.rot + b.tilt).toFixed(2)}deg) scale(${b.s.toFixed(4)})`;
  };

  const tick = useCallback((now: number) => {
    const dt = Math.min(0.034, Math.max(0.001, (now - last.current) / 1000));
    last.current = now;
    let busy = false;
    for (const b of bodies.current.values()) {
      // A held sticker that stops moving should hang straight again.
      if (b.dragging && b.samples.length && now - b.samples[b.samples.length - 1].t > 60) b.tiltTarget = 0;
      const n = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / n;
      for (let i = 0; i < n; i += 1) {
        if (!b.dragging) {
          [b.x, b.vx] = springStep(b.x, b.vx, b.tx, STIFFNESS, b.zeta, h);
          [b.y, b.vy] = springStep(b.y, b.vy, b.ty, STIFFNESS, b.zeta, h);
        }
        [b.s, b.vs] = springStep(b.s, b.vs, b.sTarget, 420, b.sZeta, h);
        [b.tilt, b.vtilt] = springStep(b.tilt, b.vtilt, b.tiltTarget, 170, 0.62, h);
      }
      const resting =
        !b.dragging &&
        Math.abs(b.x - b.tx) < 0.15 && Math.abs(b.y - b.ty) < 0.15 && Math.abs(b.vx) < 3 && Math.abs(b.vy) < 3 &&
        Math.abs(b.s - b.sTarget) < 0.002 && Math.abs(b.vs) < 0.02 &&
        Math.abs(b.tilt - b.tiltTarget) < 0.05 && Math.abs(b.vtilt) < 0.5;
      if (resting) {
        b.x = b.tx; b.y = b.ty; b.vx = 0; b.vy = 0; b.s = b.sTarget; b.vs = 0; b.tilt = b.tiltTarget; b.vtilt = 0;
      } else {
        busy = true;
      }
      render(b);
    }
    raf.current = busy ? requestAnimationFrame(tick) : 0;
  }, []);

  const wake = useCallback(() => {
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  // Register each <img>; the element's style is owned by the loop from here on.
  const register = (spec: StickerSpec) => (el: HTMLImageElement | null) => {
    // React re-runs inline refs on every render (null, then the node): keep the body, it holds live motion state.
    if (!el || bodies.current.get(spec.id)?.el === el) return;
    bodies.current.set(spec.id, {
      el, rot: spec.rot ?? 0,
      x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, zeta: 1,
      tilt: 0, vtilt: 0, tiltTarget: 0,
      s: 1, vs: 0, sTarget: 1, sZeta: 1,
      dragging: false, pointerId: -1, grabX: 0, grabY: 0, samples: [],
      minX: 0, maxX: 0, minY: 0, maxY: 0,
    });
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const onMq = () => { reduced.current = mq.matches; };
    mq.addEventListener("change", onMq);

    // Entrance, once the board scrolls into view: stickers are slapped on one after another.
    const timers: number[] = [];
    for (const b of bodies.current.values()) {
      if (!reduced.current) { b.s = 1.32; b.sZeta = 0.72; }
      render(b);
    }
    const intro = () => {
      let i = 0;
      for (const b of bodies.current.values()) {
        if (reduced.current) { b.s = 1; b.el.style.opacity = "1"; render(b); }
        else timers.push(window.setTimeout(() => { b.el.style.opacity = "1"; b.sTarget = 1; wake(); }, introDelay + i * 65));
        i += 1;
      }
    };
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "undefined" || !fieldRef.current) intro();
    else {
      io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { io?.disconnect(); intro(); } }, { threshold: 0.15 });
      io.observe(fieldRef.current);
    }

    // Layout percentages move with the board; keep every sticker inside after a resize.
    const onResize = () => {
      for (const b of bodies.current.values()) {
        if (b.dragging) continue;
        measure(b);
        b.tx = clamp(b.tx, b.minX, b.maxX);
        b.ty = clamp(b.ty, b.minY, b.maxY);
      }
      wake();
    };
    window.addEventListener("resize", onResize);
    return () => {
      io?.disconnect();
      mq.removeEventListener("change", onMq);
      window.removeEventListener("resize", onResize);
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [introDelay, measure, wake]);

  const onDown = (id: string) => (e: ReactPointerEvent<HTMLImageElement>) => {
    const b = bodies.current.get(id);
    if (!b || b.dragging || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    b.el.setPointerCapture(e.pointerId);
    measure(b);
    b.dragging = true;
    b.pointerId = e.pointerId;
    // Grab offset against the live position: catching a gliding sticker never makes it jump.
    b.grabX = e.clientX - b.x;
    b.grabY = e.clientY - b.y;
    b.vx = 0; b.vy = 0;
    b.samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
    b.sTarget = reduced.current ? 1 : 1.07;
    b.sZeta = 1;
    zTop.current += 1;
    b.el.style.zIndex = String(zTop.current);
    b.el.classList.add("is-held");
    if (!grabbed.current) { grabbed.current = true; onFirstGrab?.(); }
    wake();
  };

  const onMove = (id: string) => (e: ReactPointerEvent<HTMLImageElement>) => {
    const b = bodies.current.get(id);
    if (!b || !b.dragging || e.pointerId !== b.pointerId) return;
    b.x = rubber(e.clientX - b.grabX, b.minX, b.maxX);
    b.y = rubber(e.clientY - b.grabY, b.minY, b.maxY);
    b.tx = b.x; b.ty = b.y;
    const prev = b.samples[b.samples.length - 1];
    b.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (b.samples.length > 2 && e.timeStamp - b.samples[0].t > 90) b.samples.shift();
    const dtMs = e.timeStamp - prev.t;
    if (!reduced.current && dtMs > 0) {
      b.tiltTarget = clamp(((e.clientX - prev.x) / dtMs) * 1000 * TILT_PER_SPEED, -MAX_TILT, MAX_TILT);
    }
    wake();
  };

  const release = (id: string, cancelled: boolean) => (e: ReactPointerEvent<HTMLImageElement>) => {
    const b = bodies.current.get(id);
    if (!b || !b.dragging || e.pointerId !== b.pointerId) return;
    b.dragging = false;
    if (b.el.hasPointerCapture(e.pointerId)) b.el.releasePointerCapture(e.pointerId);
    b.el.classList.remove("is-held");

    let vx = 0;
    let vy = 0;
    const first = b.samples[0];
    const lastSample = b.samples[b.samples.length - 1];
    const span = lastSample.t - first.t;
    // A finger that paused before letting go is a drop, not a throw.
    if (!cancelled && !reduced.current && span > 8 && e.timeStamp - lastSample.t < 70) {
      vx = ((lastSample.x - first.x) / span) * 1000;
      vy = ((lastSample.y - first.y) / span) * 1000;
    }
    b.vx = vx; b.vy = vy;
    b.tx = clamp(b.x + project(vx), b.minX, b.maxX);
    b.ty = clamp(b.y + project(vy), b.minY, b.maxY);
    b.zeta = Math.hypot(vx, vy) > 600 ? 0.82 : 1;
    b.sTarget = 1; b.sZeta = 1;
    b.tiltTarget = 0;
    b.samples = [];
    if (reduced.current) { b.x = b.tx; b.y = b.ty; b.vx = 0; b.vy = 0; b.tilt = 0; b.vtilt = 0; }
    wake();
  };

  return (
    <div ref={fieldRef} className={`pointer-events-none select-none ${className}`} style={style} aria-hidden="true">
      {items.map((s) => (
        <img
          key={s.id}
          ref={register(s)}
          src={s.src}
          alt=""
          width={s.w}
          height={s.h}
          draggable={false}
          decoding="async"
          className={`stk pointer-events-auto ${s.m ? "" : "max-lg:hidden"}`}
          style={{
            opacity: 0,
            "--dx": `${s.d[0]}%`, "--dy": `${s.d[1]}%`, "--dw": `${s.d[2]}%`,
            ...(s.m ? { "--mx": `${s.m[0]}%`, "--my": `${s.m[1]}%`, "--mw": `${s.m[2]}%` } : {}),
          } as CSSProperties}
          onPointerDown={onDown(s.id)}
          onPointerMove={onMove(s.id)}
          onPointerUp={release(s.id, false)}
          onPointerCancel={release(s.id, true)}
          onLostPointerCapture={release(s.id, true)}
          onDragStart={(e) => e.preventDefault()}
        />
      ))}
    </div>
  );
};
