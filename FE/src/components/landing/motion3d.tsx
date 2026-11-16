/**
 * Small physical-motion kit for 3D effects on the landing page.
 *
 * Springs are described the way Apple describes them — a damping ratio (1 = no overshoot) and a
 * response in seconds — and always continue from their live value and velocity, so any new target
 * (pointer moved, step changed) blends in without a jump.
 */

import { ReactNode, useEffect, useRef, type CSSProperties } from "react";

export type Spring = { value: number; velocity: number; target: number; response: number; damping: number };

export const spring = (value = 0, response = 0.4, damping = 1): Spring => ({ value, velocity: 0, target: value, response, damping });

/** Advances a spring by `dt` seconds (semi-implicit Euler, sub-stepped). Returns true while moving. */
export const stepSpring = (s: Spring, dt: number) => {
  const k = (2 * Math.PI / s.response) ** 2;
  const c = 2 * s.damping * Math.sqrt(k);
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  for (let i = 0; i < n; i += 1) {
    s.velocity += (-k * (s.value - s.target) - c * s.velocity) * h;
    s.value += s.velocity * h;
  }
  if (Math.abs(s.value - s.target) < 0.001 && Math.abs(s.velocity) < 0.01) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  return true;
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Tilts its content toward the pointer, like a card held at arm's length, with a soft specular
 * highlight that follows. Pointer devices only; with reduced motion it stays flat.
 */
export const Tilt = ({
  children,
  className = "",
  style,
  max = 7,
  sheen = true,
  radius = "1.75rem",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
  sheen?: boolean;
  radius?: string;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    const rx = spring(0, 0.4, 1);
    const ry = spring(0, 0.4, 1);
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000 || 1 / 60);
      last = now;
      const a = stepSpring(rx, dt);
      const b = stepSpring(ry, dt);
      el.style.transform = `perspective(1100px) rotateX(${rx.value.toFixed(3)}deg) rotateY(${ry.value.toFixed(3)}deg)`;
      el.style.setProperty("--sheen-x", `${(50 + ry.value * 6).toFixed(1)}%`);
      el.style.setProperty("--sheen-o", (Math.min(1, Math.hypot(rx.value, ry.value) / max)).toFixed(3));
      raf = a || b ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry.target = px * 2 * max;
      rx.target = -py * 2 * max;
      wake();
    };
    const onLeave = () => {
      rx.target = 0;
      ry.target = 0;
      wake();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [max]);

  return (
    <div ref={ref} className={`relative will-change-transform ${className}`} style={{ transformStyle: "preserve-3d", ...style }}>
      {children}
      {sheen && (
        <span
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            borderRadius: radius,
            opacity: "var(--sheen-o, 0)",
            background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) var(--sheen-x, 50%), transparent 70%)",
            mixBlendMode: "soft-light",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
